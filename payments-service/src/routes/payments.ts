import { Router } from 'express';
import { createPaymentIntent, getPaymentIntent, confirmPaymentIntent, cancelPaymentIntent } from '../controllers/paymentController';

const router = Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/:id/confirm', confirmPaymentIntent);
router.post('/:orderId/cancel', cancelPaymentIntent);
router.get('/:id', getPaymentIntent);


export default router;