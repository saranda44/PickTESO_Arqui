import { OrderComplete } from '../models/notification.model';

interface OrderCancelledByPaymentTemplateParams {
  customerName: string;
  order: OrderComplete;
}

// =========================================================
// Template: Order Cancelled by Payment Failure
// Sent to customer when Stripe payment fails
// Asks customer to retry
// =========================================================
export function orderCancelledByPaymentTemplate({
  customerName,
  order,
}: OrderCancelledByPaymentTemplateParams): { subject: string; body: string } {
  const subject = `PickTESO — No pudimos procesar tu pago del pedido #${order.id}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #e53935;">⚠️ No pudimos procesar tu pago</h2>
      <p>Hola <strong>${customerName}</strong>,</p>
      <p>Lamentamos informarte que no fue posible procesar el pago de tu pedido #${order.id} en <strong>${order.store.name}</strong>.</p>

      <div style="margin: 16px 0; padding: 12px 16px; background-color: #fce4e4; border-left: 4px solid #e53935; border-radius: 4px;">
        <p style="margin: 0;"><strong>¿Qué puedo hacer?</strong></p>
        <ul style="margin: 8px 0 0 0; padding-left: 20px;">
          <li>Verifica que tu tarjeta tenga fondos suficientes.</li>
          <li>Confirma que los datos de tu tarjeta sean correctos.</li>
          <li>Intenta con otro método de pago.</li>
        </ul>
      </div>

      <p>No se realizó ningún cargo a tu cuenta. Puedes volver a intentar tu pedido cuando quieras.</p>
      <p style="color: #999; font-size: 12px;">PickTESO — ITESO</p>
    </div>
  `;

  return { subject, body };
}