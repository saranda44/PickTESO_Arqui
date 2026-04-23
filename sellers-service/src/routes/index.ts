import { Router } from "express";
import storeRoutes from "./store.routes";
import productRoutes from "./product.routes";
import tagRoutes from "./tag.routes";
import inventoryRoutes from "./inventory.routes";
import { userFromHeaders } from "../middlewares/user-from-headers.middleware";

const router = Router();

router.use(userFromHeaders);

router.use("/stores", storeRoutes);
router.use("/products", productRoutes);
router.use("/tags", tagRoutes);
router.use("/inventory", inventoryRoutes);

export default router;