import transporter from '../config/nodemailer';
import { MailError } from '../errors';
import {
  OrderConfirmedDTO,
  OrderStatusUpdatedDTO,
  OrderCancelledByStoreDTO,
  OrderCancelledByPaymentDTO,
} from '../models/notification.model';
import {
  orderConfirmedCustomerTemplate,
  orderConfirmedStoreTemplate,
} from '../templates/order-confirmed';
import { orderStatusUpdatedTemplate } from '../templates/order-status-updated';
import { orderCancelledByStoreTemplate } from '../templates/order-cancelled-by-store';
import { orderCancelledByPaymentTemplate } from '../templates/order-cancelled-by-payment';

const FROM_EMAIL = process.env.SMTP_USER ?? '';

// =========================================================
// Core email sender
// =========================================================
async function sendEmail(to: string, subject: string, body: string): Promise<void> {
  try {
    await transporter.sendMail({
      from: FROM_EMAIL,
      to,
      subject,
      html: body,
    });
  } catch (err: any) {
    throw new MailError(`Failed to send email to ${to}: ${err?.message}`);
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
  const { subject, body } = orderConfirmedCustomerTemplate({
    customerName,
    otp: dto.otp,
    order: dto.order,
  });
  await sendEmail(dto.customer_email, subject, body);

  // Email to store with new order details
  const storeTemplate = orderConfirmedStoreTemplate({
    order: dto.order,
  });
  await sendEmail(dto.store_email, storeTemplate.subject, storeTemplate.body);
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