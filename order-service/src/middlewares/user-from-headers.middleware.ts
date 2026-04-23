import { Request, Response, NextFunction } from "express";

export const userFromHeaders = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const storeId = req.headers["x-store-id"];

    if (userId) {
        req.user = {
            id: Number(userId),
            role: userRole as "customer" | "platform_admin" | "store_admin", // Asegúrate de que el tipo de rol sea correcto
            storeId: storeId ? Number(storeId) : null,
        };
    }

    next();
};
