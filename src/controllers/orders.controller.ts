import { Request, Response } from 'express';
import { OrderService } from '../services/orders.service';
import { CreateOrderDTO, UpdateOrderStatusDTO, OrderStatus } from '../models/order.model';

const VALID_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED
];

function handleError(err: any, res: Response): void {
    const statusCode = err.statusCode ?? 500;
    const message = statusCode < 500 ? err.message : 'Internal server error';
    res.status(statusCode).json({ error: message });
}

export const OrderController = {
    createOrder,
    updateOrderStatus,
    confirmPayment,
    deleteOrder,
    getMyOrders,
    getOrdersByStore,
    getOrderById,
    getOrderByIdClient
};

  
// POST /user/stores/:idStore/orders
// Creates a new order for the authenticated user
// Body: { items: [{ product_id, quantity }] }
async function createOrder(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const idStore = Number(req.params.idStore);
        const body = req.body as CreateOrderDTO;

        // validation
        if (isNaN(idStore)) {
            res.status(400).json({ error: 'Invalid idStore' });
            return;
        }

        if (!Array.isArray(body.items) || body.items.length === 0) {
            res.status(400).json({ error: 'items must be a non-empty array' });
            return;
        }

        for (const item of body.items) {
            if (!item.product_id || typeof item.product_id !== 'number') {
                res.status(400).json({ error: 'Each item must have a valid product_id' });
                return;
            }
            if (!item.quantity || typeof item.quantity !== 'number' || item.quantity < 1) {
                res.status(400).json({ error: 'Each item must have a quantity >= 1' });
                return;
            }
        }

        const order = await OrderService.createOrder(userId, idStore, body);
        res.status(201).json({ order });
    } catch (err) {
        handleError(err, res);
    }
}


// PATCH /stores/:idStore/orders/:id/status
// Updates the status of an order
// Body: { status }
async function updateOrderStatus(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        const storeId = Number(req.params.idStore);
        const userId = (req as any).user.id;
        if (isNaN(orderId)) {
            res.status(400).json({ error: 'Invalid order id' });
            return;
        }

        const { status } = req.body as UpdateOrderStatusDTO;

        if (!status || !VALID_STATUSES.includes(status)) {
        res.status(400).json({
            error: `status must be one of: ${VALID_STATUSES.join(', ')}`,
        });
        return;
        }

        const order = await OrderService.updateOrderStatus(orderId, { status }, storeId, userId);
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}


// PATCH /orders/:id/pay
// Updates the status of an order
async function confirmPayment(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        const order = await OrderService.confirmPayment(orderId);
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}

// DELETE /orders/:id/cancel
// Cancels an order
async function deleteOrder(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
            res.status(400).json({ error: 'Invalid order id' });
            return;
        }
        const order = await OrderService.deleteOrder(orderId);
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}

//============================================================================================================

// GET /user/orders
// Returns all orders for the authenticated user
async function getMyOrders(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const orders = await OrderService.getOrdersByUser(userId);
        res.json({ orders });
    } catch (err) {
        handleError(err, res);
    }
}


// GET /stores/:storeId/orders
// Returns all orders for a store (store_admin only)
async function getOrdersByStore(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const storeId = Number(req.params.idStore);
        if (isNaN(storeId)) {
            res.status(400).json({ error: 'Invalid storeId' });
            return;
        }
        const orders = await OrderService.getOrdersByStore(storeId, userId);
        res.json({ orders });
    } catch (err) {
        handleError(err, res);
    }
}


// GET /stores/:idStore/orders/:id
// Returns a single order with its products
async function getOrderById(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        const storeId = Number(req.params.idStore);
        const userId = (req as any).user.id;
        if (isNaN(orderId)) {
            res.status(400).json({ error: 'Invalid order id' });
            return;
        }
        if (isNaN(storeId)) {
            res.status(400).json({ error: 'Invalid store id' });
            return;
        }
        const order = await OrderService.getOrderById(orderId, storeId, userId);
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}


// GET /user/orders/:id
// Returns a single order with its products for a client
async function getOrderByIdClient(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        const userId = (req as any).user.id;
        if (isNaN(orderId)) {
            res.status(400).json({ error: 'Invalid order id' });
            return;
        }
        const order = await OrderService.getOrderByIdClient(orderId, userId);
        res.json({ order });
    } catch (err) {
        console.log(err);
        handleError(err, res);
    }
}