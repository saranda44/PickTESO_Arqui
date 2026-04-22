import { Router } from "express";
import { ProductController } from "../controllers/product.controller";

const router = Router();
const productController = new ProductController();

// GET /api/products/:id
router.get("/:id", productController.getById);

export default router;