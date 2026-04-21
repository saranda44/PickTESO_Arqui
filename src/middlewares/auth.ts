import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';

export interface JwtPayload {
    id: number;
    email: string;
    role: string;
    firstName: string;
    storeId: number | null;
}api-gateway

/**
 * Verifies the JWT token from the Authorization header.
 * Attaches the decoded payload to req.user if valid.
 */
export const authenticate = (req: Request, res: Response, next: NextFunction) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        res.status(401).json({ error: 'Authorization token is required' });
        return;
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as JwtPayload;
        req.user = decoded;
        next();
    } catch (error) {
        res.status(401).json({ error: 'Invalid or expired token' });
    }
};

/**
 * Middleware factory that restricts access to specific roles.
 * Must be used after authenticate middleware.
 */
export const authorize = (...roles: string[]) => {
    return (req: Request, res: Response, next: NextFunction) => {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated' });
            return;
        }

        const { role } = req.user as JwtPayload;

        if (!roles.includes(role)) {
            res.status(403).json({ error: 'You do not have permission to access this resource' });
            return;
        }

        next();
    };
};