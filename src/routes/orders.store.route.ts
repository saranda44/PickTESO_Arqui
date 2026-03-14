import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';
import { authMiddleware, requireRole } from '../middlewares/auth.middleware';

const router = Router();

// All order routes require authentication
router.use(authMiddleware);


// ---------------------------------------------------------
// Store operator routes

// PATCH /stores/:idStore/orders/:id/status — update order status
// Both store_admin and platform_admin can update
router.patch('/:idStore/orders/:id/status', requireRole('store_admin', 'platform_admin'), OrderController.updateOrderStatus);

// DELETE /stores/:idStore/orders/:id — delete an order (customer cannot delete their own pending orders)
// cases: store can cancel only if status paid (no preparing)
router.delete('/:idStore/orders/:id', requireRole('store_admin', 'platform_admin'), OrderController.updateOrderStatus);

// GET /stores/:idStore/orders/:id — get single order with products (store_admin can view any order, customer can view only their own orders)
router.get('/:idStore/orders/:id', requireRole('store_admin', 'platform_admin'), OrderController.getOrderById);

// GET /stores/:idStore/orders — list all orders for a store
router.get('/:idStore/orders', requireRole('store_admin', 'platform_admin'),OrderController.getOrdersByStore);


export default router;