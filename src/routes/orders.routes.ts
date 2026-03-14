import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);

// ---------------------------------------------------------
// Customer routes

// POST /orders — create a new order
router.post('/', requireRole('customer'), OrderController.createOrder);

// GET /orders/my — list user's orders
router.get('/my', OrderController.getMyOrders);

// GET /orders/:id — get single order with products
router.get('/:id', OrderController.getOrderById);


// ---------------------------------------------------------
// Store operator routes

// PATCH /orders/:id/status — update order status
// Both store_admin and platform_admin can update
router.patch('/:id/status',requireRole('store_admin', 'platform_admin'), OrderController.updateOrderStatus);

// DELETE /orders/:id — delete an order (customer can delete their own pending orders)
// cases: users can´t delete orders, store can cancel only if status pending, the order is cancelled if the payment fails
router.delete('/:id', requireRole('store_admin', 'platform_admin'), OrderController.deleteOrder);

// GET /orders/store/:storeId — list all orders for a store
router.get('/store/:storeId',requireRole('store_admin', 'platform_admin'),OrderController.getOrdersByStore);

export default router;