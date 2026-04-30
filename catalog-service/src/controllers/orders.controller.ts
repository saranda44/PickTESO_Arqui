import { Request, Response, NextFunction} from 'express';
import { OrderService } from '../services/orders.service';

export const OrderController = {
    getMyOrders,
};

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
