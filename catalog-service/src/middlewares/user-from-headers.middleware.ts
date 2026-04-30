import { Request, Response, NextFunction } from "express";

export interface AuthUser {
    id: number;
    role: string;
    storeId: number | null;
}

declare global {
    namespace Express {
        interface Request {
            user?: AuthUser;
        }
    }
}

export const userFromHeaders = (req: Request, res: Response, next: NextFunction) => {
    const userId = req.headers["x-user-id"];
    const userRole = req.headers["x-user-role"];
    const storeId = req.headers["x-store-id"];

    if (userId) {
        req.user = {
            id: Number(userId),
            role: String(userRole),
            storeId: storeId ? Number(storeId) : null,
        };
    }

    next();
};
