import { OrderRepository } from '../repositories/order.repository';
import { getProductFromCatalog, getStoreFromCatalog } from '../clients/catalog.client';
import { getProductStock, deductInventory, restoreInventory } from '../clients/store-admin.client'
import { requestRefund, createPaymentIntent } from '../clients/payment.client';
import {
    notifyOrderConfirmed,
    notifyOrderStatusUpdated,
    notifyOrderCancelledByStore,
    notifyOrderCancelledByPayment,
} from '../clients/notification.client';
import {
    CreateOrderDTO,
    Order,
    OrderStatus,
    OrderWithItems,
    OrderWithProducts,
    UpdateOrderStatusDTO,
} from '../models/order.model';
import {
    BadRequestError,
    ConflictError,
    ForbiddenError,
    NotFoundError,
} from '../errors';
import { generateOTP, validateOTP } from '../helpers/otp.helper';


// Valid status transitions for store_admin role
// Prevents illegal state changes (going from completed → preparing)
const STORE_ADMIN_TRANSITIONS: Record<OrderStatus, OrderStatus[]> = {
    pending: [],                      // store cannot touch a pending (unpaid) order
    paid: [OrderStatus.PREPARING, OrderStatus.CANCELLED],
    preparing: [OrderStatus.READY],
    ready: [OrderStatus.COMPLETED],
    completed: [],
    cancelled: [],
};

function isValidTransition(current: OrderStatus, next: OrderStatus): boolean {
    return STORE_ADMIN_TRANSITIONS[current]?.includes(next) ?? false;
}

// Helper function to validate that a store exists and belongs to the user (store_admin)
async function validateStoreOwner(storeId: number, userId: number): Promise<void> {
    // validate store exists and belongs to the user (store_admin)
    const store = await getStoreFromCatalog(storeId);
    if (!store) {
        throw new NotFoundError('Store not found or inactive');
    }
    if (Number(store.admin_id) !== userId) {
        throw new ForbiddenError('Unauthorized - store does not belong to this user');
    }
}

// Helper function to restore inventory for all products in an order (used when cancelling a paid order)
async function restoreInventoryForOrder(orderId: number): Promise<void> {
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order || order.items.length === 0) return;

    await restoreInventory(
        order.items.map((i) => ({ product_id: i.product_id, quantity: i.quantity }))
    );
}


export const OrderService = {
    createOrder,
    updateOrderStatus,
    deleteOrderByStore,
    confirmPayment,
    deleteOrder,
    getOrdersByUser,
    getOrdersByStore,
    getOrderById,
    getOrderByIdClient,
    validateOTPAndComplete
}

type DeleteOrderByStoreResult = {
    order: Order;
    alreadyCancelled: boolean;
};



// Create a new order
// Steps:
//   1. Validate store exists
//   2. Validate each product exists, has stock and belongs to the store
//   3. Calculate total using prices from catalog
//   4. Persist order + order_products in a transaction
//   5. Deduct inventory (store-admin service)
async function createOrder(userId: number, idStore: number, dto: CreateOrderDTO): Promise<OrderWithItems> {
    // 1. Validate store
    const store = await getStoreFromCatalog(idStore);
    if (!store) {
        throw new NotFoundError('Store not found or inactive');
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
            throw new NotFoundError(`Product ${item.product_id} not found or inactive`);
        }

        //validate product belongs to the store
        if (product.store_id !== idStore) {
            throw new BadRequestError(
                `Product ${item.product_id} does not belong to store ${idStore}`
            );
        }

        //validate stock availability in store-admin service
        const inventoryLevels = await getProductStock(item.product_id);
        if (inventoryLevels < item.quantity) {
            throw new BadRequestError(`Insufficient inventory for product ${item.product_id}`);
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

        // create payment intent in payments service (called by orders when a new order is created and needs to be paid)
        try {
            const paymentIntent = await createPaymentIntent(order.id, total);
            if (!paymentIntent) {
                throw new Error('Failed to create payment intent');
            }
        } catch (err) {
            throw new Error('Failed to create payment intent, please try again');
        }

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
async function updateOrderStatus(orderId: number, dto: UpdateOrderStatusDTO, storeId: number, userId: number): Promise<Order> {
    // Validate store ownership and order existence + status transition rules
    await validateStoreOwner(storeId, userId);

    //validate order exists
    const existing = await OrderRepository.findByIdWithProducts(orderId);
    if (!existing) {
        throw new NotFoundError('Order not found');
    }

    // completed status requires OTP — use validateOTPAndComplete instead
    if (dto.status === OrderStatus.COMPLETED) {
        throw new BadRequestError('Use PATCH /orders/:id/complete to complete an order');
    }

    // cancellation must go through DELETE endpoint
    if (dto.status === OrderStatus.CANCELLED) {
        throw new BadRequestError('Use DELETE /stores/:idStore/orders/:id to cancel an order');
    }

    //validate status transition is allowed
    if (!isValidTransition(existing.status, dto.status)) {
        throw new BadRequestError(`Invalid status transition: ${existing.status} -> ${dto.status}`);
    }

    //uptade status
    const updated = await OrderRepository.updateStatus(
        orderId,
        dto.status,
        existing.status
    );

    if (!updated) {
        throw new ConflictError('Unable to change order status, please retry');
    }

    // Fetch order to get customer email for notification
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found after update');    
    }

    // Notify customer about status update
    notifyOrderStatusUpdated(orderId, order.customer.email, dto.status, order);

    return updated;
}


// Store cancellation endpoint
// Valid only for orders in paid status
async function deleteOrderByStore(orderId: number, storeId: number, userId: number): Promise<DeleteOrderByStoreResult> {
    await validateStoreOwner(storeId, userId);

    const existing = await OrderRepository.findByIdWithProducts(orderId);
    if (!existing) {
        throw new NotFoundError('Order not found');
    }

    if (Number(existing.store_id) !== storeId) {
        throw new ForbiddenError('Unauthorized - order does not belong to this store');
    }

    if (existing.status === OrderStatus.CANCELLED) {
        return { order: existing, alreadyCancelled: true };
    }

    if (existing.status !== OrderStatus.PAID) {
        throw new BadRequestError("Only orders in 'paid' status can be cancelled by the store");
    }

    const updated = await OrderRepository.updateStatus(
        orderId,
        OrderStatus.CANCELLED,
        OrderStatus.PAID
    );

    if (!updated) {
        throw new ConflictError('Unable to cancel order, please retry');
    }

    requestRefund(orderId);
    await restoreInventoryForOrder(orderId);

    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found after cancellation');
    }

    notifyOrderCancelledByStore(orderId, order.customer.email, order);

    return { order: updated, alreadyCancelled: false };
}


