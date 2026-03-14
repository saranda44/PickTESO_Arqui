import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------
// Customer routes

// POST /user/stores/:idStore/orders — create a new order
router.post('/stores/:idStore/orders', requireRole('customer'), OrderController.createOrder);

// GET /user/orders — list user's orders
router.get('/orders', requireRole('customer'), OrderController.getMyOrders);

// GET /user/orders/:id — get single user's order with products 
router.get('/orders/:id', requireRole('customer'), OrderController.getOrderByIdClient);

export default router;