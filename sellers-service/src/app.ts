import dotenv from 'dotenv';
dotenv.config();

import express from 'express';
import cors from 'cors';
import pool from './config/db.config';
import router from './routes';
import { errorMiddleware } from './middlewares/error.middleware';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.use('/', router);

app.get('/health', (_req, res) => {
    res.status(200).json({ status: 'ok' });
});

app.use(errorMiddleware);

app.listen(PORT, () => {
    console.log(`sellers-service running on port ${PORT}`);
});

pool.query('SELECT NOW()').then((res) => {
    console.log('Conexión exitosa:', res.rows[0]);
}).catch((err) => {
    console.error('Error al conectar:', err);
});

export default app;