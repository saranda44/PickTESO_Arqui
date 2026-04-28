import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';
import app from '../../app';
import { OrderStatus } from '../../models/order.model';

vi.mock('../../repositories/db');
vi.mock('../../repositories/order.repository');
vi.mock('../../clients/catalog.client');
vi.mock('../../clients/store-admin.client');
vi.mock('../../clients/payment.client');
vi.mock('../../clients/notification.client');
vi.mock('../../helpers/otp.helper');

import * as catalogClient from '../../clients/catalog.client';
import * as storeAdminClient from '../../clients/store-admin.client';
import * as paymentClient from '../../clients/payment.client';
import * as notificationClient from '../../clients/notification.client';
import * as otpHelper from '../../helpers/otp.helper';
import { OrderRepository } from '../../repositories/order.repository';

describe('Orders Store Routes (E2E)', () => {
  const storeId = 20;
  const storeAdminId = 100;
  const orderId = 100;
  const userId = 10;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('PATCH /stores/:idStore/orders/:id/status', () => {
    it('should update order status from paid to preparing', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        store: { email: 'store@example.com' },
        items: [],
      };

      const updatedOrder = { ...mockOrder, status: OrderStatus.PREPARING };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (OrderRepository.updateStatus as any).mockResolvedValue(updatedOrder);
      (notificationClient.notifyOrderStatusUpdated as any).mockResolvedValue({});

      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ status: OrderStatus.PREPARING });

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.status).toBe(OrderStatus.PREPARING);
    });

    it('should reject unauthorized store admin', async () => {
      const mockStore = { id: storeId, admin_id: 999 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);

      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ status: OrderStatus.PREPARING });

      expect(response.status).toBe(403);
    });

    it('should reject customer role', async () => {
      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer')
        .send({ status: OrderStatus.PREPARING });

      expect(response.status).toBe(403);
    });

    it('should reject invalid status', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);

      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/status`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ status: 'invalid_status' });

      expect(response.status).toBe(400);
    });
  });

  describe('DELETE /stores/:idStore/orders/:id/cancel', () => {
    it('should cancel paid order', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        store: { email: 'store@example.com' },
        items: [{ product_id: 1, quantity: 2 }],
      };

      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder) // for restoreInventory
        .mockResolvedValueOnce(cancelledOrder);
      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockResolvedValue({});
      (notificationClient.notifyOrderCancelledByStore as any).mockResolvedValue({});

      const response = await request(app)
        .delete(`/stores/${storeId}/orders/${orderId}/cancel`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin');

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.status).toBe(OrderStatus.CANCELLED);
    });

    it('should reject when order not in paid status', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.PREPARING,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .delete(`/stores/${storeId}/orders/${orderId}/cancel`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin');

      expect(response.status).toBe(400);
    });
  });

  describe('PATCH /stores/:storeId/orders/:id/complete', () => {
    it('should complete order with valid OTP', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      const completedOrder = { ...mockOrder, status: OrderStatus.COMPLETED };

      const mockOrderWithProducts = {
        ...completedOrder,
        customer: { email: 'customer@example.com' },
        store: { email: 'store@example.com' },
        items: [],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(true);
      (OrderRepository.updateStatus as any).mockResolvedValue(completedOrder);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(
        mockOrderWithProducts
      );
      (notificationClient.notifyOrderStatusUpdated as any).mockResolvedValue({});

      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/complete`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ otp: '123456' });

      expect(response.status).toBe(200);
      expect(response.body.data).toBeDefined();
      expect(response.body.data.status).toBe(OrderStatus.COMPLETED);
    });

    it('should reject with invalid OTP', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(false);

      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/complete`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ otp: '000000' });

      expect(response.status).toBe(400);
    });

    it('should reject with invalid OTP format', async () => {
      const response = await request(app)
        .patch(`/stores/${storeId}/orders/${orderId}/complete`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin')
        .send({ otp: '12345' });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /stores/:idStore/orders/:id', () => {
    it('should return store order by id', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        total: 100,
        status: OrderStatus.READY,
        customer: { email: 'customer@example.com' },
        store: { email: 'store@example.com' },
        items: [],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/stores/${storeId}/orders/${orderId}`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin');

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(orderId);
    });

    it('should reject when order does not belong to store', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: 999,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/stores/${storeId}/orders/${orderId}`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin');

      expect(response.status).toBe(403);
    });
  });

  describe('GET /stores/:idStore/orders', () => {
    it('should return all store orders', async () => {
      const mockStore = { id: storeId, admin_id: storeAdminId };
      const mockOrders = [
        { id: 1, user_id: userId, store_id: storeId, total: 100, status: OrderStatus.READY },
        { id: 2, user_id: userId, store_id: storeId, total: 200, status: OrderStatus.COMPLETED },
      ];

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByStoreId as any).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get(`/stores/${storeId}/orders`)
        .set('x-user-id', String(storeAdminId))
        .set('x-user-role', 'store_admin');

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeInstanceOf(Array);
      expect(response.body.orders).toHaveLength(2);
    });

    it('should reject customer role', async () => {
      const response = await request(app)
        .get(`/stores/${storeId}/orders`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(403);
    });
  });
});
