import pool from './db';

/**
 * Inserts a new payment intent record into the database after creating it in Stripe.
 */
export const insertPaymentIntent = async (
    orderId: number,
    userId: number,
    stripePaymentIntentId: string,
    amount: number,
    currency: string,
    status: string
) => {
    const result = await pool.query(
        `INSERT INTO payment_intents 
            (order_id, user_id, stripe_payment_intent_id, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6)
         RETURNING *`,
        [orderId, userId, stripePaymentIntentId, amount / 100, currency.toUpperCase(), status]
    );
    return result.rows[0];
};

/**
 * Updates the status of an existing payment intent in the database.
 */
export const updatePaymentIntentStatus = async (
    stripePaymentIntentId: string,
    status: string
) => {
    const result = await pool.query(
        `UPDATE payment_intents
         SET status = $1
         WHERE stripe_payment_intent_id = $2
         RETURNING *`,
        [status, stripePaymentIntentId]
    );
    return result.rows[0];
};

/**
 * Inserts a new payment record once a payment intent is confirmed as succeeded.
 * Requires the internal payment_intent id (not the Stripe one).
 */
export const insertPayment = async (
    orderId: number,
    userId: number,
    paymentIntentId: number,
    stripeChargeId: string,
    amount: number,
    currency: string,
    status: string
) => {
    const result = await pool.query(
        `INSERT INTO payments
            (order_id, user_id, payment_intent_id, stripe_charge_id, amount, currency, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING *`,
        [orderId, userId, paymentIntentId, stripeChargeId, amount / 100, currency.toUpperCase(), status]
    );
    return result.rows[0];
};

/**
 * Fetches a payment intent record by its Stripe payment intent id.
 */
export const getPaymentIntentByStripeId = async (stripePaymentIntentId: string) => {
    const result = await pool.query(
        `SELECT * FROM payment_intents WHERE stripe_payment_intent_id = $1`,
        [stripePaymentIntentId]
    );
    return result.rows[0];
};

/**
 * Fetches a payment intent record by its order id.
 */
export const getPaymentIntentByOrderId = async (orderId: number) => {
    const result = await pool.query(
        `SELECT * FROM payment_intents WHERE order_id = $1`,
        [orderId]
    );
    return result.rows[0];
};
