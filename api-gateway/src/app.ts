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
    sellersProxy,
} from './config/proxy';

const app = express();

app.use(corsMiddleware);
app.use(passport.initialize());

// Public routes — need json parsing
app.use('/auth', express.json(), authRoutes);

// Protected routes — proxy handles the body
app.use('/payments', authenticate, paymentProxy);
app.use('/sellers', authenticate,authorize('store_admin','platform_admin'), sellersProxy)
app.use('/catalog', authenticate, catalogProxy)
app.use('/orders',authenticate,authorize('store_admin','platform_admin'),ordersProxy )

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;