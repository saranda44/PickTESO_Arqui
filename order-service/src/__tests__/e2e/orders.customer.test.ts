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

import * as catalogClient from '../../clients/catalog.client';
import * as storeAdminClient from '../../clients/store-admin.client';
import * as paymentClient from '../../clients/payment.client';
import { OrderRepository } from '../../repositories/order.repository';

describe('Orders Customer Routes (E2E)', () => {
  const userId = 10;
  const storeId = 20;
  const orderId = 100;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('POST /user/stores/:idStore/orders', () => {
    it('should create order successfully', async () => {
      const mockStore = { id: storeId, name: 'Store 1', admin_id: 100 };
      const mockProduct1 = { id: 1, name: 'Product 1', price: 50, store_id: storeId };
      const mockProduct2 = { id: 2, name: 'Product 2', price: 75, store_id: storeId };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any)
        .mockResolvedValueOnce(mockProduct1)
        .mockResolvedValueOnce(mockProduct2);
      (storeAdminClient.getProductStock as any)
        .mockResolvedValueOnce(10)
        .mockResolvedValueOnce(5);

      const mockClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{ id: orderId, user_id: userId, store_id: storeId, total: 175 }],
          }) // createOrder
          .mockResolvedValueOnce({
            rows: [{ id: 1, order_id: orderId, product_id: 1, quantity: 2, unit_price: 50 }],
          }) // createOrderProducts 1
          .mockResolvedValueOnce({
            rows: [{ id: 2, order_id: orderId, product_id: 2, quantity: 1, unit_price: 75 }],
          }) // createOrderProducts 2
          .mockResolvedValueOnce({}), // COMMIT
        release: vi.fn(),
      };

      (OrderRepository.getClient as any).mockResolvedValue(mockClient);
      (OrderRepository.createOrder as any).mockResolvedValue({
        id: orderId,
        user_id: userId,
        store_id: storeId,
        total: 175,
        status: OrderStatus.PENDING,
      });
      (OrderRepository.createOrderProducts as any).mockResolvedValue([
        { product_id: 1, quantity: 2, unit_price: 50 },
        { product_id: 2, quantity: 1, unit_price: 75 },
      ]);
      (storeAdminClient.deductInventory as any).mockResolvedValue({});
      (paymentClient.createPaymentIntent as any).mockResolvedValue({ id: 'pi_123' });

      const response = await request(app)
        .post(`/user/stores/${storeId}/orders`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer')
        .send({
          items: [
            { product_id: 1, quantity: 2 },
            { product_id: 2, quantity: 1 },
          ],
        });

      expect(response.status).toBe(201);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(orderId);
      expect(response.body.order.total).toBe(175);
    });

    it('should reject without auth headers', async () => {
      const response = await request(app)
        .post(`/user/stores/${storeId}/orders`)
        .send({
          items: [{ product_id: 1, quantity: 2 }],
        });

      expect(response.status).toBe(401);
    });

    it('should reject with invalid idStore', async () => {
      const response = await request(app)
        .post(`/user/stores/not-a-number/orders`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer')
        .send({
          items: [{ product_id: 1, quantity: 2 }],
        });

      expect(response.status).toBe(400);
    });

    it('should reject with empty items', async () => {
      const response = await request(app)
        .post(`/user/stores/${storeId}/orders`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer')
        .send({
          items: [],
        });

      expect(response.status).toBe(400);
    });
  });

  describe('GET /user/orders', () => {
    it('should return user orders', async () => {
      const mockOrders = [
        {
          id: orderId,
          user_id: userId,
          store_id: storeId,
          total: 100,
          status: OrderStatus.COMPLETED,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (OrderRepository.findByUserId as any).mockResolvedValue(mockOrders);

      const response = await request(app)
        .get('/user/orders')
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(200);
      expect(response.body.orders).toBeInstanceOf(Array);
      expect(response.body.orders).toHaveLength(1);
      expect(response.body.orders[0]).toHaveProperty('id', orderId);
    });

    it('should reject without auth', async () => {
      const response = await request(app).get('/user/orders');

      expect(response.status).toBe(401);
    });
  });

  describe('GET /user/orders/:id', () => {
    it('should return single user order', async () => {
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        total: 100,
        status: OrderStatus.COMPLETED,
        customer: { id: userId, email: 'customer@example.com' },
        store: { id: storeId, email: 'store@example.com' },
        items: [],
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/user/orders/${orderId}`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(200);
      expect(response.body.order).toBeDefined();
      expect(response.body.order.id).toBe(orderId);
    });

    it('should reject when order belongs to different user', async () => {
      const mockOrder = {
        id: orderId,
        user_id: 999,
        store_id: storeId,
        total: 100,
        status: OrderStatus.COMPLETED,
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const response = await request(app)
        .get(`/user/orders/${orderId}`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(403);
    });

    it('should return 404 when order not found', async () => {
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      const response = await request(app)
        .get(`/user/orders/${orderId}`)
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(404);
    });

    it('should reject with invalid orderId', async () => {
      const response = await request(app)
        .get('/user/orders/not-a-number')
        .set('x-user-id', String(userId))
        .set('x-user-role', 'customer');

      expect(response.status).toBe(400);
    });
  });
});
