import { OrderComplete } from '../models/notification.model';

interface OrderCancelledByStoreTemplateParams {
  customerName: string;
  order: OrderComplete;
}

// =========================================================
// Template: Order Cancelled by Store
// Sent to customer when the store cancels a paid order
// Includes refund notice
// =========================================================
export function orderCancelledByStoreTemplate({
  customerName,
  order,
}: OrderCancelledByStoreTemplateParams): { subject: string; body: string } {
  const subject = `PickTESO — Tu pedido #${order.id} fue cancelado`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #e53935;">😔 Tu pedido fue cancelado</h2>
      <p>Hola <strong>${customerName}</strong>,</p>
      <p>Lamentamos informarte que <strong>${order.store.name}</strong> no pudo realizar tu pedido #${order.id}.</p>

      <div style="margin: 16px 0; padding: 12px 16px; background-color: #fff3e0; border-left: 4px solid #ff9800; border-radius: 4px;">
        <p style="margin: 0;"><strong>Reembolso en proceso</strong></p>
        <p style="margin: 8px 0 0 0;">
          El monto de <strong>$${order.total.toFixed(2)}</strong> será reembolsado 
          a tu método de pago original en los próximos días hábiles.
        </p>
      </div>

      <p>Disculpa los inconvenientes. Puedes realizar un nuevo pedido en cualquier momento.</p>
      <p style="color: #999; font-size: 12px;">PickTESO — ITESO</p>
    </div>
  `;

  return { subject, body };
}