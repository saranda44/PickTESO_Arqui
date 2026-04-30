import { Router } from 'express';
import { createPaymentIntent, getPaymentIntent, confirmPaymentIntent, cancelPaymentIntent, createCheckoutSession, confirmCheckoutSession } from '../controllers/paymentController';

const router = Router();

router.post('/create-payment-intent', createPaymentIntent);
router.post('/:id/confirm', confirmPaymentIntent);
router.post('/cancel', cancelPaymentIntent);
router.get('/:id', getPaymentIntent);
router.post('/checkout-session', createCheckoutSession);
router.post('/confirm-session', confirmCheckoutSession);


export default router;