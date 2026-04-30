import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const productController = new ProductController();

// GET /api/products/:id
router.get("/:id", productController.getById);

// GET /api/catalog/products/by-ids?ids=1,2,3
router.get('/by-ids', productController.getByIds);

export default router;