import { SendEmailCommand } from '@aws-sdk/client-ses';
import sesClient from '../config/ses';
import { SESError } from '../errors';
import {
  OrderConfirmedDTO,
  OrderStatusUpdatedDTO,
  OrderCancelledByStoreDTO,
  OrderCancelledByPaymentDTO,
} from '../models/notification.model';
import { orderConfirmedTemplate } from '../templates/order-confirmed';
import { orderStatusUpdatedTemplate } from '../templates/order-status-updated';
import { orderCancelledByStoreTemplate } from '../templates/order-cancelled-by-store';
import { orderCancelledByPaymentTemplate } from '../templates/order-cancelled-by-payment';

const FROM_EMAIL = process.env.SES_FROM_EMAIL ?? '';

// =========================================================
// Core email sender — wraps SES SendEmailCommand
// =========================================================
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  const command = new SendEmailCommand({
    Source: FROM_EMAIL,
    Destination: { ToAddresses: [to] },
    Message: {
      Subject: { Data: subject, Charset: 'UTF-8' },
      Body: {
        Html: { Data: body, Charset: 'UTF-8' },
      },
    },
  });

  try {
    await sesClient.send(command);
  } catch (err: any) {
    throw new SESError(`Failed to send email to ${to}: ${err?.message}`);
  }
}

// =========================================================
// Notification handlers
// =========================================================

export const NotificationService = {
  sendOrderConfirmed,
  sendOrderStatusUpdated,
  sendOrderCancelledByStore,
  sendOrderCancelledByPayment
};


// ---------------------------------------------------------
// Order confirmed — customer receives OTP, store is notified
// ---------------------------------------------------------
async function sendOrderConfirmed(dto: OrderConfirmedDTO): Promise<void> {
  const customerName = `${dto.order.customer.first_name} ${dto.order.customer.paternal_last_name}`;

  // Email to customer with OTP
  const { subject, body } = orderConfirmedTemplate({
    customerName,
    otp: dto.otp,
    order: dto.order,
  });
  await sendEmail(dto.customer_email, subject, body);
}

// ---------------------------------------------------------
// Order status updated — only customer is notified
// ---------------------------------------------------------
async function sendOrderStatusUpdated(dto: OrderStatusUpdatedDTO): Promise<void> {
  const customerName = `${dto.order.customer.first_name} ${dto.order.customer.paternal_last_name}`;

  const { subject, body } = orderStatusUpdatedTemplate({
    customerName,
    status: dto.status,
    order: dto.order,
  });
  await sendEmail(dto.customer_email, subject, body);
}

// ---------------------------------------------------------
// Order cancelled by store — customer notified with refund notice
// ---------------------------------------------------------
async function sendOrderCancelledByStore(dto: OrderCancelledByStoreDTO): Promise<void> {
  const customerName = `${dto.order.customer.first_name} ${dto.order.customer.paternal_last_name}`;

  const { subject, body } = orderCancelledByStoreTemplate({
    customerName,
    order: dto.order,
  });
  await sendEmail(dto.customer_email, subject, body);
}

// ---------------------------------------------------------
// Order cancelled by payment failure — customer asked to retry
// ---------------------------------------------------------
async function sendOrderCancelledByPayment(dto: OrderCancelledByPaymentDTO): Promise<void> {
  const customerName = `${dto.order.customer.first_name} ${dto.order.customer.paternal_last_name}`;

  const { subject, body } = orderCancelledByPaymentTemplate({
    customerName,
    order: dto.order,
  });
  await sendEmail(dto.customer_email, subject, body);
}