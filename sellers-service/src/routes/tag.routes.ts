import { Router } from "express";
import { TagController } from "../controllers/tag.controller";
import { authMiddleware } from "../middlewares/auth.middleware";
import { ownsStore, ownsTag } from "../middlewares/ownership.middleware";

const router = Router();
const tagController = new TagController();

// Rutas con Middleware de autenticación y autorización
// router.post("/", authMiddleware, ownsStore(req => Number(req.body.store_id)), tagController.createTag);
// router.get("/store/:store_id", authMiddleware, ownsStore(req => Number(req.params.store_id)), tagController.getTagsByStoreId);
// router.get("/:id", authMiddleware, tagController.getTagById);
// router.put("/:id", authMiddleware, ownsTag, tagController.updateTag);
// router.delete("/:id", authMiddleware, ownsTag, tagController.softDeleteTag);



// Rutas sin Middleware de autenticación y autorización
router.post("/",ownsStore(req => Number(req.body.store_id)), tagController.createTag);
router.get("/store/:store_id", tagController.getTagsByStoreId);
router.get("/:id", tagController.getTagById);
router.put("/:id", ownsTag, tagController.updateTag);
router.delete("/:id", ownsTag, tagController.softDeleteTag);

export default router;