import { OrderComplete } from '../models/notification.model';

interface OrderConfirmedCustomerTemplateParams {
  customerName: string;
  otp: string;
  order: OrderComplete;
}

interface OrderConfirmedStoreTemplateParams {
  order: OrderComplete;
}

// =========================================================
// Template: Order Confirmed
// Sent to customer after payment is confirmed
// Includes OTP for pickup validation
// =========================================================
export function orderConfirmedCustomerTemplate({
  customerName,
  otp,
  order,
}: OrderConfirmedCustomerTemplateParams): { subject: string; body: string } {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const subject = `PickTESO — Tu pedido #${order.id} fue confirmado`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a73e8;">¡Tu pedido fue confirmado! 🎉</h2>
      <p>Hola <strong>${customerName}</strong>,</p>
      <p>Tu pago fue procesado correctamente. <strong>${order.store.name}</strong> ya está preparando tu pedido.</p>

      <h3>Resumen de tu pedido #${order.id}</h3>
      <table style="width: 100%; border-collapse: collapse;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Producto</th>
            <th style="padding: 8px; text-align: center;">Cantidad</th>
            <th style="padding: 8px; text-align: right;">Precio</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td colspan="2" style="padding: 8px; text-align: right;"><strong>Total:</strong></td>
            <td style="padding: 8px; text-align: right;"><strong>$${order.total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="margin: 24px 0; padding: 16px; background-color: #f0f7ff; border-radius: 8px; text-align: center;">
        <p style="margin: 0 0 8px 0;">Tu código de recogida es:</p>
        <p style="font-size: 32px; font-weight: bold; letter-spacing: 8px; color: #1a73e8; margin: 0;">${otp}</p>
        <p style="margin: 8px 0 0 0; font-size: 12px; color: #666;">Muéstraselo al operador cuando vayas a recoger tu pedido.</p>
      </div>

      <p>¡Hasta pronto! 👋</p>
      <p style="color: #999; font-size: 12px;">PickTESO — ITESO</p>
    </div>
  `;

  return { subject, body };
}

export function orderConfirmedStoreTemplate({ order }: OrderConfirmedStoreTemplateParams): { subject: string; body: string } {
  const itemRows = order.items
    .map(
      (item) =>
        `<tr>
          <td style="padding: 8px; border-bottom: 1px solid #eee;">${item.name}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: center;">${item.quantity}</td>
          <td style="padding: 8px; border-bottom: 1px solid #eee; text-align: right;">$${item.unit_price.toFixed(2)}</td>
        </tr>`
    )
    .join('');

  const totalItems = order.items.reduce((sum, item) => sum + item.quantity, 0);
  const customerName = `${order.customer.first_name} ${order.customer.paternal_last_name}`.trim();
  const createdAt = new Date(order.created_at).toLocaleString('es-MX', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const subject = `PickTESO — Nuevo pedido confirmado #${order.id}`;
  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 640px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a73e8; margin-bottom: 8px;">Nuevo pedido confirmado 🎉</h2>
      <p style="margin-top: 0;">Se confirmó el pago del pedido <strong>#${order.id}</strong>. Ya puedes comenzar su preparación.</p>

      <div style="background-color: #f7faff; border: 1px solid #d9e8ff; border-radius: 10px; padding: 14px; margin: 18px 0;">
        <p style="margin: 0 0 6px 0;"><strong>Tienda:</strong> ${order.store.name}</p>
        <p style="margin: 0 0 6px 0;"><strong>Cliente:</strong> ${customerName}</p>
        <p style="margin: 0 0 6px 0;"><strong>Fecha:</strong> ${createdAt}</p>
        <p style="margin: 0;"><strong>Estado actual:</strong> ${order.status}</p>
      </div>

      <h3 style="margin: 0 0 10px 0;">Resumen del pedido</h3>
      <table style="width: 100%; border-collapse: collapse; margin-bottom: 12px;">
        <thead>
          <tr style="background-color: #f5f5f5;">
            <th style="padding: 8px; text-align: left;">Producto</th>
            <th style="padding: 8px; text-align: center;">Cantidad</th>
            <th style="padding: 8px; text-align: right;">Precio unitario</th>
          </tr>
        </thead>
        <tbody>${itemRows}</tbody>
        <tfoot>
          <tr>
            <td style="padding: 8px;"><strong>Items:</strong> ${totalItems}</td>
            <td style="padding: 8px;"></td>
            <td style="padding: 8px; text-align: right;"><strong>Total: $${order.total.toFixed(2)}</strong></td>
          </tr>
        </tfoot>
      </table>

      <div style="padding: 12px 14px; border-left: 4px solid #1a73e8; background-color: #f9fbff; margin: 18px 0;">
        <p style="margin: 0 0 6px 0;"><strong>Siguiente paso:</strong></p>
        <p style="margin: 0;">Cambia el estado del pedido a <strong>preparing</strong> cuando inicie su preparación y a <strong>ready</strong> cuando esté listo para entrega.</p>
      </div>

      <p style="margin-bottom: 6px;">Gracias por ser parte de PickTESO.</p>
      <p style="color: #999; font-size: 12px; margin-top: 0;">PickTESO — ITESO</p>
    </div>
  `;
  return { subject, body };
}
