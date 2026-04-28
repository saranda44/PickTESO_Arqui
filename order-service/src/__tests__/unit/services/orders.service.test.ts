import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../../services/orders.service';
import { OrderStatus } from '../../../models/order.model';
import { BadRequestError, NotFoundError, ConflictError } from '../../../errors';

vi.mock('../../../repositories/order.repository');
vi.mock('../../../clients/catalog.client');
vi.mock('../../../clients/store-admin.client');
vi.mock('../../../clients/payment.client');
vi.mock('../../../clients/notification.client');
vi.mock('../../../helpers/otp.helper');

import { OrderRepository } from '../../../repositories/order.repository';
import * as catalogClient from '../../../clients/catalog.client';
import * as storeAdminClient from '../../../clients/store-admin.client';
import * as paymentClient from '../../../clients/payment.client';
import * as notificationClient from '../../../clients/notification.client';
import * as otpHelper from '../../../helpers/otp.helper';

describe('Orders Service', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const userId = 10;
      const storeId = 20;
      const dto = {
        items: [
          { product_id: 1, quantity: 2 },
          { product_id: 2, quantity: 1 },
        ],
      };

      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };
      const mockProduct1 = { id: 1, name: 'Product 1', price: 50, store_id: 20 };
      const mockProduct2 = { id: 2, name: 'Product 2', price: 75, store_id: 20 };

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
            rows: [{ id: 100, user_id: userId, store_id: storeId, total: 175 }],
          }) // createOrder
          .mockResolvedValueOnce({
            rows: [
              { id: 1, order_id: 100, product_id: 1, quantity: 2, unit_price: 50 },
            ],
          }) // createOrderProducts 1
          .mockResolvedValueOnce({
            rows: [
              { id: 2, order_id: 100, product_id: 2, quantity: 1, unit_price: 75 },
            ],
          }) // createOrderProducts 2
          .mockResolvedValueOnce({}), // COMMIT
        release: vi.fn(),
      };

      (OrderRepository.getClient as any).mockResolvedValue(mockClient);
      (OrderRepository.createOrder as any).mockResolvedValue({
        id: 100,
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

      const result = await OrderService.createOrder(userId, storeId, dto);

      expect(result).toBeDefined();
      expect(result.id).toBe(100);
      expect(result.total).toBe(175);
    });

    it('should rollback transaction when createPaymentIntent fails', async () => {
      const userId = 10;
      const storeId = 20;
      const dto = {
        items: [{ product_id: 1, quantity: 2 }],
      };

      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };
      const mockProduct = { id: 1, name: 'Product 1', price: 50, store_id: 20 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any).mockResolvedValue(mockProduct);
      (storeAdminClient.getProductStock as any).mockResolvedValue(10);

      const mockClient = {
        query: vi
          .fn()
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({
            rows: [{ id: 100, user_id: userId, store_id: storeId, total: 100 }],
          })
          .mockResolvedValueOnce({
            rows: [{ id: 1, order_id: 100, product_id: 1, quantity: 2, unit_price: 50 }],
          })
          .mockResolvedValueOnce({}), // COMMIT
        release: vi.fn(),
      };

      (OrderRepository.getClient as any).mockResolvedValue(mockClient);
      (OrderRepository.createOrder as any).mockResolvedValue({
        id: 100,
        user_id: userId,
        store_id: storeId,
        total: 100,
      });
      (OrderRepository.createOrderProducts as any).mockResolvedValue([
        { product_id: 1, quantity: 2, unit_price: 50 },
      ]);
      (storeAdminClient.deductInventory as any).mockResolvedValue({});
      (paymentClient.createPaymentIntent as any).mockResolvedValue(null);

      await expect(OrderService.createOrder(userId, storeId, dto)).rejects.toThrow(
        'Failed to create payment intent'
      );
      expect(mockClient.query).toHaveBeenCalledWith('ROLLBACK');
    });

    it('should reject when store not found', async () => {
      const userId = 10;
      const storeId = 999;
      const dto = {
        items: [{ product_id: 1, quantity: 2 }],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(null);

      await expect(OrderService.createOrder(userId, storeId, dto)).rejects.toThrow(
        'Store not found or inactive'
      );
    });

    it('should reject when product not found', async () => {
      const userId = 10;
      const storeId = 20;
      const dto = {
        items: [{ product_id: 999, quantity: 2 }],
      };

      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any).mockResolvedValue(null);

      await expect(OrderService.createOrder(userId, storeId, dto)).rejects.toThrow(
        'not found or inactive'
      );
    });

    it('should reject when product belongs to different store', async () => {
      const userId = 10;
      const storeId = 20;
      const dto = {
        items: [{ product_id: 1, quantity: 2 }],
      };

      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };
      const mockProduct = { id: 1, name: 'Product 1', price: 50, store_id: 99 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any).mockResolvedValue(mockProduct);

      await expect(OrderService.createOrder(userId, storeId, dto)).rejects.toThrow(
        'does not belong to store'
      );
    });

    it('should reject when insufficient inventory', async () => {
      const userId = 10;
      const storeId = 20;
      const dto = {
        items: [{ product_id: 1, quantity: 10 }],
      };

      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };
      const mockProduct = { id: 1, name: 'Product 1', price: 50, store_id: 20 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any).mockResolvedValue(mockProduct);
      (storeAdminClient.getProductStock as any).mockResolvedValue(2);

      await expect(OrderService.createOrder(userId, storeId, dto)).rejects.toThrow(
        'Insufficient inventory'
      );
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment and transition from pending to paid', async () => {
      const orderId = 100;
      const userId = 10;

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: 20,
        total: 100,
        status: OrderStatus.PAID,
      };

      const mockOrderWithProducts = {
        ...mockOrder,
        customer: { id: userId, email: 'customer@example.com' },
        store: { id: 20, email: 'store@example.com' },
        items: [],
      };

      (OrderRepository.updateStatus as any).mockResolvedValue(mockOrder);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(
        mockOrderWithProducts
      );
      (otpHelper.generateOTP as any).mockReturnValue('123456');
      (notificationClient.notifyOrderConfirmed as any).mockResolvedValue({});

      const result = await OrderService.confirmPayment(orderId);

      expect(result).toEqual(mockOrder);
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.PAID,
        OrderStatus.PENDING
      );
      expect(otpHelper.generateOTP).toHaveBeenCalledWith(userId, orderId);
      expect(notificationClient.notifyOrderConfirmed).toHaveBeenCalled();
    });

    it('should throw NotFoundError when order not found during confirmation', async () => {
      const orderId = 100;

      (OrderRepository.updateStatus as any).mockResolvedValue(null);
      (OrderRepository.findById as any).mockResolvedValue(null);

      await expect(OrderService.confirmPayment(orderId)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw NotFoundError when order not found after payment confirmation', async () => {
      const orderId = 100;
      const userId = 10;

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: 20,
        status: OrderStatus.PAID,
      };

      (OrderRepository.updateStatus as any).mockResolvedValue(mockOrder);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(OrderService.confirmPayment(orderId)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should reject when order not in pending status', async () => {
      const orderId = 100;

      (OrderRepository.updateStatus as any).mockResolvedValue(null);
      (OrderRepository.findById as any).mockResolvedValue({
        id: orderId,
        status: OrderStatus.COMPLETED,
      });

      await expect(OrderService.confirmPayment(orderId)).rejects.toThrow();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status with valid transition', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        total: 100,
        status: OrderStatus.PAID,
        customer: { id: 10, email: 'customer@example.com' },
        store: { id: storeId, email: 'store@example.com' },
        items: [],
      };

      const updatedOrder = { ...mockOrder, status: OrderStatus.PREPARING };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (OrderRepository.updateStatus as any).mockResolvedValue(updatedOrder);
      (notificationClient.notifyOrderStatusUpdated as any).mockResolvedValue({});

      const result = await OrderService.updateOrderStatus(
        orderId,
        dto,
        storeId,
        userId
      );

      expect(result).toEqual(updatedOrder);
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.PREPARING,
        OrderStatus.PAID
      );
    });

    it('should reject when order not found', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Order not found');
    });

    it('should reject when trying to set status to COMPLETED', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.COMPLETED };

      const mockOrder = {
        id: orderId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Use PATCH /orders/:id/complete');
    });

    it('should reject when trying to set status to CANCELLED', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.CANCELLED };

      const mockOrder = {
        id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Use DELETE /stores');
    });

    it('should throw ConflictError when status update fails', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      const mockOrder = {
        id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (OrderRepository.updateStatus as any).mockResolvedValue(null);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Unable to change order status');
    });

    it('should throw NotFoundError when order not found after update', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      const mockOrder = {
        id: orderId,
        store_id: storeId,
        status: OrderStatus.PAID,
      };

      const updatedOrder = { ...mockOrder, status: OrderStatus.PREPARING };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(null); // second call returns null
      (OrderRepository.updateStatus as any).mockResolvedValue(updatedOrder);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Order not found after update');
    });

    it('should reject invalid status transition', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      const mockOrder = {
        id: orderId,
        store_id: storeId,
        status: OrderStatus.PENDING,
        customer: { email: 'customer@example.com' },
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.updateOrderStatus(orderId, dto, storeId, userId)
      ).rejects.toThrow('Invalid status transition');
    });
  });

  describe('validateOTPAndComplete', () => {
    it('should complete order with valid OTP', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '123456';

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      const mockOrderWithProducts = {
        ...mockOrder,
        status: OrderStatus.COMPLETED,
        customer: { id: userId, email: 'customer@example.com' },
        store: { id: storeId, email: 'store@example.com' },
        items: [],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 100,
      });
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(true);
      (OrderRepository.updateStatus as any).mockResolvedValue(
        mockOrderWithProducts
      );
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(
        mockOrderWithProducts
      );
      (notificationClient.notifyOrderStatusUpdated as any).mockResolvedValue({});

      const result = await OrderService.validateOTPAndComplete(
        orderId,
        otp,
        storeId,
        100
      );

      expect(result).toEqual(mockOrderWithProducts);
      expect(otpHelper.validateOTP).toHaveBeenCalledWith(otp, userId, orderId);
    });

    it('should reject when order belongs to different store', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '123456';

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: 99,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 100,
      });
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.validateOTPAndComplete(orderId, otp, storeId, 100)
      ).rejects.toThrow('Unauthorized');
    });

    it('should throw NotFoundError when order not found after update', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '123456';

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 100,
      });
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(true);
      (OrderRepository.updateStatus as any).mockResolvedValue({ ...mockOrder, status: OrderStatus.COMPLETED });
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(
        OrderService.validateOTPAndComplete(orderId, otp, storeId, 100)
      ).rejects.toThrow('Order not found after update');
    });

    it('should reject invalid OTP', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '000000';

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.READY,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 100,
      });
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(false);

      await expect(
        OrderService.validateOTPAndComplete(orderId, otp, storeId, 100)
      ).rejects.toThrow('Invalid or incorrect OTP');
    });

    it('should reject when order is not in ready status', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '123456';

      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.PREPARING,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 100,
      });
      (OrderRepository.findById as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.validateOTPAndComplete(orderId, otp, storeId, 100)
      ).rejects.toThrow('Order must be in ready status');
    });
  });

  describe('deleteOrder', () => {
    it('should cancel pending order', async () => {
      const orderId = 100;

      const mockOrder = {
        id: orderId,
        status: OrderStatus.PENDING,
        customer: { email: 'customer@example.com' },
        items: [],
      };

      const cancelledOrder = {
        ...mockOrder,
        status: OrderStatus.CANCELLED,
      };

      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (notificationClient.notifyOrderCancelledByPayment as any).mockResolvedValue({});

      const result = await OrderService.deleteOrder(orderId);

      expect(result).toEqual(cancelledOrder);
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.CANCELLED,
        OrderStatus.PENDING
      );
    });

    it('should throw NotFoundError when order not found during cancellation', async () => {
      const orderId = 100;

      (OrderRepository.updateStatus as any).mockResolvedValue(null);
      (OrderRepository.findById as any).mockResolvedValue(null);

      await expect(OrderService.deleteOrder(orderId)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should throw NotFoundError when order not found after cancellation', async () => {
      const orderId = 100;

      const cancelledOrder = {
        id: orderId,
        status: OrderStatus.CANCELLED,
      };

      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(OrderService.deleteOrder(orderId)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should reject when order not in pending status', async () => {
      const orderId = 100;

      (OrderRepository.updateStatus as any).mockResolvedValue(null);
      (OrderRepository.findById as any).mockResolvedValue({
        id: orderId,
        status: OrderStatus.PAID,
      });

      await expect(OrderService.deleteOrder(orderId)).rejects.toThrow();
    });
  });

  describe('getOrdersByUser', () => {
    it('should return orders for user', async () => {
      const userId = 10;
      const mockOrders = [
        { id: 1, user_id: userId, store_id: 20, total: 100, status: OrderStatus.COMPLETED },
        { id: 2, user_id: userId, store_id: 30, total: 200, status: OrderStatus.PAID },
      ];

      (OrderRepository.findByUserId as any).mockResolvedValue(mockOrders);

      const result = await OrderService.getOrdersByUser(userId);

      expect(result).toEqual(mockOrders);
      expect(OrderRepository.findByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getOrdersByStore', () => {
    it('should return orders for store', async () => {
      const storeId = 20;
      const userId = 100;
      const mockOrders = [
        { id: 1, user_id: 10, store_id: storeId, total: 100, status: OrderStatus.READY },
      ];

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });
      (OrderRepository.findByStoreId as any).mockResolvedValue(mockOrders);

      const result = await OrderService.getOrdersByStore(storeId, userId);

      expect(result).toEqual(mockOrders);
    });

    it('should throw NotFoundError when store not found', async () => {
      const storeId = 999;
      const userId = 100;

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(null);

      await expect(
        OrderService.getOrdersByStore(storeId, userId)
      ).rejects.toThrow('Store not found or inactive');
    });

    it('should throw ForbiddenError when user is not store admin', async () => {
      const storeId = 20;
      const userId = 100;

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 999,
      });

      await expect(
        OrderService.getOrdersByStore(storeId, userId)
      ).rejects.toThrow('Unauthorized - store does not belong to this user');
    });
  });

  describe('deleteOrderByStore', () => {
    it('should cancel paid order successfully', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
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
        .mockResolvedValueOnce(mockOrder) // restoreInventory fetch
        .mockResolvedValueOnce(cancelledOrder); // after updateStatus
      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockResolvedValue({});
      (notificationClient.notifyOrderCancelledByStore as any).mockResolvedValue({});

      const result = await OrderService.deleteOrderByStore(orderId, storeId, userId);

      expect(result.order).toEqual(cancelledOrder);
      expect(result.alreadyCancelled).toBe(false);
    });

    it('should throw NotFoundError when order not found', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenError when order belongs to different store', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: 99,
        status: OrderStatus.PAID,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Unauthorized - order does not belong to this store');
    });

    it('should throw error when restoreInventory fails', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        items: [{ product_id: 1, quantity: 2 }],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      (storeAdminClient.restoreInventory as any).mockRejectedValue(
        new Error('Store admin service error')
      );

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Failed to restore inventory');
    });

    it('should throw error when cancelPayment fails', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        items: [{ product_id: 1, quantity: 2 }],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockRejectedValue(
        new Error('Payment service error')
      );

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Failed to cancel payment');
    });

    it('should throw ConflictError when status update fails', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        items: [{ product_id: 1, quantity: 2 }],
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder);
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockResolvedValue({});
      (OrderRepository.updateStatus as any).mockResolvedValue(null);

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Unable to cancel order');
    });

    it('should throw NotFoundError when order not found after cancellation', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PAID,
        customer: { email: 'customer@example.com' },
        items: [{ product_id: 1, quantity: 2 }],
      };

      const cancelledOrder = { ...mockOrder, status: OrderStatus.CANCELLED };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(null); // after updateStatus returns null
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockResolvedValue({});
      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Order not found after cancellation');
    });

    it('should throw error when order is not in paid status', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PREPARING,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow("Only orders in 'paid' status can be cancelled");
    });

    it('should return alreadyCancelled true when order already cancelled', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.CANCELLED,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const result = await OrderService.deleteOrderByStore(orderId, storeId, userId);

      expect(result.alreadyCancelled).toBe(true);
      expect(result.order.id).toBe(orderId);
      expect(result.order.status).toBe(OrderStatus.CANCELLED);
    });
  });

  describe('getOrderById', () => {
    it('should return order for store', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        total: 100,
        status: OrderStatus.READY,
        customer: { id: 10, email: 'customer@example.com' },
        store: { id: storeId, email: 'store@example.com' },
        items: [],
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });

      const result = await OrderService.getOrderById(orderId, storeId, userId);

      expect(result).toEqual(mockOrder);
    });

    it('should throw NotFoundError when order not found', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });

      await expect(
        OrderService.getOrderById(orderId, storeId, userId)
      ).rejects.toThrow('Order not found');
    });

    it('should throw ForbiddenError when order belongs to different store', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: 99,
        total: 100,
        status: OrderStatus.READY,
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });

      await expect(
        OrderService.getOrderById(orderId, storeId, userId)
      ).rejects.toThrow('Unauthorized - order does not belong to this store');
    });
  });

  describe('getOrderByIdClient', () => {
    it('should return order for customer', async () => {
      const orderId = 100;
      const userId = 10;
      const mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: 20,
        total: 100,
        status: OrderStatus.COMPLETED,
        customer: { id: userId, email: 'customer@example.com' },
        store: { id: 20, email: 'store@example.com' },
        items: [],
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      const result = await OrderService.getOrderByIdClient(orderId, userId);

      expect(result).toEqual(mockOrder);
    });

    it('should reject when order not found', async () => {
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);

      await expect(OrderService.getOrderByIdClient(999, 10)).rejects.toThrow(
        'Order not found'
      );
    });

    it('should reject when order belongs to different user', async () => {
      const orderId = 100;
      const userId = 10;
      const mockOrder = {
        id: orderId,
        user_id: 99,
        store_id: 20,
        total: 100,
        status: OrderStatus.COMPLETED,
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      await expect(OrderService.getOrderByIdClient(orderId, userId)).rejects.toThrow(
        'does not belong to this user'
      );
    });
  });
});
