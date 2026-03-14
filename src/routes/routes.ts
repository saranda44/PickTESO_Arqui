import { Router, json } from "express";
import orderRoutes from './orders.routes';

const router = Router();

// Middleware para parsear JSON
router.use(json());

router.use('/orders', orderRoutes);

export default router;