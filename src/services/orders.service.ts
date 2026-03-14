import { OrderRepository } from '../repositories/order.repository';
import { getProductFromCatalog, getStoreFromCatalog } from './catalog.service';
import {getProductStock, deductInventory, restoreInventory} from './store-admin.service'
import { requestRefund } from './payment.service';
import {
  CreateOrderDTO,
  Order,
  OrderStatus,
  OrderWithProducts,
  UpdateOrderStatusDTO,
} from '../models/order.model';


// Valid status transitions for store_admin role
// Prevents illegal state changes (going from completed → preparing)
const STORE_ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending:    [],                      // store cannot touch a pending (unpaid) order
    paid:       [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    preparing:  [OrderStatus.READY],
    ready:      [OrderStatus.COMPLETED],
    completed:  [],
    cancelled:  [],
};

function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    return STORE_ADMIN_TRANSITIONS[current]?.includes(next) ?? false;
}

async function validateStoreOwner(storeId: number, userId: number): Promise<void> {
    // validate store exists and belongs to the user (store_admin)
    const store = await getStoreFromCatalog(storeId);
    if (!store) {
        const err: any = new Error('Store not found or inactive');
        err.statusCode = 404;
        throw err;
    }
    if (Number(store.admin_id) !== userId) {
        const err: any = new Error('Unauthorized - store does not belong to this user');
        err.statusCode = 403;
        throw err;
    }
}


export const OrderService = {
    createOrder,
    updateOrderStatus,
    confirmPayment,
    deleteOrder,
    getOrdersByUser,
    getOrdersByStore,
    getOrderById,
    getOrderByIdClient
} 



// Create a new order
// Steps:
//   1. Validate store exists
//   2. Validate each product exists, has stock and belongs to the store
//   3. Calculate total using prices from catalog
//   4. Persist order + order_products in a transaction
//   5. Deduct inventory (store-admin service)
async function createOrder(userId: number, idStore:number, dto: CreateOrderDTO): Promise<OrderWithProducts> {
    // 1. Validate store
    const store = await getStoreFromCatalog(idStore);
    if (!store) {
        const err: any = new Error('Store not found or inactive');
        err.statusCode = 404;
        throw err;
    }

    // 2. Validate products and build items with prices
    const resolvedItems: {
        product_id: number;
        quantity: number;
        unit_price: number;
    }[] = [];

    for (const item of dto.items) {
        const product = await getProductFromCatalog(item.product_id);

        //validate product exists
        if (!product) {
            const err: any = new Error(`Product ${item.product_id} not found or inactive`);
            err.statusCode = 404;
            throw err;
        }

        //validate product belongs to the store
        if (product.store_id !== idStore) {
            const err: any = new Error(
            `Product ${item.product_id} does not belong to store ${idStore}`
            );
            err.statusCode = 400;
            throw err;
        }

        //validate stock availability in store-admin service
        const inventoryLevels = await getProductStock(item.product_id);
        if (inventoryLevels < item.quantity) {
            const err: any = new Error(
            `Insufficient inventory for product ${item.product_id}`
            );
            err.statusCode = 400;
            throw err;
        }

        // If all good, add to resolved items with price from catalog
        resolvedItems.push({
            product_id: item.product_id,
            quantity: item.quantity,
            unit_price: product.price,   // price always from catalog
        });
    }

    // 3. Calculate total
    const total = resolvedItems.reduce(
        (sum, item) => sum + item.unit_price * item.quantity,
        0
    );

    // 4. Persist in a transaction
    const client = await OrderRepository.getClient(); // get raw client for transaction control
    try {
        //BEGIN transaction
        //all operations must be successful to commit, otherwise rollback
        await client.query('BEGIN');

        //create base order
        const order = await OrderRepository.createOrder(
            client,
            userId,
            idStore,
            total
        );

        //create order products
        const items = await OrderRepository.createOrderProducts(
            client,
            order.id,
            resolvedItems
        );

        await client.query('COMMIT');

        // Deduct inventory in store-admin service
        await deductInventory(
            resolvedItems.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            }))
        );

        return { ...order, items };
    } catch (err) {
        await client.query('ROLLBACK');
        throw err;
    } finally {
        client.release();
    }
}


