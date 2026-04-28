import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderService } from '../../../src/services/orders.service';
import { OrderStatus } from '../../../src/models/order.model';
import { BadRequestError, NotFoundError, ConflictError } from '../../../src/errors';

vi.mock('../../../src/repositories/order.repository');
vi.mock('../../../src/clients/catalog.client');
vi.mock('../../../src/clients/store-admin.client');
vi.mock('../../../src/clients/payment.client');
vi.mock('../../../src/clients/notification.client');
vi.mock('../../../src/helpers/otp.helper');

import { OrderRepository } from '../../../src/repositories/order.repository';
import * as catalogClient from '../../../src/clients/catalog.client';
import * as storeAdminClient from '../../../src/clients/store-admin.client';
import * as paymentClient from '../../../src/clients/payment.client';
import * as notificationClient from '../../../src/clients/notification.client';
import * as otpHelper from '../../../src/helpers/otp.helper';

describe('Orders Service - Lifecycle Flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  // PHASE 1: CREATION - Customer creates order
  describe('Phase 1: Order Creation', () => {
    it('should create order successfully with valid inventory', async () => {
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
        status: OrderStatus.PENDING,
      });
      (OrderRepository.createOrderProducts as any).mockResolvedValue([
        { product_id: 1, quantity: 2, unit_price: 50 },
      ]);
      (storeAdminClient.deductInventory as any).mockResolvedValue({});
      (paymentClient.createPaymentIntent as any).mockResolvedValue({ id: 'pi_123' });

      const result = await OrderService.createOrder(userId, storeId, dto);

      expect(result).toBeDefined();
      expect(result.id).toBe(100);
      expect(result.total).toBe(100);
      expect(result.status).toBe(OrderStatus.PENDING);
    });

    it('should reject order creation when store not found or inventory insufficient', async () => {
      const userId = 10;

      // Test store not found
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(null);
      await expect(
        OrderService.createOrder(userId, 999, { items: [{ product_id: 1, quantity: 2 }] })
      ).rejects.toThrow('Store not found or inactive');

      // Test insufficient inventory
      const mockStore = { id: 20, name: 'Store 1', admin_id: 100 };
      const mockProduct = { id: 1, name: 'Product 1', price: 50, store_id: 20 };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (catalogClient.getProductFromCatalog as any).mockResolvedValue(mockProduct);
      (storeAdminClient.getProductStock as any).mockResolvedValue(1);

      await expect(
        OrderService.createOrder(userId, 20, { items: [{ product_id: 1, quantity: 10 }] })
      ).rejects.toThrow('Insufficient inventory');
    });
  });

  // PHASE 2: PAYMENT - Customer confirms payment
  describe('Phase 2: Payment Confirmation', () => {
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
      expect(result.status).toBe(OrderStatus.PAID);
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.PAID,
        OrderStatus.PENDING
      );
    });

    it('should reject payment confirmation when order not found or invalid state', async () => {
      const orderId = 100;

      (OrderRepository.updateStatus as any).mockResolvedValue(null);
      (OrderRepository.findById as any).mockResolvedValue(null);

      await expect(OrderService.confirmPayment(orderId)).rejects.toThrow('Order not found');
    });
  });

  // PHASE 3: PREPARATION - Store admin updates order status
  describe('Phase 3: Order Status Management by Store', () => {
    it('should update order status with valid transition (paid -> preparing)', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;
      const dto = { status: OrderStatus.PREPARING };

      const mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
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

      expect(result.status).toBe(OrderStatus.PREPARING);
    });

    it('should reject invalid status transitions or unauthorized access', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      // Test invalid transition (pending -> preparing is invalid)
      let mockOrder = {
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
        OrderService.updateOrderStatus(
          orderId,
          { status: OrderStatus.PREPARING },
          storeId,
          userId
        )
      ).rejects.toThrow('Invalid status transition');

      // Test not found
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);
      await expect(
        OrderService.updateOrderStatus(
          orderId,
          { status: OrderStatus.PREPARING },
          storeId,
          userId
        )
      ).rejects.toThrow('Order not found');
    });
  });

  // PHASE 4: COMPLETION - Store admin completes order with OTP
  describe('Phase 4: Order Completion with OTP', () => {
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

      expect(result.status).toBe(OrderStatus.COMPLETED);
      expect(otpHelper.validateOTP).toHaveBeenCalledWith(otp, userId, orderId);
    });

    it('should reject completion with invalid OTP or wrong order state', async () => {
      const orderId = 100;
      const userId = 10;
      const storeId = 20;
      const otp = '000000';

      // Test invalid OTP
      let mockOrder = {
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

      // Test wrong order status
      mockOrder = {
        id: orderId,
        user_id: userId,
        store_id: storeId,
        status: OrderStatus.PREPARING,
      };

      (OrderRepository.findById as any).mockResolvedValue(mockOrder);
      (otpHelper.validateOTP as any).mockReturnValue(true);

      await expect(
        OrderService.validateOTPAndComplete(orderId, otp, storeId, 100)
      ).rejects.toThrow('Order must be in ready status');
    });
  });

  // PHASE 5: CANCELLATION - Order cancellation at different stages
  describe('Phase 5: Order Cancellation', () => {
    it('should cancel pending order by customer', async () => {
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

      expect(result.status).toBe(OrderStatus.CANCELLED);
      expect(OrderRepository.updateStatus).toHaveBeenCalledWith(
        orderId,
        OrderStatus.CANCELLED,
        OrderStatus.PENDING
      );
    });

    it('should cancel paid order by store admin or handle already-cancelled state', async () => {
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
        .mockResolvedValueOnce(mockOrder)
        .mockResolvedValueOnce(cancelledOrder);
      (OrderRepository.updateStatus as any).mockResolvedValue(cancelledOrder);
      (storeAdminClient.restoreInventory as any).mockResolvedValue({});
      (paymentClient.cancelPayment as any).mockResolvedValue({});
      (notificationClient.notifyOrderCancelledByStore as any).mockResolvedValue({});

      const result = await OrderService.deleteOrderByStore(orderId, storeId, userId);

      expect(result.order.status).toBe(OrderStatus.CANCELLED);
      expect(result.alreadyCancelled).toBe(false);
    });

    it('should reject cancellation for invalid order states or unauthorized access', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      const mockStore = { id: storeId, admin_id: userId };

      // Test already cancelled
      let mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.CANCELLED,
      };

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue(mockStore);
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);

      let result = await OrderService.deleteOrderByStore(orderId, storeId, userId);
      expect(result.alreadyCancelled).toBe(true);

      // Test order not found
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);
      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow('Order not found');

      // Test invalid status (only paid can be cancelled by store)
      mockOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.PREPARING,
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(mockOrder);
      await expect(
        OrderService.deleteOrderByStore(orderId, storeId, userId)
      ).rejects.toThrow("Only orders in 'paid' status can be cancelled");
    });
  });

  // PHASE 6: QUERIES - Order retrieval and listing
  describe('Phase 6: Order Retrieval & Queries', () => {
    it('should retrieve orders for user and store', async () => {
      // User orders
      const userId = 10;
      const mockUserOrders = [
        { id: 1, user_id: userId, store_id: 20, total: 100, status: OrderStatus.COMPLETED },
      ];

      (OrderRepository.findByUserId as any).mockResolvedValue(mockUserOrders);
      let result = await OrderService.getOrdersByUser(userId);
      expect(result).toEqual(mockUserOrders);

      // Store orders (with authorization)
      const storeId = 20;
      const storeUserId = 100;
      const mockStoreOrders = [
        { id: 1, user_id: 10, store_id: storeId, total: 100, status: OrderStatus.READY },
      ];

      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: storeUserId,
      });
      (OrderRepository.findByStoreId as any).mockResolvedValue(mockStoreOrders);

      result = await OrderService.getOrdersByStore(storeId, storeUserId);
      expect(result).toEqual(mockStoreOrders);
    });

    it('should retrieve individual orders with proper authorization', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      // Store admin retrieving order by store
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

      let result = await OrderService.getOrderById(orderId, storeId, userId);
      expect(result).toEqual(mockOrder);

      // Customer retrieving their own order
      const customerUserId = 10;
      const customerOrder = {
        id: orderId,
        user_id: customerUserId,
        store_id: storeId,
        total: 100,
        status: OrderStatus.COMPLETED,
        customer: { id: customerUserId, email: 'customer@example.com' },
        store: { id: storeId, email: 'store@example.com' },
        items: [],
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(customerOrder);
      result = await OrderService.getOrderByIdClient(orderId, customerUserId);
      expect(result).toEqual(customerOrder);
    });

    it('should reject unauthorized queries or non-existent orders', async () => {
      const orderId = 100;
      const storeId = 20;
      const userId = 100;

      // Unauthorized store access
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: 999, // Different user
      });

      await expect(
        OrderService.getOrdersByStore(storeId, userId)
      ).rejects.toThrow('Unauthorized - store does not belong to this user');

      // Order not found
      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(null);
      (catalogClient.getStoreFromCatalog as any).mockResolvedValue({
        id: storeId,
        admin_id: userId,
      });

      await expect(
        OrderService.getOrderById(orderId, storeId, userId)
      ).rejects.toThrow('Order not found');

      // Customer accessing wrong order
      const wrongCustomerId = 5;
      const customerOrder = {
        id: orderId,
        user_id: 10,
        store_id: storeId,
        status: OrderStatus.COMPLETED,
      };

      (OrderRepository.findByIdWithProducts as any).mockResolvedValue(customerOrder);
      await expect(
        OrderService.getOrderByIdClient(orderId, wrongCustomerId)
      ).rejects.toThrow('does not belong to this user');
    });
  });
});
