import { Router, json } from "express";
import { OrderController } from "../controllers/orders.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";

import customerOrderRoutes from './orders.customer.routes';
import storeOrderRoutes from './orders.store.route';

const router = Router();

// Middleware para parsear JSON
router.use(json());

//---------------------------------------------------------
// Payment service routes (no auth, called by payment service)

//PATCH /orders/:id/pay — update status to paid
// only payment service can update to paid
router.patch('/orders/:id/pay', OrderController.confirmPayment);

// DELETE /orders/:id/cancel — cancel an order (called by payment service when payment fails)
router.delete('/orders/:id/cancel', OrderController.deleteOrder);


router.use('/stores', storeOrderRoutes);
router.use('/user', customerOrderRoutes);


export default router;