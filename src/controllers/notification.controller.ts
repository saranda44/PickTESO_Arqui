import { Request, Response } from 'express';
import { NotificationService } from '../services/notifications.service';
import {
  OrderConfirmedDTO,
  OrderStatusUpdatedDTO,
  OrderCancelledByStoreDTO,
  OrderCancelledByPaymentDTO,
} from '../models/notification.model';
import { AppError } from '../errors';

function handleError(err: unknown, res: Response): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({ error: err.message });
  } else {
    console.error('[notifications] Unexpected error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

export const NotificationController = {
  orderConfirmed,
  orderStatusUpdated,
  orderCancelledByStore,
  orderCancelledByPayment
};


// ---------------------------------------------------------
// POST /notifications/order-confirmed
// Body: { order_id, customer_email, store_email, otp, order }
// ---------------------------------------------------------
async function orderConfirmed(req: Request, res: Response) {
  try {
    const dto = req.body as OrderConfirmedDTO;

    if (!dto.order_id || !dto.customer_email || !dto.store_email || !dto.otp || !dto.order) {
      res.status(400).json({ error: 'order_id, customer_email, store_email, otp and order are required' });
      return;
    }

    await NotificationService.sendOrderConfirmed(dto);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------
// POST /notifications/order-status-updated
// Body: { order_id, customer_email, status, order }
// ---------------------------------------------------------
async function orderStatusUpdated(req: Request, res: Response) {
  try {
    const dto = req.body as OrderStatusUpdatedDTO;

    if (!dto.order_id || !dto.customer_email || !dto.status || !dto.order) {
      res.status(400).json({ error: 'order_id, customer_email, status and order are required' });
      return;
    }

    await NotificationService.sendOrderStatusUpdated(dto);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------
// POST /notifications/order-cancelled-by-store
// Body: { order_id, customer_email, order }
// ---------------------------------------------------------
async function orderCancelledByStore(req: Request, res: Response) {
  try {
    const dto = req.body as OrderCancelledByStoreDTO;

    if (!dto.order_id || !dto.customer_email || !dto.order) {
      res.status(400).json({ error: 'order_id, customer_email and order are required' });
      return;
    }

    await NotificationService.sendOrderCancelledByStore(dto);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
}

// ---------------------------------------------------------
// POST /notifications/order-cancelled-by-payment
// Body: { order_id, customer_email, order }
// ---------------------------------------------------------
async function orderCancelledByPayment(req: Request, res: Response) {
  try {
    const dto = req.body as OrderCancelledByPaymentDTO;

    if (!dto.order_id || !dto.customer_email || !dto.order) {
      res.status(400).json({ error: 'order_id, customer_email and order are required' });
      return;
    }

    await NotificationService.sendOrderCancelledByPayment(dto);
    res.json({ ok: true });
  } catch (err) {
    handleError(err, res);
  }
}