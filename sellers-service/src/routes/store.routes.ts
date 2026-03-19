import { Router } from "express";
import { StoreController } from "../controllers/store.controller";
import { authMiddleware, requireRole } from "../middlewares/auth.middleware";
import { ownsStore } from "../middlewares/ownership.middleware";
import { upload } from "../services/s3.service";

const router = Router();
const storeController = new StoreController();

// Rutas con Middleware de autenticación y autorización
// router.post("/", authMiddleware, requireRole("platform_admin"), storeController.createStore);
// router.get("/admin/:admin_id", authMiddleware, storeController.getStoresByAdminId);
// router.get("/:id", storeController.getStoreById);
// router.put("/:id", authMiddleware, ownsStore(req => Number(req.params.id)), upload.single("image"), storeController.updateStore);
// router.delete("/:id", authMiddleware, ownsStore(req => Number(req.params.id)), storeController.deleteStore);



router.post("/", requireRole("platform_admin"), storeController.createStore);
router.get("/admin/:admin_id", storeController.getStoresByAdminId);
router.get("/:id", storeController.getStoreById);
router.put("/:id", upload.single("image"), storeController.updateStore);
router.delete("/:id", storeController.deleteStore);


export default router;