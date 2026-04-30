import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import passport from './config/passport';
import authRoutes from './routes/auth';
import { authenticate, authorize } from './middlewares/auth';
import { corsMiddleware } from './middlewares/cors.middleware';
import {
    catalogProxy,
    ordersProxy,
    notificationsProxy,
    paymentProxy,
    paymentConfirmProxy,
    sellersProxy,
} from './config/proxy';

const app = express();

app.use(corsMiddleware);
app.use(passport.initialize());
app.use('/api/auth', express.json(), authRoutes);

app.get('/api/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Public routes — need json parsing

// Protected routes — proxy handles the body
app.post('/api/payments/confirm-session', authenticate, paymentProxy);
app.post('/api/payments/checkout-session', authenticate, paymentProxy);
app.post('/api/payments/:id/confirm', authenticate, paymentProxy);
//app.use('/api/payments', authenticate, paymentProxy); // proxy for all payment routes. uncomment if you want to use it instead of individual routes
app.use('/api/sellers', authenticate,authorize('store_admin','platform_admin'), sellersProxy)
app.use('/api/catalog', authenticate, catalogProxy)
app.use('/api/orders',authenticate,authorize('customer','store_admin','platform_admin'),ordersProxy )



export default app;