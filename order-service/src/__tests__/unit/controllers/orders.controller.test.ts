import { describe, it, expect, vi, beforeEach } from 'vitest';
import { OrderController } from '../../../controllers/orders.controller';
import { OrderService } from '../../../services/orders.service';
import { OrderStatus } from '../../../models/order.model';
import { BadRequestError, NotFoundError } from '../../../errors';

vi.mock('../../../services/orders.service');

describe('Orders Controller', () => {
  let req: any;
  let res: any;
  let next: any;

  beforeEach(() => {
    req = {
      user: { id: 10 },
      params: {},
      body: {},
      headers: {},
    };
    res = {
      status: vi.fn().mockReturnThis(),
      json: vi.fn().mockReturnThis(),
    };
    next = vi.fn();
    vi.clearAllMocks();
  });

  describe('createOrder', () => {
    it('should create order successfully', async () => {
      const mockOrder = {
        id: 100,
        user_id: 10,
        store_id: 20,
        total: 175,
        status: OrderStatus.PENDING,
      };

      req.params = { idStore: '20' };
      req.body = {
        items: [{ product_id: 1, quantity: 2 }],
      };
      req.headers.authorization = 'Bearer token';

      (OrderService.createOrder as any).mockResolvedValue(mockOrder);

      await OrderController.createOrder(req, res, next);

      expect(res.status).toHaveBeenCalledWith(201);
      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on createOrder failure', async () => {
      const error = new BadRequestError('Invalid input');

      req.params = { idStore: '20' };
      req.body = { items: [] };

      (OrderService.createOrder as any).mockRejectedValue(error);

      await OrderController.createOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('updateOrderStatus', () => {
    it('should update order status successfully', async () => {
      const mockOrder = {
        id: 100,
        status: OrderStatus.PREPARING,
      };

      req.params = { id: '100', idStore: '20' };
      req.body = { status: OrderStatus.PREPARING };

      (OrderService.updateOrderStatus as any).mockResolvedValue(mockOrder);

      await OrderController.updateOrderStatus(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on updateOrderStatus failure', async () => {
      const error = new NotFoundError('Order not found');

      req.params = { id: '100', idStore: '20' };
      req.body = { status: OrderStatus.PREPARING };

      (OrderService.updateOrderStatus as any).mockRejectedValue(error);

      await OrderController.updateOrderStatus(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('confirmPayment', () => {
    it('should confirm payment successfully', async () => {
      const mockOrder = {
        id: 100,
        status: OrderStatus.PAID,
      };

      req.params = { id: '100' };

      (OrderService.confirmPayment as any).mockResolvedValue(mockOrder);

      await OrderController.confirmPayment(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on confirmPayment failure', async () => {
      const error = new BadRequestError('Cannot confirm payment');

      req.params = { id: '100' };

      (OrderService.confirmPayment as any).mockRejectedValue(error);

      await OrderController.confirmPayment(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('validateOTPAndComplete', () => {
    it('should complete order with valid OTP', async () => {
      const mockOrder = {
        id: 100,
        status: OrderStatus.COMPLETED,
      };

      req.params = { id: '100', storeId: '20' };
      req.body = { otp: '123456' };

      (OrderService.validateOTPAndComplete as any).mockResolvedValue(mockOrder);

      await OrderController.validateOTPAndComplete(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ data: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on validateOTPAndComplete failure', async () => {
      const error = new BadRequestError('Invalid OTP');

      req.params = { id: '100', storeId: '20' };
      req.body = { otp: '000000' };

      (OrderService.validateOTPAndComplete as any).mockRejectedValue(error);

      await OrderController.validateOTPAndComplete(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteOrder', () => {
    it('should delete order successfully', async () => {
      const mockOrder = {
        id: 100,
        status: OrderStatus.CANCELLED,
      };

      req.params = { id: '100' };

      (OrderService.deleteOrder as any).mockResolvedValue(mockOrder);

      await OrderController.deleteOrder(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on deleteOrder failure', async () => {
      const error = new NotFoundError('Order not found');

      req.params = { id: '100' };

      (OrderService.deleteOrder as any).mockRejectedValue(error);

      await OrderController.deleteOrder(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getMyOrders', () => {
    it('should return user orders successfully', async () => {
      const mockOrders = [
        { id: 1, user_id: 10, store_id: 20, status: OrderStatus.COMPLETED },
        { id: 2, user_id: 10, store_id: 30, status: OrderStatus.PAID },
      ];

      (OrderService.getOrdersByUser as any).mockResolvedValue(mockOrders);

      await OrderController.getMyOrders(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ orders: mockOrders });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on getMyOrders failure', async () => {
      const error = new Error('Database error');

      (OrderService.getOrdersByUser as any).mockRejectedValue(error);

      await OrderController.getMyOrders(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrdersByStore', () => {
    it('should return store orders successfully', async () => {
      const mockOrders = [
        { id: 1, user_id: 10, store_id: 20, status: OrderStatus.READY },
      ];

      req.params = { idStore: '20' };

      (OrderService.getOrdersByStore as any).mockResolvedValue(mockOrders);

      await OrderController.getOrdersByStore(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ orders: mockOrders });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on getOrdersByStore failure', async () => {
      const error = new BadRequestError('Unauthorized');

      req.params = { idStore: '20' };

      (OrderService.getOrdersByStore as any).mockRejectedValue(error);

      await OrderController.getOrdersByStore(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrderById', () => {
    it('should return order details successfully', async () => {
      const mockOrder = {
        id: 100,
        user_id: 10,
        store_id: 20,
        status: OrderStatus.READY,
        items: [],
      };

      req.params = { id: '100', idStore: '20' };

      (OrderService.getOrderById as any).mockResolvedValue(mockOrder);

      await OrderController.getOrderById(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on getOrderById failure', async () => {
      const error = new NotFoundError('Order not found');

      req.params = { id: '100', idStore: '20' };

      (OrderService.getOrderById as any).mockRejectedValue(error);

      await OrderController.getOrderById(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('getOrderByIdClient', () => {
    it('should return order for customer successfully', async () => {
      const mockOrder = {
        id: 100,
        user_id: 10,
        store_id: 20,
        status: OrderStatus.COMPLETED,
        items: [],
      };

      req.params = { id: '100' };

      (OrderService.getOrderByIdClient as any).mockResolvedValue(mockOrder);

      await OrderController.getOrderByIdClient(req, res, next);

      expect(res.json).toHaveBeenCalledWith({ order: mockOrder });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on getOrderByIdClient failure', async () => {
      const error = new NotFoundError('Order not found');

      req.params = { id: '100' };

      (OrderService.getOrderByIdClient as any).mockRejectedValue(error);

      await OrderController.getOrderByIdClient(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });

  describe('deleteOrderByStore', () => {
    it('should cancel order by store successfully', async () => {
      const mockResult = {
        order: { id: 100, status: OrderStatus.CANCELLED },
        alreadyCancelled: false,
      };

      req.params = { id: '100', idStore: '20' };
      req.headers.authorization = 'Bearer token';

      (OrderService.deleteOrderByStore as any).mockResolvedValue(mockResult);

      await OrderController.deleteOrderByStore(req, res, next);

      expect(res.json).toHaveBeenCalledWith({
        order: mockResult.order,
        alreadyCancelled: mockResult.alreadyCancelled,
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next with error on deleteOrderByStore failure', async () => {
      const error = new BadRequestError('Cannot cancel this order');

      req.params = { id: '100', idStore: '20' };
      req.headers.authorization = 'Bearer token';

      (OrderService.deleteOrderByStore as any).mockRejectedValue(error);

      await OrderController.deleteOrderByStore(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});
