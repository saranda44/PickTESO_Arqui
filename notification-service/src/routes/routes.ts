import { Router } from 'express';
import { NotificationController } from '../controllers/notification.controller';

const router = Router();

// POST /notifications/order-confirmed
router.post('/order-confirmed', NotificationController.orderConfirmed);

// POST /notifications/order-status-updated
router.post('/order-status-updated', NotificationController.orderStatusUpdated);

// POST /notifications/order-cancelled-by-store
router.post('/order-cancelled-by-store', NotificationController.orderCancelledByStore);

// POST /notifications/order-cancelled-by-payment
router.post('/order-cancelled-by-payment', NotificationController.orderCancelledByPayment);

export default router;