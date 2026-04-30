import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../src/app';

vi.mock('../../src/config/nodemailer', () => ({
  default: {
    sendMail: vi.fn(),
  },
}));

import transporter from '../../src/config/nodemailer';

describe('Notifications E2E Tests', () => {
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

  describe('POST /notifications/order-confirmed', () => {
    it('should send order confirmed emails successfully', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      const response = await request(app)
        .post('/notifications/order-confirmed')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          store_email: 'store@example.com',
          otp: '123456',
          order: mockOrder,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(transporter.sendMail).toHaveBeenCalledTimes(2);
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/notifications/order-confirmed')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          // missing store_email, otp, order
        });

      expect(response.status).toBe(400);
    });

    it('should return 502 when mail service fails', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Mail service error'));

      const response = await request(app)
        .post('/notifications/order-confirmed')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          store_email: 'store@example.com',
          otp: '123456',
          order: mockOrder,
        });

      expect(response.status).toBe(502);
    });
  });

  describe('POST /notifications/order-status-updated', () => {
    it('should send order status update email successfully', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      const response = await request(app)
        .post('/notifications/order-status-updated')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          status: 'preparing',
          order: mockOrder,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/notifications/order-status-updated')
        .send({
          order_id: 100,
          // missing customer_email, status, order
        });

      expect(response.status).toBe(400);
    });

    it('should return 502 when mail service fails', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Mail service error'));

      const response = await request(app)
        .post('/notifications/order-status-updated')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          status: 'ready',
          order: mockOrder,
        });

      expect(response.status).toBe(502);
    });
  });

  describe('POST /notifications/order-cancelled-by-store', () => {
    it('should send order cancelled by store email successfully', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      const response = await request(app)
        .post('/notifications/order-cancelled-by-store')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/notifications/order-cancelled-by-store')
        .send({
          order_id: 100,
          // missing customer_email, order
        });

      expect(response.status).toBe(400);
    });

    it('should return 502 when mail service fails', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Mail service error'));

      const response = await request(app)
        .post('/notifications/order-cancelled-by-store')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        });

      expect(response.status).toBe(502);
    });
  });

  describe('POST /notifications/order-cancelled-by-payment', () => {
    it('should send order cancelled by payment email successfully', async () => {
      (transporter.sendMail as any).mockResolvedValue({});

      const response = await request(app)
        .post('/notifications/order-cancelled-by-payment')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        });

      expect(response.status).toBe(200);
      expect(response.body).toEqual({ ok: true });
      expect(transporter.sendMail).toHaveBeenCalledOnce();
    });

    it('should return 400 when missing required fields', async () => {
      const response = await request(app)
        .post('/notifications/order-cancelled-by-payment')
        .send({
          order_id: 100,
          // missing customer_email, order
        });

      expect(response.status).toBe(400);
    });

    it('should return 502 when mail service fails', async () => {
      (transporter.sendMail as any).mockRejectedValue(new Error('Mail service error'));

      const response = await request(app)
        .post('/notifications/order-cancelled-by-payment')
        .send({
          order_id: 100,
          customer_email: 'john@example.com',
          order: mockOrder,
        });

      expect(response.status).toBe(502);
    });
  });

  describe('GET /health', () => {
    it('should return health status', async () => {
      const response = await request(app).get('/health');

      expect(response.status).toBe(200);
      expect(response.body).toEqual({
        service: 'notifications',
        status: 'ok',
      });
    });
  });
});
