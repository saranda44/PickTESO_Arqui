import { Router } from "express";
import { StoreController } from "../controllers/store.controller";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const storeController = new StoreController();
const productController = new ProductController();

// GET /api/stores
router.get("/", storeController.getAll);

// GET /api/stores/:id
router.get("/:id", storeController.getById);

// GET /api/stores/:storeId/products
// router.get("/:storeId/products", productController.getByStoreIdWithTags);

export default router;