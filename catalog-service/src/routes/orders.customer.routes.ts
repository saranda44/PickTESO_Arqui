import { Router } from 'express';
import { OrderController } from '../controllers/orders.controller';

const router = Router();

// GET /user/orders — list user's orders
router.get('/', OrderController.getMyOrders);


export default router;