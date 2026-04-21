import { OrderComplete } from '../models/notification.model';

interface OrderStatusUpdatedTemplateParams {
  customerName: string;
  status: string;
  order: OrderComplete;
}

// =========================================================
// Template: Order Status Updated
// Sent to customer when store_admin updates the order status
// =========================================================

const STATUS_LABELS: Record<string, { label: string; emoji: string; message: string }> = {
  preparing: {
    label:   'En preparación',
    emoji:   '👨‍🍳',
    message: 'Tu pedido está siendo preparado. ¡Ya casi está listo!',
  },
  ready: {
    label:   'Listo para recoger',
    emoji:   '✅',
    message: 'Tu pedido está listo. Pasa a recogerlo con tu código OTP.',
  },
  completed: {
    label:   'Completado',
    emoji:   '🎉',
    message: 'Tu pedido ha sido completado. ¡Gracias por usar PickTESO!',
  },
};

export function orderStatusUpdatedTemplate({
  customerName,
  status,
  order,
}: OrderStatusUpdatedTemplateParams): { subject: string; body: string } {
  const statusInfo = STATUS_LABELS[status] ?? {
    label:   status,
    emoji:   '📦',
    message: `El estado de tu pedido cambió a: ${status}.`,
  };

  const subject = `PickTESO — Tu pedido #${order.id} está ${statusInfo.label}`;

  const body = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
      <h2 style="color: #1a73e8;">${statusInfo.emoji} Actualización de tu pedido</h2>
      <p>Hola <strong>${customerName}</strong>,</p>
      <p>${statusInfo.message}</p>

      <div style="margin: 16px 0; padding: 12px 16px; background-color: #f5f5f5; border-radius: 8px;">
        <p style="margin: 0;"><strong>Pedido #${order.id}</strong></p>
        <p style="margin: 4px 0 0 0; color: #666;">${order.store.name}</p>
        <p style="margin: 4px 0 0 0;">Estado actual: <strong>${statusInfo.label}</strong></p>
      </div>

      <p style="color: #999; font-size: 12px;">PickTESO — ITESO</p>
    </div>
  `;

  return { subject, body };
}