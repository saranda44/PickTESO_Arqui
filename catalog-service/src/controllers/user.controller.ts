import { Request, Response, NextFunction } from "express";
import { UserService } from "../services/user.service";

const userService = new UserService();

export class UserController {
    getUser = async (req: Request, res: Response, next: NextFunction) => {
        try {
            const userId = req.user!.id;
            const user = await userService.getUserById(userId);
            res.json(user);
        } catch (err) {
            next(err);
        }
    };
}