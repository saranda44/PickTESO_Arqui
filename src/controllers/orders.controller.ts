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
    deleteOrder,
    getMyOrders,
    getOrdersByStore,
    getOrderById
};

  
// POST /orders
// Creates a new order for the authenticated user
// Body: { store_id, items: [{ product_id, quantity }] }
async function createOrder(req: Request, res: Response) {
    try {
        const userId = (req as any).user.id;
        const body = req.body as CreateOrderDTO;

        // validation
        if (!body.store_id || typeof body.store_id !== 'number') {
            res.status(400).json({ error: 'store_id is required and must be a number' });
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

        const order = await OrderService.createOrder(userId, body);
        res.status(201).json({ order });
    } catch (err) {
        handleError(err, res);
    }
}


// PATCH /orders/:id/status
// Updates the status of an order
// Body: { status }
async function updateOrderStatus(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
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

        const order = await OrderService.updateOrderStatus(orderId, { status });
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}


// DELETE /orders/:id
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


// GET /orders/my
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


// GET /orders/store/:storeId
// Returns all orders for a store (store_admin only)
async function getOrdersByStore(req: Request, res: Response) {
    try {
        const storeId = Number(req.params.storeId);
        if (isNaN(storeId)) {
            res.status(400).json({ error: 'Invalid storeId' });
            return;
        }
        const orders = await OrderService.getOrdersByStore(storeId);
        res.json({ orders });
    } catch (err) {
        handleError(err, res);
    }
}


// GET /orders/:id
// Returns a single order with its products
async function getOrderById(req: Request, res: Response) {
    try {
        const orderId = Number(req.params.id);
        if (isNaN(orderId)) {
            res.status(400).json({ error: 'Invalid order id' });
            return;
        }
        const order = await OrderService.getOrderById(orderId);
        res.json({ order });
    } catch (err) {
        handleError(err, res);
    }
}