// ---------------------------------------------------------
// Validate OTP and mark order as completed — store_admin only
// The store receives the OTP from the customer at pickup
// and sends it here to validate before completing the order
// ---------------------------------------------------------
async function validateOTPAndComplete(
    orderId: number,
    otp: string,
    storeId: number,
    userId: number
): Promise<Order> {
    await validateStoreOwner(storeId, userId);

    const existing = await OrderRepository.findById(orderId);
    if (!existing) throw new NotFoundError('Order not found');

    if (Number(existing.store_id) !== storeId) {
        throw new ForbiddenError('Unauthorized — order does not belong to this store');
    }

    if (existing.status !== OrderStatus.READY) {
        throw new BadRequestError('Order must be in ready status to be completed');
    }

    // Validate OTP using userId from the order and orderId
    const isValid = validateOTP(otp, existing.user_id, orderId);
    if (!isValid) throw new BadRequestError('Invalid or incorrect OTP code');

    const updated = await OrderRepository.updateStatus(orderId, OrderStatus.COMPLETED, OrderStatus.READY);
    if (!updated) throw new ConflictError('Unable to complete order, please retry');

    // Fetch order to get customer email for notification
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found after update');
    }
    // Notify customer about status update
    notifyOrderStatusUpdated(orderId, order.customer.email, OrderStatus.COMPLETED, order);

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
            throw new NotFoundError('Order not found');
        }
        throw new BadRequestError(
            `Cannot confirm payment for order in status '${existing.status}' - only pending orders can be confirmed`
        );
    }

    // Fetch order details to get customer email, store email and userId for OTP
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }
    // Generate stateless OTP — not stored in DB
    const otp = generateOTP(order.user_id, orderId);

    // Notify customer (with OTP) and store (fire and forget)
    notifyOrderConfirmed(orderId, order.customer.email, order.store.email, otp, order);
    

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
            throw new NotFoundError('Order not found');
        }
        //if status transition was not allowed (not pending)
        throw new BadRequestError(
            `Cannot cancel order in status '${existing.status}' - only pending orders can be cancelled by the payment service`
        );
    }

    // Fetch order to get customer email
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }

    // Notify customer that payment failed
    notifyOrderCancelledByPayment(orderId, order.customer.email, order);

    // Restore inventory for all products in the cancelled order
    await restoreInventoryForOrder(orderId);

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
        throw new NotFoundError('Order not found');
    }
    if (Number(order.store_id) !== idStore) {
        throw new ForbiddenError('Unauthorized - order does not belong to this store');
    }
    return order;
}

// Get single order with its product for a client
async function getOrderByIdClient(orderId: number, userId: number): Promise<OrderWithProducts> {
    const order = await OrderRepository.findByIdWithProducts(orderId);
    if (!order) {
        throw new NotFoundError('Order not found');
    }
    if (Number(order.user_id) !== userId) {
        console.log(`Unauthorized access attempt by user ${userId} to order ${orderId} belonging to user ${order.user_id}`);
        throw new ForbiddenError('Unauthorized - order does not belong to this user');
    }
    return order;
}

