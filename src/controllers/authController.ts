import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import pool from '../db/clients';
import { JwtPayload } from '../middlewares/auth';

/**
 * Handles the Google OAuth2 callback.
 * Generates a JWT token and returns it to the client.
 */
export const googleCallback = (req: Request, res: Response) => {
    const user = req.user as JwtPayload;

    const token = jwt.sign(
        {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
        },
        process.env.JWT_SECRET as string,
        { expiresIn: '8h' }
    );

    res.status(200).json({
        token,
        user: {
            id: user.id,
            email: user.email,
            role: user.role,
            firstName: user.firstName,
        },
    });
};

/**
 * Registers a new user as customer.
 * Only for development purposes — in production all users would be pre-registered.
 * After registration redirects to Google login.
 */
export const register = async (req: Request, res: Response) => {
    try {
        const { firstName, paternalLastName, maternalLastName, email } = req.body;

        if (!firstName || !paternalLastName || !maternalLastName || !email) {
            res.status(400).json({ error: 'firstName, paternalLastName, maternalLastName and email are required' });
            return;
        }

        const existing = await pool.query(
            `SELECT id FROM users WHERE email = $1`,
            [email]
        );

        if (existing.rows.length > 0) {
            res.status(409).json({ error: 'User already exists, please login with Google' });
            return;
        }

        await pool.query(
            `INSERT INTO users (first_name, paternal_last_name, maternal_last_name, email, role, active)
             VALUES ($1, $2, $3, $4, 'customer', TRUE)`,
            [firstName, paternalLastName, maternalLastName, email]
        );

        res.status(201).json({
            message: 'User registered successfully, please login',
            loginUrl: `http://localhost:${process.env.PORT || 3000}/auth/google`,
        });

    } catch (error) {
        res.status(500).json({ error: (error as Error).message });
    }
};

/**
 * Returns the current authenticated user from the JWT payload.
 */
export const me = (req: Request, res: Response) => {
    res.status(200).json({ user: req.user });
};