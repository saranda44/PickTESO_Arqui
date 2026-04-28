import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../../src/services/notifications.service';
import { SESError } from '../../../src/errors';

vi.mock('../../../src/config/ses', () => ({
  default: {
    send: vi.fn(),
  },
}));

import sesClient from '../../../src/config/ses';

describe('Notifications Service', () => {
  const mockOrder = {
    id: 100,
    total: 175.5,
    status: 'paid',
    created_at: '2026-04-28T10:00:00Z',
    customer: {
      first_name: 'John',
      paternal_last_name: 'Doe',
      email: 'john@example.com',
    },
    store: {
      name: 'Store 1',
      email: 'store@example.com',
    },
    items: [
      {
        product_id: 1,
        name: 'Product 1',
        quantity: 2,
        unit_price: 50,
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('sendOrderConfirmed', () => {
    it('should send order confirmed email to customer and store', async () => {
      (sesClient.send as any).mockResolvedValue({ MessageId: 'msg123' });

      await NotificationService.sendOrderConfirmed({
        order_id: 100,
        customer_email: 'john@example.com',
        store_email: 'store@example.com',
        otp: '123456',
        order: mockOrder,
      });

      expect(sesClient.send).toHaveBeenCalledTimes(2);
    });

    it('should throw SESError when send fails', async () => {
      const error = new Error('Network error');
      (sesClient.send as any).mockRejectedValue(error);

      await expect(
        NotificationService.sendOrderConfirmed({
          order_id: 100,
          customer_email: 'john@example.com',
          store_email: 'store@example.com',
          otp: '123456',
          order: mockOrder,
        })
      ).rejects.toThrow(SESError);
    });
  });

  describe('sendOrderStatusUpdated', () => {
    it('should send order status update email to customer', async () => {
      (sesClient.send as any).mockResolvedValue({ MessageId: 'msg123' });

      await NotificationService.sendOrderStatusUpdated({
        order_id: 100,
        customer_email: 'john@example.com',
        status: 'preparing',
        order: mockOrder,
      });

      expect(sesClient.send).toHaveBeenCalledOnce();
    });

    it('should throw SESError when send fails', async () => {
      const error = new Error('SES unavailable');
      (sesClient.send as any).mockRejectedValue(error);

      await expect(
        NotificationService.sendOrderStatusUpdated({
          order_id: 100,
          customer_email: 'john@example.com',
          status: 'preparing',
          order: mockOrder,
        })
      ).rejects.toThrow(SESError);
    });
  });

  describe('sendOrderCancelledByStore', () => {
    it('should send order cancelled by store email to customer', async () => {
      (sesClient.send as any).mockResolvedValue({ MessageId: 'msg123' });

      await NotificationService.sendOrderCancelledByStore({
        order_id: 100,
        customer_email: 'john@example.com',
        order: mockOrder,
      });

      expect(sesClient.send).toHaveBeenCalledOnce();
    });

    it('should throw SESError on send failure', async () => {
      (sesClient.send as any).mockRejectedValue(new Error('Send failed'));

      await expect(
        NotificationService.sendOrderCancelledByStore({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        })
      ).rejects.toThrow(SESError);
    });
  });

  describe('sendOrderCancelledByPayment', () => {
    it('should send order cancelled by payment email to customer', async () => {
      (sesClient.send as any).mockResolvedValue({ MessageId: 'msg123' });

      await NotificationService.sendOrderCancelledByPayment({
        order_id: 100,
        customer_email: 'john@example.com',
        order: mockOrder,
      });

      expect(sesClient.send).toHaveBeenCalledOnce();
    });

    it('should throw SESError on send failure', async () => {
      (sesClient.send as any).mockRejectedValue(new Error('Send failed'));

      await expect(
        NotificationService.sendOrderCancelledByPayment({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        })
      ).rejects.toThrow(SESError);
    });
  });
});
