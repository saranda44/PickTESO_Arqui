// src/middlewares/error.middleware.ts
import { Request, Response, NextFunction } from "express";
import { AppError } from "../errors";

export const errorMiddleware = (error: Error, req: Request, res: Response, next: NextFunction) => {
    console.error(error);

    if (error instanceof AppError) {
        return res.status(error.statusCode).json({
            error: error.name,
            message: error.message
        });
    }

    res.status(500).json({
        error: "InternalServerError",
        message: "Error interno del servidor"
    });
};