import { describe, it, expect, vi, beforeEach } from 'vitest';
import { PoolClient } from 'pg';
import { OrderRepository } from '../../../src/repositories/order.repository';
import { Order, OrderStatus, OrderProduct } from '../../../src/models/order.model';

vi.mock('../../../src/repositories/db', () => ({
  default: {
    query: vi.fn(),
    connect: vi.fn(),
  },
}));

import pool from '../../../src/repositories/db';

describe('Order Repository', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('findById', () => {
    it('should return order when found', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 10,
        store_id: 20,
        total: 100,
        status: OrderStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as any).mockResolvedValueOnce({
        rows: [mockOrder],
      });

      const result = await OrderRepository.findById(1);

      expect(result).toEqual(mockOrder);
      expect(pool.query).toHaveBeenCalledWith(
        'SELECT * FROM orders WHERE id = $1',
        [1]
      );
    });

    it('should return null when order not found', async () => {
      (pool.query as any).mockResolvedValueOnce({
        rows: [],
      });

      const result = await OrderRepository.findById(999);

      expect(result).toBeNull();
    });
  });

  describe('findByUserId', () => {
    it('should return orders for user', async () => {
      const mockOrders: Order[] = [
        {
          id: 1,
          user_id: 10,
          store_id: 20,
          total: 100,
          status: OrderStatus.COMPLETED,
          created_at: new Date(),
          updated_at: new Date(),
        },
        {
          id: 2,
          user_id: 10,
          store_id: 30,
          total: 200,
          status: OrderStatus.PAID,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as any).mockResolvedValueOnce({
        rows: mockOrders,
      });

      const result = await OrderRepository.findByUserId(10);

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('user_id = $1'),
        [10]
      );
    });

    it('should return empty array when user has no orders', async () => {
      (pool.query as any).mockResolvedValueOnce({
        rows: [],
      });

      const result = await OrderRepository.findByUserId(999);

      expect(result).toEqual([]);
    });
  });

  describe('findByStoreId', () => {
    it('should return orders for store', async () => {
      const mockOrders: Order[] = [
        {
          id: 1,
          user_id: 10,
          store_id: 20,
          total: 100,
          status: OrderStatus.READY,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ];

      (pool.query as any).mockResolvedValueOnce({
        rows: mockOrders,
      });

      const result = await OrderRepository.findByStoreId(20);

      expect(result).toEqual(mockOrders);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('store_id = $1'),
        [20]
      );
    });

    it('should return empty array when store has no orders', async () => {
      (pool.query as any).mockResolvedValueOnce({
        rows: [],
      });

      const result = await OrderRepository.findByStoreId(999);

      expect(result).toEqual([]);
    });
  });

  describe('updateStatus', () => {
    it('should update order status when current status matches', async () => {
      const updatedOrder: Order = {
        id: 1,
        user_id: 10,
        store_id: 20,
        total: 100,
        status: OrderStatus.PREPARING,
        created_at: new Date(),
        updated_at: new Date(),
      };

      (pool.query as any).mockResolvedValueOnce({
        rows: [updatedOrder],
      });

      const result = await OrderRepository.updateStatus(
        1,
        OrderStatus.PREPARING,
        OrderStatus.PAID
      );

      expect(result).toEqual(updatedOrder);
      expect(pool.query).toHaveBeenCalledWith(
        expect.stringContaining('UPDATE orders'),
        [OrderStatus.PREPARING, 1, OrderStatus.PAID]
      );
    });

    it('should return null when status update fails (current status mismatch)', async () => {
      (pool.query as any).mockResolvedValueOnce({
        rows: [],
      });

      const result = await OrderRepository.updateStatus(
        1,
        OrderStatus.READY,
        OrderStatus.PAID
      );

      expect(result).toBeNull();
    });
  });

  describe('createOrder', () => {
    it('should create order with transaction client', async () => {
      const mockOrder: Order = {
        id: 1,
        user_id: 10,
        store_id: 20,
        total: 250,
        status: OrderStatus.PENDING,
        created_at: new Date(),
        updated_at: new Date(),
      };

      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({
          rows: [mockOrder],
        }),
      } as unknown as PoolClient;

      const result = await OrderRepository.createOrder(mockClient, 10, 20, 250);

      expect(result).toEqual(mockOrder);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO orders'),
        [10, 20, 250]
      );
    });
  });

  describe('createOrderProducts', () => {
    it('should create order products', async () => {
      const mockProduct: OrderProduct = {
        id: 1,
        order_id: 100,
        product_id: 10,
        quantity: 2,
        unit_price: 50,
      };

      const mockClient = {
        query: vi.fn().mockResolvedValueOnce({
          rows: [mockProduct],
        }),
      } as unknown as PoolClient;

      const items = [
        { product_id: 10, quantity: 2, unit_price: 50 },
      ];

      const result = await OrderRepository.createOrderProducts(mockClient, 100, items);

      expect(result).toHaveLength(1);
      expect(result[0]).toEqual(mockProduct);
      expect(mockClient.query).toHaveBeenCalledWith(
        expect.stringContaining('INSERT INTO order_products'),
        [100, 10, 2, 50]
      );
    });

    it('should create multiple order products', async () => {
      const mockProducts: OrderProduct[] = [
        {
          id: 1,
          order_id: 100,
          product_id: 10,
          quantity: 2,
          unit_price: 50,
        },
        {
          id: 2,
          order_id: 100,
          product_id: 20,
          quantity: 1,
          unit_price: 75,
        },
      ];

      const mockClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({ rows: [mockProducts[0]] })
          .mockResolvedValueOnce({ rows: [mockProducts[1]] }),
      } as unknown as PoolClient;

      const items = [
        { product_id: 10, quantity: 2, unit_price: 50 },
        { product_id: 20, quantity: 1, unit_price: 75 },
      ];

      const result = await OrderRepository.createOrderProducts(mockClient, 100, items);

      expect(result).toHaveLength(2);
      expect(result).toEqual(mockProducts);
    });
  });

  describe('findByIdWithProducts', () => {
    it('should return order with products', async () => {
      const mockOrderResult = {
        rows: [
          {
            id: 1,
            user_id: 10,
            store_id: 20,
            total: 100,
            status: 'completed',
            created_at: new Date(),
            updated_at: new Date(),
            customer_id: 10,
            customer_first_name: 'John',
            customer_paternal_last_name: 'Doe',
            customer_maternal_last_name: 'Smith',
            customer_email: 'john@example.com',
            store_id_detail: 20,
            store_name: 'Store 1',
            store_email: 'store@example.com',
          },
        ],
      };

      const mockItemsResult = {
        rows: [
          { id: 1, order_id: 1, product_id: 10, quantity: 2, unit_price: 50, name: 'Product 1' },
        ],
      };

      (pool.query as any)
        .mockResolvedValueOnce(mockOrderResult)
        .mockResolvedValueOnce(mockItemsResult);

      const result = await OrderRepository.findByIdWithProducts(1);

      expect(result).toBeDefined();
      expect(result?.id).toBe(1);
      expect(result?.customer).toBeDefined();
      expect(result?.store).toBeDefined();
      expect(result?.items).toHaveLength(1);
      expect(pool.query).toHaveBeenCalledTimes(2);
    });

    it('should return null when order not found', async () => {
      (pool.query as any).mockResolvedValueOnce({
        rows: [],
      });

      const result = await OrderRepository.findByIdWithProducts(999);

      expect(result).toBeNull();
    });
  });

  describe('getClient', () => {
    it('should return a client from the pool', async () => {
      const mockClient = { query: vi.fn() } as unknown as PoolClient;

      (pool.connect as any).mockResolvedValueOnce(mockClient);

      const result = await OrderRepository.getClient();

      expect(result).toEqual(mockClient);
      expect(pool.connect).toHaveBeenCalled();
    });
  });
});
