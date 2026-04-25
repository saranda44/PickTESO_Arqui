import { Request, Response, NextFunction } from "express";

export const userFromHeaders = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const storeId = req.headers["x-store-id"];

    if (userId) {
        (req as any).user = {
            id: Number(userId),
            role: String(userRole),
            storeId: storeId ? Number(storeId) : null,
        };
    }

    next();
};
