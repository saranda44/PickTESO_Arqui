import dotenv from 'dotenv';
dotenv.config();
import express from 'express';
import paymentRoutes from './routes/payments';
import healthRoutes from './routes/health';
import { errorHandler } from './middlewares/errorHandler';


const app = express();

app.use(express.json());
app.use('/health', healthRoutes);
app.use('/api/payments', paymentRoutes);
app.use(errorHandler);

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
    console.log(`Server is running on port http://localhost:${PORT}`);
});

export default app; 
