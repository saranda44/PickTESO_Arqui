import { Router } from "express";
import storeRoutes from "./store.routes";
import productRoutes from "./product.routes";
import customerOrderRoutes from './orders.customer.routes';
import userRoutes from './user.routes';

const router = Router();

router.use("/stores", storeRoutes);
router.use("/products", productRoutes);
router.use('/orders', customerOrderRoutes);
router.use('/user', userRoutes);

export default router;