// Update order status — called by store_admin only
// Valid transitions: paid → preparing/cancelled, preparing → ready, ready → completed
async function updateOrderStatus(orderId: number,dto: UpdateOrderStatusDTO, storeId: number, userId: number): Promise<Order> {
    // Validate store ownership and order existence + status transition rules
    await validateStoreOwner(storeId, userId); 

    //validate order exists
    const existing = await OrderRepository.findById(orderId);
    if (!existing) {
        const err: any = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }

    //validate status transition is allowed
    if (!isValidTransition(existing.status, dto.status)) {
        const err: any = new Error(
            `Invalid status transition: ${existing.status} → ${dto.status}`
        );
        err.statusCode = 400;
        throw err;
    }

    //uptade status
    const updated = await OrderRepository.updateStatus(
        orderId,
        dto.status,
        existing.status
    );


    if (!updated) {
        const err: any = new Error('Unable to change order status, please retry');
        err.statusCode = 409;
        throw err;
    }

    // If the store cancelled a paid order, restore inventory
    if (dto.status === 'cancelled') {
        requestRefund(orderId); // request refund from payments service (if it was paid)
        const orderWithProducts = await OrderRepository.findByIdWithProducts(orderId);
        if (orderWithProducts && orderWithProducts.items.length > 0) {
            await restoreInventory(
                orderWithProducts.items.map((i) => ({
                    product_id: i.product_id,
                    quantity: i.quantity,
                }))
            );
        }
    }
    return updated;
}


// Confirm payment — called ONLY by the payments service
// Transitions order from pending → paid
async function confirmPayment(orderId: number): Promise<Order> {
    const updated = await OrderRepository.updateStatus(
        orderId,
        OrderStatus.PAID,
        OrderStatus.PENDING
    );

    if (!updated) {
        const existing = await OrderRepository.findById(orderId);
        if (!existing) {
            const err: any = new Error('Order not found');
            err.statusCode = 404;
            throw err;
        }
        const err: any = new Error(
            `Cannot confirm payment for order in status '${existing.status}' — only pending orders can be confirmed`
        );
        err.statusCode = 400;
        throw err;
    }

    return updated;
}



// Cancel order — called ONLY by the payments service
// Only valid when order is still in 'pending' (payment failed)
async function deleteOrder(orderId: number): Promise<Order> {

    //update status to cancelled only if it's still pending, 
    // otherwise fail (cannot cancel paid/preparing orders)
    const updated = await OrderRepository.updateStatus(
        orderId,
        OrderStatus.CANCELLED,
        OrderStatus.PENDING
    );

    if (!updated) {
        //if order doesn't exist
        const existing = await OrderRepository.findById(orderId);
        if (!existing) {
            const err: any = new Error('Order not found');
            err.statusCode = 404;
            throw err;
        }
        //if status transition was not allowed (not pending)
        const err: any = new Error(
            `Cannot cancel order in status '${existing.status}' — only pending orders can be cancelled by the payment service`
        );
        err.statusCode = 400;
        throw err;
    }

    // Restore inventory for all products in the cancelled order
    const orderWithProducts = await OrderRepository.findByIdWithProducts(orderId);
    if (orderWithProducts && orderWithProducts.items.length > 0) {
        await restoreInventory(
            orderWithProducts.items.map((i) => ({
            product_id: i.product_id,
            quantity: i.quantity,
            }))
        );
    }

    return updated;
}


// Get all orders for a user
async function getOrdersByUser(userId: number): Promise<Order[]> {
    return OrderRepository.findByUserId(userId);
}


// Get all orders for a store (used by store operators)
async function getOrdersByStore(storeId: number, userId: number): Promise<Order[]> {
    // validate store exists and belongs to the user (store_admin)
    await validateStoreOwner(storeId, userId);
    return OrderRepository.findByStoreId(storeId);
}

// Get single order with its products for a store
async function getOrderById(orderId: number, idStore: number, userId: number): Promise<OrderWithProducts> {
    const order = await OrderRepository.findByIdWithProducts(orderId);
    // Validate store ownership and order existence
    await validateStoreOwner(idStore, userId);
    if (!order) {
        const err: any = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }
    if(Number(order.store_id) !== idStore){
        const err: any = new Error('Unauthorized - order does not belong to this store');
        err.statusCode = 403;
        throw err;
    }
    return order;
}

// Get single order with its product for a client
async function getOrderByIdClient(orderId: number, userId: number): Promise<OrderWithProducts> {
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        const err: any = new Error('Order not found');
        err.statusCode = 404;
        throw err;
    }
    if(Number(order.user_id) !== userId){
        console.log(`Unauthorized access attempt by user ${userId} to order ${orderId} belonging to user ${order.user_id}`);
        const err: any = new Error('Unauthorized - order does not belong to this user');
        err.statusCode = 403;
        throw err;
    }
    return order;
}

