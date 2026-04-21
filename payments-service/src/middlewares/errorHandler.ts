import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';

export const errorHandler = (
    error: unknown,
    req: Request,
    res: Response,
    next: NextFunction
) => {
    console.error(`[ERROR] ${req.method} ${req.path}`, error);

    if (error instanceof Stripe.errors.StripeError) {
        res.status(error.statusCode || 500).json({
            error: error.message,
            type: error.type,
            code: error.code,
        });
        return;
    }

    if (error instanceof Error) {
        res.status(500).json({
            error: error.message,
        });
        return;
    }

    res.status(500).json({
        error: 'Error interno del servidor',
    });
};