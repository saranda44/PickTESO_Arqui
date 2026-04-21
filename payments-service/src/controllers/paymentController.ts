import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import { insertPaymentIntent, updatePaymentIntentStatus, insertPayment, getPaymentIntentByOrderId } from '../db/paymentRepository';

enum CardType {
    VISA = '1',
    DECLINED = '2',
    INSUFFICIENT_FUNDS = '3',
    EXPIRED = '4',
    INCORRECT_CVC = '5',
    THREE_D_SECURE = '6',
}

const CARD_NUMBERS: Record<string, string> = {
    '4242424242424242': 'pm_card_visa',
    '4000000000000002': 'pm_card_visa_chargeDeclined',
    '4000000000009995': 'pm_card_visa_chargeDeclinedInsufficientFunds',
    '4000000000000069': 'pm_card_visa_chargeDeclinedExpiredCard',
    '4000000000000127': 'pm_card_visa_chargeDeclinedIncorrectCvc',
    '4000002500003155': 'pm_card_threeDSecure2Required',
};

// Maps the card enum to Stripe's predefined test payment methods
const CARD_MAP: Record<CardType, string> = {
    [CardType.VISA]: 'pm_card_visa',
    [CardType.DECLINED]: 'pm_card_visa_chargeDeclined',
    [CardType.INSUFFICIENT_FUNDS]: 'pm_card_visa_chargeDeclinedInsufficientFunds',
    [CardType.EXPIRED]: 'pm_card_visa_chargeDeclinedExpiredCard',
    [CardType.INCORRECT_CVC]: 'pm_card_visa_chargeDeclinedIncorrectCvc',
    [CardType.THREE_D_SECURE]: 'pm_card_threeDSecure2Required',
};

// Resolves a card input (either enum value or test card number) to a Stripe payment method ID
const resolvePaymentMethod = (card: string): string | null => {
    if (Object.values(CardType).includes(card as CardType)) {
        return CARD_MAP[card as CardType];
    }

    const normalized = card.replace(/\s/g, '');
    return CARD_NUMBERS[normalized] ?? null;
};

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY as string);

const CURRENCIES_ALLOWED = ['mxn', 'usd', 'eur'];

/**
 * Creates a new PaymentIntent in Stripe, saves it to the database,
 * and internally confirms it. On success notifies orders service.
 * Requires amount in cents, currency, orderId, userId and card in the request body.
 */
export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, currency, orderId, userId, orderValue, card } = req.body;

        if (!amount || !currency || !orderId || !userId) {
            res.status(400).json({ error: 'amount, currency, orderId and userId are required' });
            return;
        }

        if (!Number.isInteger(amount) || amount <= 0) {
            res.status(400).json({ error: 'amount must be a positive integer in cents' });
            return;
        }

        if (amount < 1000) {
            res.status(400).json({ error: 'minimum amount is 1000 cents ($10)' });
            return;
        }

        if (!CURRENCIES_ALLOWED.includes(currency.toLowerCase())) {
            res.status(400).json({ error: `currency must be one of: ${CURRENCIES_ALLOWED.join(', ')}` });
            return;
        }

        if (orderValue !== amount) {
            res.status(400).json({ error: 'You need to pay the exact amount of your order' });
            return;
        }

        const paymentMethod = resolvePaymentMethod(card);
        if (!paymentMethod) {
            res.status(400).json({ error: 'card must be a valid enum (1-6) or a Stripe test card number' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency.toLowerCase(),
        });

        const record = await insertPaymentIntent(
            orderId,
            userId,
            paymentIntent.id,
            amount,
            currency,
            paymentIntent.status
        );

        // Internally confirm the payment intent
        req.params.id = paymentIntent.id;
        req.body._internalPaymentIntentRecord = record;

        return confirmPaymentIntent(req, res, next);

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves an existing PaymentIntent by its Stripe ID.
 * Returns the payment's id, amount, currency and current status.
 * Possible statuses: requires_payment_method, requires_confirmation, processing, succeeded, canceled.
 */
export const getPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;

        if (!id) {
            res.status(400).json({ error: 'id is required' });
            return;
        }

        if (Array.isArray(id)) {
            res.status(400).json({ error: 'id must be a single string' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.retrieve(id);

        res.status(200).json({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Confirms a PaymentIntent using a test card selected via the card body parameter.
 * Can be called directly or internally from createPaymentIntent.
 * On success: saves payment to DB and notifies orders service.
 * On failure: notifies orders service to cancel the order.
 */
export const confirmPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    const { card, orderId, _internalPaymentIntentRecord } = req.body;

    try {
        const { id } = req.params;

        if (!id || Array.isArray(id)) {
            res.status(400).json({ error: 'id must be a single string' });
            return;
        }

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        const paymentMethod = resolvePaymentMethod(card);
        if (!paymentMethod) {
            res.status(400).json({ error: 'card must be a valid enum (1-6) or a Stripe test card number' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.confirm(id, {
            payment_method: paymentMethod,
            return_url: 'https://localhost:3004',
        });

        // Use the internal record if passed from createPaymentIntent, otherwise fetch from DB
        const intentRecord = _internalPaymentIntentRecord ?? await updatePaymentIntentStatus(id, paymentIntent.status);
        await updatePaymentIntentStatus(id, paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            const stripeChargeId = typeof paymentIntent.latest_charge === 'string'
                ? paymentIntent.latest_charge
                : paymentIntent.latest_charge?.id ?? 'unknown';

            await insertPayment(
                orderId,
                intentRecord.user_id,
                intentRecord.id,
                stripeChargeId,
                paymentIntent.amount,
                paymentIntent.currency,
                'succeeded'
            );

            await axios.patch(
                `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/confirm-payment`
            );
        }

        res.status(200).json({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            orderId,
        });

    } catch (error) {
        await axios.delete(
            `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
        ).catch(console.error);
        next(error);
    }
};

/**
 * Cancels a PaymentIntent by orderId.
 * Fetches the stripe_payment_intent_id from the database using the orderId.
 * Only PaymentIntents with status requires_payment_method or requires_confirmation can be canceled.
 * Updates the database and notifies orders service.
 */
export const cancelPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        // Get payment intent from DB by orderId
        const record = await getPaymentIntentByOrderId(orderId);

        if (!record) {
            res.status(404).json({ error: 'Payment intent not found for this order' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.cancel(record.stripe_payment_intent_id);

        await updatePaymentIntentStatus(record.stripe_payment_intent_id, paymentIntent.status);

        await axios.delete(
            `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
        );

        res.status(200).json({
            id: paymentIntent.id,
            amount: paymentIntent.amount,
            currency: paymentIntent.currency,
            status: paymentIntent.status,
            orderId,
        });

    } catch (error) {
        next(error);
    }
};