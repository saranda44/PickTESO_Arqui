import { Router } from "express";
import storeRoutes from "./store.routes";
import productRoutes from "./product.routes";
import tagRoutes from "./tag.routes";
import inventoryRoutes from "./inventory.routes";

const router = Router();

router.use("/stores", storeRoutes);
router.use("/products", productRoutes);
router.use("/tags", tagRoutes);
router.use("/inventory", inventoryRoutes);

export default router;