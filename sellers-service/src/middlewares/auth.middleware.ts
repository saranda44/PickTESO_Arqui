import { Request, Response, NextFunction } from "express";
import { ForbiddenError, UnauthorizedError } from "../errors";

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];

    if (!userId || !userRole) {
        throw new UnauthorizedError("No autorizado.");
    }

    req.user = {
        id: Number(userId),
        role: String(userRole),
        storeId: null, // Este campo se puede llenar posteriormente si es necesario
    };

    next();
};

export const requireRole = (...roles: string[]) => {

    return (req: Request, res: Response, next: NextFunction) => {

        if (!req.user) {
            throw new UnauthorizedError("No autorizado.");
        }

        if (!roles.includes(req.user.role)) {
            throw new ForbiddenError("No tienes permisos para realizar esta acción.");
        }
        next();
    };
};