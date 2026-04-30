import { Router } from "express";
import { UserController } from "../controllers/user.controller";

const router = Router();
const userController = new UserController();

// GET /api/user
router.get("/", userController.getUser);

export default router;
