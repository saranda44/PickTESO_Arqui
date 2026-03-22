import { Request, Response, NextFunction} from 'express';
import { OrderService } from '../services/orders.service';
import { CreateOrderDTO, UpdateOrderStatusDTO } from '../models/order.model';

export const OrderController = {
    createOrder,
    updateOrderStatus,
    confirmPayment,
    deleteOrder,
    getMyOrders,
    getOrdersByStore,
    getOrderById,
    getOrderByIdClient,
    validateOTPAndComplete
};

  
// POST /user/stores/:idStore/orders
// Creates a new order for the authenticated user
// Body: { items: [{ product_id, quantity }] }
async function createOrder(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;
        const idStore = Number(req.params.idStore);
        const body = req.body as CreateOrderDTO;

        const order = await OrderService.createOrder(userId, idStore, body);
        res.status(201).json({ order });
    } catch (err) {
        next(err);
    }
}


// PATCH /stores/:idStore/orders/:id/status
// Updates the status of an order
// Body: { status }
async function updateOrderStatus(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const storeId = Number(req.params.idStore);
        const userId = req.user!.id;

        const { status } = req.body as UpdateOrderStatusDTO;

        const order = await OrderService.updateOrderStatus(orderId, { status }, storeId, userId);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}


// PATCH /orders/:id/pay
// Updates the status of an order
async function confirmPayment(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const order = await OrderService.confirmPayment(orderId);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}

// ---------------------------------------------------------
// PATCH /stores/:storeId/orders/:id/complete
// Store validates customer OTP to complete the order at pickup
// Body: { otp }
// ---------------------------------------------------------
async function validateOTPAndComplete(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const storeId = Number(req.params.storeId);

        const { otp } = req.body;

        const userId = (req as any).user.id;
        const order = await OrderService.validateOTPAndComplete(orderId, otp, storeId, userId);
        res.json({ data: order });
    } catch (err) {
        next(err);
    }
}

// DELETE /orders/:id/cancel
// Cancels an order
async function deleteOrder(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const order = await OrderService.deleteOrder(orderId);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}

//============================================================================================================

// GET /user/orders
// Returns all orders for the authenticated user
async function getMyOrders(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;
        const orders = await OrderService.getOrdersByUser(userId);
        res.json({ orders });
    } catch (err) {
        next(err);
    }
}


// GET /stores/:storeId/orders
// Returns all orders for a store (store_admin only)
async function getOrdersByStore(req: Request, res: Response, next: NextFunction) {
    try {
        const userId = req.user!.id;
        const storeId = Number(req.params.idStore);
        const orders = await OrderService.getOrdersByStore(storeId, userId);
        res.json({ orders });
    } catch (err) {
        next(err);
    }
}


// GET /stores/:idStore/orders/:id
// Returns a single order with its products
async function getOrderById(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const storeId = Number(req.params.idStore);
        const userId = req.user!.id;
        const order = await OrderService.getOrderById(orderId, storeId, userId);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}


// GET /user/orders/:id
// Returns a single order with its products for a client
async function getOrderByIdClient(req: Request, res: Response, next: NextFunction) {
    try {
        const orderId = Number(req.params.id);
        const userId = req.user!.id;
        const order = await OrderService.getOrderByIdClient(orderId, userId);
        res.json({ order });
    } catch (err) {
        next(err);
    }
}