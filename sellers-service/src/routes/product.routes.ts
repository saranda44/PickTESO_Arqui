import { Router } from "express";
import { ProductController } from "../controllers/product.controller";
import { ProductTagController } from "../controllers/productTag.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ownsProduct, ownsStore } from "../middlewares/ownership.middleware";
import { upload } from "../services/s3.service";

const router = Router();
const productController = new ProductController();
const productTagController = new ProductTagController();


// // Product routes
// router.post("/", authMiddleware, ownsStore(req => Number(req.body.store_id)), upload.single("image"), productController.createProduct);
// router.get("/store/:store_id", productController.getProductsWithTags);

// // Product tag routes — antes de /:id
// router.get("/:product_id/tags", productTagController.getTagsByProductId);
// router.put("/:product_id/tags", authMiddleware, ownsProduct(req => Number(req.params.product_id)), productTagController.replaceTagsForProduct);

// // Rutas dinámicas generales al final
// router.get("/:id", productController.getProductById);
// router.put("/:id", authMiddleware, ownsProduct(req => Number(req.params.id)), upload.single("image"), productController.updateProduct);
// router.delete("/:id", authMiddleware, ownsProduct(req => Number(req.params.id)), productController.deleteProduct);

// Product routes
router.post("/", upload.single("image"), productController.createProduct);
router.get("/store/:store_id", productController.getProductsWithTags);

// Product tag routes — antes de /:id
router.get("/:product_id/tags", productTagController.getTagsByProductId);
router.put("/:product_id/tags", productTagController.replaceTagsForProduct);

// Rutas dinámicas generales al final
router.get("/:id", productController.getProductById);
router.put("/:id", upload.single("image"), productController.updateProduct);
router.delete("/:id", productController.deleteProduct);

export default router;