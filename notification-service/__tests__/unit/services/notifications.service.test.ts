import { describe, it, expect, vi, beforeEach } from 'vitest';
import { NotificationService } from '../../../src/services/notifications.service';
import { MailError } from '../../../src/errors';

vi.mock('../../../src/config/nodemailer', () => ({
  default: {
    sendMail: vi.fn(),
  },
}));

import transporter from '../../../src/config/nodemailer';

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
      (transporter.sendMail as any).mockResolvedValue({});

      await NotificationService.sendOrderConfirmed({
        order_id: 100,
        customer_email: 'john@example.com',
        store_email: 'store@example.com',
        otp: '123456',
        order: mockOrder,
      });

      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should throw MailError when send fails', async () => {
      const error = new Error('Network error');
      (transporter.sendMail as any).mockRejectedValue(error);

      await expect(
        NotificationService.sendOrderConfirmed({
          order_id: 100,
          customer_email: 'john@example.com',
          store_email: 'store@example.com',
          otp: '123456',
          order: mockOrder,
        })
      ).rejects.toThrow(MailError);
    });
  });

  describe('sendOrderStatusUpdated', () => {
    it('should send order status update email to customer', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      await NotificationService.sendOrderStatusUpdated({
        order_id: 100,
        customer_email: 'john@example.com',
        status: 'preparing',
        order: mockOrder,
      });

      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should throw MailError when send fails', async () => {
      const error = new Error('Mail service unavailable');
      (transporter.sendMail as any).mockRejectedValue(error);

      await expect(
        NotificationService.sendOrderStatusUpdated({
          order_id: 100,
          customer_email: 'john@example.com',
          status: 'preparing',
          order: mockOrder,
        })
      ).rejects.toThrow(MailError);
    });
  });

  describe('sendOrderCancelledByStore', () => {
    it('should send order cancelled by store email to customer', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      await NotificationService.sendOrderCancelledByStore({
        order_id: 100,
        customer_email: 'john@example.com',
        order: mockOrder,
      });

      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should throw MailError on send failure', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Send failed'));

      await expect(
        NotificationService.sendOrderCancelledByStore({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        })
      ).rejects.toThrow(MailError);
    });
  });

  describe('sendOrderCancelledByPayment', () => {
    it('should send order cancelled by payment email to customer', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      await NotificationService.sendOrderCancelledByPayment({
        order_id: 100,
        customer_email: 'john@example.com',
        order: mockOrder,
      });

      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should throw MailError on send failure', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Send failed'));

      await expect(
        NotificationService.sendOrderCancelledByPayment({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        })
      ).rejects.toThrow(MailError);
    });
  });
});
