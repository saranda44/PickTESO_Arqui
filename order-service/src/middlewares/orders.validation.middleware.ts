import { NextFunction, Request, Response } from 'express';
import { body, param, validationResult } from 'express-validator';
import { OrderStatus } from '../models/order.model';

const VALID_STATUSES: OrderStatus[] = [
  OrderStatus.PENDING,
  OrderStatus.PAID,
  OrderStatus.PREPARING,
  OrderStatus.READY,
  OrderStatus.COMPLETED,
  OrderStatus.CANCELLED,
];

// function to validate that a route parameter is a positive integer - helper
function positiveIntParam (name: string) {
  return param(name)
    .isInt({ min: 1 })
    .withMessage(`${name} must be a positive integer`)
    .toInt();
}

// Middleware to validate order creation requests
export const validateCreateOrder = [
  positiveIntParam('idStore'),
  body('items').isArray({ min: 1 }).withMessage('items must be a non-empty array'),
  body('items.*.product_id')
    .isInt({ min: 1 })
    .withMessage('Each item must have a valid product_id')
    .toInt(),
  body('items.*.quantity')
    .isInt({ min: 1 })
    .withMessage('Each item must have a quantity >= 1')
    .toInt(),
  validateRequest,
];

// Middleware to validate order status update requests
export const validateUpdateOrderStatus = [
  positiveIntParam('idStore'),
  positiveIntParam('id'),
  body('status')
    .isString()
    .withMessage('status is required')
    .bail()
    .isIn(VALID_STATUSES)
    .withMessage(`status must be one of: ${VALID_STATUSES.join(', ')}`),
  validateRequest,
];

// Middleware to validate order ID in route parameters
export const validateStoreOrderIdParams = [
  positiveIntParam('idStore'),
  positiveIntParam('id'),
  validateRequest,
];

// Middleware to validate store ID in route parameters
export const validateStoreIdParam = [positiveIntParam('idStore'), validateRequest];

// Middleware to validate order ID in route parameters for payment and cancellation routes
export const validateOrderIdParam = [positiveIntParam('id'), validateRequest];

// Middleware to validate OTP completion requests for store pickup
export const validateOTPCompletion = [
  positiveIntParam('storeId'),
  positiveIntParam('id'),
  body('otp')
    .isString()
    .withMessage('otp is required')
    .bail()
    .trim()
    .matches(/^\d{6}$/)
    .withMessage('otp must be a 6-digit numeric code'),
  validateRequest,
];

// Middleware to check validation results and return 400 if there are errors
export function validateRequest(req: Request, res: Response, next: NextFunction): void {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    const firstError = errors.array({ onlyFirstError: true })[0];
    res.status(400).json({ error: firstError.msg });
    return;
  }

  next();
}