import { Request, Response, NextFunction } from 'express';
import Stripe from 'stripe';
import axios from 'axios';
import { insertPaymentIntent, updatePaymentIntentStatus, insertPayment, getPaymentIntentByStripeId, getPaymentIntentByOrderId, paymentExistsByOrderId } from '../db/paymentRepository';

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

        if (orderValue != amount) {
            res.status(400).json({ error: 'You need to pay the exact amount of your order' })
        }

        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency: currency.toLowerCase(),
            automatic_payment_methods: { enabled: true },
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
            client_secret: paymentIntent.client_secret,
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
 * Confirms a PaymentIntent by retrieving its status from Stripe.
 * Called by the frontend after the user completes payment on Stripe's page.
 * On success: saves payment to DB and notifies orders service.
 * On failure: notifies orders service to cancel the order.
 */
export const confirmPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.body;

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

        // Just retrieve the status from Stripe, no need to confirm manually
        const paymentIntent = await stripe.paymentIntents.retrieve(id);

        await updatePaymentIntentStatus(id, paymentIntent.status);

        if (paymentIntent.status === 'succeeded') {
            const stripeChargeId = typeof paymentIntent.latest_charge === 'string'
                ? paymentIntent.latest_charge
                : paymentIntent.latest_charge?.id ?? 'unknown';

            const intentRecord = await getPaymentIntentByOrderId(orderId);

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
        } else {
            // Payment failed or was canceled
            await axios.delete(
                `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
            ).catch(console.error);
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
 * Cancels an existing PaymentIntent by its ID.
 * Only PaymentIntents with status requires_payment_method or requires_confirmation can be canceled.
 * A succeeded payment cannot be canceled — use a refund instead.
 */
export const cancelPaymentIntent = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { orderId } = req.body;

        if (!orderId) {
            res.status(400).json({ error: 'orderId is required' });
            return;
        }

        // Get stripe payment intent id from DB using orderId
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
// Creates a checkout session for Stripe's hosted payment page, using the client secret from the frontend
export const createCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    try {
        const { amount, currency, orderId, userId } = req.body;

        const session = await stripe.checkout.sessions.create({
            payment_method_types: ['card'],
            line_items: [{
                price_data: {
                    currency: currency.toLowerCase(),
                    product_data: { name: `Order #${orderId}` },
                    unit_amount: amount,
                },
                quantity: 1,
            }],
            mode: 'payment',
            success_url: `http://localhost:4200/payment/result?session_id={CHECKOUT_SESSION_ID}&order_id=${orderId}`,
            cancel_url: `http://localhost:4200/cart`,
        });

        res.status(200).json({ url: session.url });

    } catch (error) {
        next(error);
    }
};

/**
 * Confirms a payment by retrieving the Checkout Session status from Stripe.
 * Called by the frontend after Stripe redirects back with session_id.
 */
export const confirmCheckoutSession = async (req: Request, res: Response, next: NextFunction) => {
    const { orderId } = req.body;
    try {
        const { sessionId } = req.body;

        if (!sessionId || !orderId) {
            res.status(400).json({ error: 'sessionId and orderId are required' });
            return;
        }

        const session = await stripe.checkout.sessions.retrieve(sessionId);

        if (session.payment_status === 'paid') {
            const stripeChargeId = session.payment_intent as string;
            const intentRecord = await getPaymentIntentByOrderId(orderId);

            await updatePaymentIntentStatus(stripeChargeId, 'succeeded');

            const alreadyPaid = await paymentExistsByOrderId(orderId);

            if (!alreadyPaid) {
                await insertPayment(
                    orderId,
                    intentRecord.user_id,
                    intentRecord.id,
                    stripeChargeId,
                    session.amount_total ?? 0,
                    session.currency ?? 'mxn',
                    'succeeded'
                );
            }
                await axios.patch(
                    `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/confirm-payment`
                );

            } else {
                await axios.delete(
                    `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
                ).catch(console.error);
            }

            res.status(200).json({
                status: session.payment_status,
                orderId,
            });

        } catch (error) {
            await axios.delete(
                `${process.env.ORDERS_SERVICE_URL}/orders/${orderId}/cancel`
            ).catch(console.error);
            next(error);
        }
    };