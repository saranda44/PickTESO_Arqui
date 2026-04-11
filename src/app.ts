import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import passport from './config/passport';
import authRoutes from './routes/auth';
import { authenticate } from './middlewares/auth';
import {
    catalogProxy,
    ordersProxy,
    notificationsProxy,
    paymentProxy,
    sellersProxy,
} from './config/proxy';

const app = express();

app.use(passport.initialize());

// Public routes — need json parsing
app.use('/auth', express.json(), authRoutes);

// Protected routes — proxy handles the body
app.use('/', authenticate, paymentProxy);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});

export default app;