import { Router } from "express";
import { InventoryController } from "../controllers/inventory.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ownsInventoryEntry, ownsProduct } from "../middlewares/ownership.middleware";

const router = Router();
const inventoryController = new InventoryController();

// Middleware de autenticación y autorización para todas las rutas de inventario
// router.post("/", authMiddleware, ownsProduct(req => Number(req.body.product_id)), inventoryController.createInventoryEntry);
// router.delete("/:id", authMiddleware, ownsInventoryEntry, inventoryController.deleteInventoryEntry);
// router.get("/product/:product_id", inventoryController.getInventoryEntriesByProductId);
// router.get("/product/:product_id/stock", inventoryController.getStockByProductId);


router.post("/", ownsProduct(req => Number(req.body.product_id)), inventoryController.createInventoryEntry);
// router.delete("/:id", ownsInventoryEntry, inventoryController.deleteInventoryEntry);
// router.get("/product/:product_id", inventoryController.getInventoryEntriesByProductId);
router.get("/product/:product_id/stock", ownsProduct(req => Number(req.params.product_id)), inventoryController.getStockByProductId);

export default router;