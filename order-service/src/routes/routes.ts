import { Router, json } from "express";
import { OrderController } from "../controllers/orders.controller";
import { validateOrderIdParam } from '../middlewares/orders.validation.middleware';

import customerOrderRoutes from './orders.customer.routes';
import storeOrderRoutes from './orders.store.route';
import { userFromHeaders } from "../middlewares/user-from-headers.middleware";

const router = Router();

// Middleware para parsear JSON
router.use(json());

//---------------------------------------------------------
// Payment service routes (no auth, called by payment service)

router.use(userFromHeaders)

//PATCH /orders/:id/confirm-payment — update status to paid
// only payment service can update to paid
router.patch('/orders/:id/confirm-payment', validateOrderIdParam, OrderController.confirmPayment);

// DELETE /orders/:id/cancel — cancel an order (called by payment service when payment fails)
router.delete('/orders/:id/cancel', validateOrderIdParam, OrderController.deleteOrder);


router.use('/stores', storeOrderRoutes);
router.use('/user', customerOrderRoutes);


export default router;