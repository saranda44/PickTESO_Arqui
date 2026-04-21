import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import { insertPaymentIntent, updatePaymentIntentStatus, insertPayment, getPaymentIntentByStripeId } from '../db/paymentRepository';

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
 * Creates a new PaymentIntent in Stripe.
 * Validates that amount is a positive integer in cents (minimum 1000 = $10)
 * and that currency is one of the allowed values.
 * Returns a clientSecret used by the frontend to complete the payment.
 */
export const createPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, currency, orderId, userId, orderValue } = req.body;

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

        if (orderValue != amount){
            res.status(400).json({error: 'You need to pay the exact amount of your order'})
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

        res.status(200).json({
            clientSecret: paymentIntent.client_secret,
            paymentIntentDbId: record.id,
        });

    } catch (error) {
        next(error);
    }
};

/**
 * Retrieves an existing PaymentIntent by its ID.
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
 * Confirms a PaymentIntent using a test card selected via the `card` body parameter.
 * card: '1' uses a valid Visa test card (succeeds).
 * card: '2' uses a declined Visa test card (fails with StripeCardError).
 * This simulates both successful and failed payment flows without real money.
 */
export const confirmPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
        const { card, orderId } = req.body;
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

        const paymentMethod = resolvePaymentMethod(card);

        if (!paymentMethod) {
            res.status(400).json({ error: 'card must be a valid enum (1-6) or a Stripe test card number' });
            return;
        }

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.confirm(id, {
            payment_method: paymentMethod,
            return_url: 'https://localhost:3000',
        });

        const intentRecord = await updatePaymentIntentStatus(id, paymentIntent.status);

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
        if (axios.isAxiosError(error) === false) {
            await axios.delete(
                `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
            ).catch(console.error);
        }
        next(error);
    }
};

/**
 * Cancels an existing PaymentIntent by its ID.
 * Only PaymentIntents with status requires_payment_method or requires_confirmation can be canceled.
 * A succeeded payment cannot be canceled — use a refund instead.
 */
export const cancelPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { id } = req.params;
        const { orderId } = req.body;


        if (!id || Array.isArray(id)) {
            res.status(400).json({ error: 'id must be a single string' });
            return;
        }

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        const paymentIntent = await stripe.paymentIntents.cancel(id);

        await updatePaymentIntentStatus(id, paymentIntent.status);

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