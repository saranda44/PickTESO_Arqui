import { Router } from "express";
import storeRoutes from "./store.routes";
import productRoutes from "./product.routes";

const router = Router();

router.use("/stores", storeRoutes);
router.use("/products", productRoutes);

export default router;