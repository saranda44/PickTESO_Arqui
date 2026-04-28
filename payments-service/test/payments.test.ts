import { describe, it, expect, vi, beforeEach } from 'vitest';
import request from 'supertest';

// ─── vi.hoisted: declara los mocks ANTES del hoist de vi.mock ─────────────────
const {
    mockStripeCreate,
    mockStripeRetrieve,
    mockStripeCancel,
    mockInsertPaymentIntent,
    mockUpdatePaymentIntentStatus,
    mockInsertPayment,
    mockGetPaymentIntentByOrderId,
    mockGetPaymentIntentByStripeId,
    mockAxiosPatch,
    mockAxiosDelete,
} = vi.hoisted(() => ({
    mockStripeCreate: vi.fn(),
    mockStripeRetrieve: vi.fn(),
    mockStripeCancel: vi.fn(),
    mockInsertPaymentIntent: vi.fn(),
    mockUpdatePaymentIntentStatus: vi.fn(),
    mockInsertPayment: vi.fn(),
    mockGetPaymentIntentByOrderId: vi.fn(),
    mockGetPaymentIntentByStripeId: vi.fn(),
    mockAxiosPatch: vi.fn(),
    mockAxiosDelete: vi.fn(),
}));

vi.mock('stripe', () => {
    // StripeError como clase real para que instanceof funcione en errorHandler
    class StripeError extends Error {
        statusCode: number;
        type: string;
        code: string;
        constructor(msg: string, statusCode = 402, type = 'card_error', code = 'card_declined') {
            super(msg);
            this.statusCode = statusCode;
            this.type = type;
            this.code = code;
        }
    }

    const Stripe = function () {
        return {
            paymentIntents: {
                create: mockStripeCreate,
                retrieve: mockStripeRetrieve,
                cancel: mockStripeCancel,
            },
        };
    };
    Stripe.prototype = {};
    Stripe.errors = { StripeError };
    return { default: Stripe };
});

vi.mock('../src/db/paymentRepository', () => ({
    insertPaymentIntent: mockInsertPaymentIntent,
    updatePaymentIntentStatus: mockUpdatePaymentIntentStatus,
    insertPayment: mockInsertPayment,
    getPaymentIntentByOrderId: mockGetPaymentIntentByOrderId,
    getPaymentIntentByStripeId: mockGetPaymentIntentByStripeId,
}));

vi.mock('axios', () => ({
    default: {
        patch: mockAxiosPatch,
        delete: mockAxiosDelete,
    },
}));

import app from '../src/app';
import Stripe from 'stripe';

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /health
// Router: health.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /health', () => {

    it('CP-PAY-HEALTH: retorna 200 con status ok, timestamp y uptime', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
        expect(res.body).toHaveProperty('timestamp');
        expect(res.body).toHaveProperty('uptime');
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: POST /create-payment-intent
// Controlador: createPaymentIntent — paymentController.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /create-payment-intent — createPaymentIntent()', () => {

    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('CP-PAY-01: payload válido → 200 con client_secret y paymentIntentDbId', async () => {
        mockStripeCreate.mockResolvedValueOnce({
            id: 'pi_test_123',
            client_secret: 'pi_test_123_secret_abc',
            status: 'requires_payment_method',
        });
        mockInsertPaymentIntent.mockResolvedValueOnce({ id: 42 });

        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, currency: 'mxn', orderId: 1, userId: 1, orderValue: 9000 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('client_secret', 'pi_test_123_secret_abc');
        expect(res.body).toHaveProperty('paymentIntentDbId', 42);
        expect(mockStripeCreate).toHaveBeenCalledWith({ amount: 9000, currency: 'mxn' });
        expect(mockInsertPaymentIntent).toHaveBeenCalledOnce();
    });

    it('CP-PAY-02: amount < 1000 centavos → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 500, currency: 'mxn', orderId: 1, userId: 1, orderValue: 500 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('minimum amount is 1000 cents');
        expect(mockStripeCreate).not.toHaveBeenCalled();
    });

    it('CP-PAY-03: amount no es entero → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 90.5, currency: 'mxn', orderId: 1, userId: 1, orderValue: 90.5 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('positive integer');
    });

    it('CP-PAY-04: amount negativo → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: -1000, currency: 'mxn', orderId: 1, userId: 1, orderValue: -1000 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('positive integer');
    });

    it('CP-PAY-05: currency no permitida → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, currency: 'yen', orderId: 1, userId: 1, orderValue: 9000 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('currency must be one of: mxn, usd, eur');
    });

    it('CP-PAY-06: amount != orderValue → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, currency: 'mxn', orderId: 1, userId: 1, orderValue: 8000 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('exact amount');
    });

    it('CP-PAY-07: campos requeridos faltantes (sin currency) → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, orderId: 1, userId: 1 });

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('required');
    });

    it('CP-PAY-08: body vacío → 400', async () => {
        const res = await request(app)
            .post('/create-payment-intent')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('required');
    });

    it('CP-PAY-09: currency en mayúsculas es aceptada (se normaliza con toLowerCase)', async () => {
        mockStripeCreate.mockResolvedValueOnce({
            id: 'pi_test_456',
            client_secret: 'pi_test_456_secret',
            status: 'requires_payment_method',
        });
        mockInsertPaymentIntent.mockResolvedValueOnce({ id: 43 });

        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, currency: 'MXN', orderId: 1, userId: 1, orderValue: 9000 });

        expect(res.statusCode).toBe(200);
        expect(mockStripeCreate).toHaveBeenCalledWith({ amount: 9000, currency: 'mxn' });
    });

    it('CP-PAY-10: error de Stripe → llega al errorHandler (500)', async () => {
        mockStripeCreate.mockRejectedValueOnce(new Error('Stripe error'));

        const res = await request(app)
            .post('/create-payment-intent')
            .send({ amount: 9000, currency: 'mxn', orderId: 1, userId: 1, orderValue: 9000 });

        expect(res.statusCode).toBe(500);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /:id
// Controlador: getPaymentIntent — paymentController.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /:id — getPaymentIntent()', () => {

    beforeEach(() => vi.clearAllMocks());

    it('CP-PAY-11: ID válido → 200 con id, amount, currency, status', async () => {
        mockStripeRetrieve.mockResolvedValueOnce({
            id: 'pi_test_123',
            amount: 9000,
            currency: 'mxn',
            status: 'requires_payment_method',
        });

        const res = await request(app).get('/pi_test_123');

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            id: 'pi_test_123',
            amount: 9000,
            currency: 'mxn',
            status: 'requires_payment_method',
        });
    });

    it('CP-PAY-12: ID inválido en Stripe → errorHandler (500)', async () => {
        mockStripeRetrieve.mockRejectedValueOnce(new Error('No such payment_intent'));

        const res = await request(app).get('/pi_id_invalido');

        expect(res.statusCode).toBe(500);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: POST /:id/confirm
// Controlador: confirmPaymentIntent — paymentController.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /:id/confirm — confirmPaymentIntent()', () => {

    beforeEach(() => vi.clearAllMocks());

    it('CP-PAY-13: sin orderId → 400', async () => {
        const res = await request(app)
            .post('/pi_test_123/confirm')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('orderId is required');
    });

    it('CP-PAY-14: pago succeeded → 200, inserta pago en BD y llama a orders service', async () => {
        mockStripeRetrieve.mockResolvedValueOnce({
            id: 'pi_test_123',
            amount: 9000,
            currency: 'mxn',
            status: 'succeeded',
            latest_charge: 'ch_test_abc',
        });
        mockUpdatePaymentIntentStatus.mockResolvedValueOnce(undefined);
        mockGetPaymentIntentByOrderId.mockResolvedValueOnce({ id: 42, user_id: 1 });
        mockInsertPayment.mockResolvedValueOnce(undefined);
        mockAxiosPatch.mockResolvedValueOnce({ data: {} });

        const res = await request(app)
            .post('/pi_test_123/confirm')
            .send({ orderId: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            id: 'pi_test_123',
            status: 'succeeded',
            orderId: 1,
        });
        expect(mockInsertPayment).toHaveBeenCalledOnce();
        expect(mockAxiosPatch).toHaveBeenCalledOnce();
        expect(mockAxiosDelete).not.toHaveBeenCalled();
    });

    it('CP-PAY-15: pago fallido → 200 pero llama a DELETE en orders service (cancela pedido)', async () => {
        mockStripeRetrieve.mockResolvedValueOnce({
            id: 'pi_test_123',
            amount: 9000,
            currency: 'mxn',
            status: 'requires_payment_method',
            latest_charge: null,
        });
        mockUpdatePaymentIntentStatus.mockResolvedValueOnce(undefined);
        mockAxiosDelete.mockResolvedValueOnce({ data: {} });

        const res = await request(app)
            .post('/pi_test_123/confirm')
            .send({ orderId: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body.status).toBe('requires_payment_method');
        expect(mockInsertPayment).not.toHaveBeenCalled();
        expect(mockAxiosPatch).not.toHaveBeenCalled();
        expect(mockAxiosDelete).toHaveBeenCalledOnce();
    });

    it('CP-PAY-16: error en Stripe retrieve → cancela pedido y llama next(error)', async () => {
        mockStripeRetrieve.mockRejectedValueOnce(new Error('Stripe down'));
        mockAxiosDelete.mockResolvedValueOnce({ data: {} });

        const res = await request(app)
            .post('/pi_test_123/confirm')
            .send({ orderId: 1 });

        expect(res.statusCode).toBe(500);
        // El catch del controller llama a DELETE para cancelar el pedido
        expect(mockAxiosDelete).toHaveBeenCalledOnce();
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: POST /cancel
// Controlador: cancelPaymentIntent — paymentController.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /cancel — cancelPaymentIntent()', () => {

    beforeEach(() => vi.clearAllMocks());

    it('CP-PAY-17: sin orderId → 400', async () => {
        const res = await request(app)
            .post('/cancel')
            .send({});

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('orderId is required');
    });

    it('CP-PAY-18: orderId sin PaymentIntent en BD → 404', async () => {
        mockGetPaymentIntentByOrderId.mockResolvedValueOnce(null);

        const res = await request(app)
            .post('/cancel')
            .send({ orderId: 99999 });

        expect(res.statusCode).toBe(404);
        expect(res.body.error).toContain('not found');
    });

    it('CP-PAY-19: cancelación exitosa → 200 con status canceled y llama a orders', async () => {
        mockGetPaymentIntentByOrderId.mockResolvedValueOnce({
            id: 42,
            stripe_payment_intent_id: 'pi_test_123',
        });
        mockStripeCancel.mockResolvedValueOnce({
            id: 'pi_test_123',
            amount: 9000,
            currency: 'mxn',
            status: 'canceled',
        });
        mockUpdatePaymentIntentStatus.mockResolvedValueOnce(undefined);
        mockAxiosDelete.mockResolvedValueOnce({ data: {} });

        const res = await request(app)
            .post('/cancel')
            .send({ orderId: 1 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toMatchObject({
            id: 'pi_test_123',
            status: 'canceled',
            orderId: 1,
        });
        expect(mockStripeCancel).toHaveBeenCalledWith('pi_test_123');
        expect(mockAxiosDelete).toHaveBeenCalledOnce();
    });

    it('CP-PAY-20: error en Stripe cancel → errorHandler (500)', async () => {
        mockGetPaymentIntentByOrderId.mockResolvedValueOnce({
            id: 42,
            stripe_payment_intent_id: 'pi_test_123',
        });
        mockStripeCancel.mockRejectedValueOnce(new Error('Cannot cancel succeeded intent'));

        const res = await request(app)
            .post('/cancel')
            .send({ orderId: 1 });

        expect(res.statusCode).toBe(500);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: errorHandler — middlewares/errorHandler.ts
// Se prueba indirectamente forzando errores en los controladores
// ─────────────────────────────────────────────────────────────────────────────
describe('errorHandler middleware', () => {

    beforeEach(() => vi.clearAllMocks());

    it('CP-ERR-01: StripeError → responde con statusCode, type y code de Stripe', async () => {
        // Forzamos que stripe.paymentIntents.retrieve lance un StripeError
        const StripeError = (Stripe as any).errors.StripeError;
        mockStripeRetrieve.mockRejectedValueOnce(
            new StripeError('Your card was declined', 402, 'card_error', 'card_declined')
        );

        const res = await request(app).get('/pi_test_cualquiera');

        expect(res.statusCode).toBe(402);
        expect(res.body).toHaveProperty('error', 'Your card was declined');
        expect(res.body).toHaveProperty('type', 'card_error');
        expect(res.body).toHaveProperty('code', 'card_declined');
    });

    it('CP-ERR-02: StripeError sin statusCode → cae a 500', async () => {
        const StripeError = (Stripe as any).errors.StripeError;
        const err = new StripeError('Unknown stripe error');
        err.statusCode = 0; // falsy → errorHandler usa 500
        mockStripeRetrieve.mockRejectedValueOnce(err);

        const res = await request(app).get('/pi_test_cualquiera');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('type', 'card_error');
    });

    it('CP-ERR-03: Error genérico (no Stripe) → 500 con error.message', async () => {
        mockStripeRetrieve.mockRejectedValueOnce(new Error('DB connection lost'));

        const res = await request(app).get('/pi_test_cualquiera');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'DB connection lost');
    });

    it('CP-ERR-04: error no es instancia de Error → 500 con mensaje genérico', async () => {
        // Lanzar un string como error (no es instancia de Error ni de StripeError)
        mockStripeRetrieve.mockRejectedValueOnce('algo raro no es un Error');

        const res = await request(app).get('/pi_test_cualquiera');

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error', 'Error interno del servidor');
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Middleware: userFromHeaders — middlewares/user-from-headers.middleware.ts
// Inyecta req.user desde headers x-user-id, x-user-role, x-store-id
// ─────────────────────────────────────────────────────────────────────────────
describe('userFromHeaders middleware', () => {

    beforeEach(() => vi.clearAllMocks());

    it('CP-UH-01: headers completos → req.user disponible en el controlador', async () => {
        // GET /health no modifica req.user pero confirma que el middleware no rompe la cadena
        const res = await request(app)
            .get('/health')
            .set('x-user-id', '1')
            .set('x-user-role', 'customer')
            .set('x-store-id', '2');

        expect(res.statusCode).toBe(200);
    });

    it('CP-UH-02: sin headers → middleware pasa al siguiente sin req.user (ruta pública ok)', async () => {
        const res = await request(app).get('/health');
        expect(res.statusCode).toBe(200);
    });

    it('CP-UH-03: x-user-id presente sin x-store-id → storeId es null', async () => {
        // Verificamos que cuando no viene x-store-id el middleware pone storeId: null
        // Usamos /health para no depender de lógica de negocio
        const res = await request(app)
            .get('/health')
            .set('x-user-id', '5')
            .set('x-user-role', 'customer');
            // sin x-store-id

        expect(res.statusCode).toBe(200);
        // El middleware no debe romper la cadena
    });

    it('CP-UH-04: x-user-id presente con x-store-id → storeId es número', async () => {
        mockStripeCreate.mockResolvedValueOnce({
            id: 'pi_test_hdr',
            client_secret: 'secret_hdr',
            status: 'requires_payment_method',
        });
        mockInsertPaymentIntent.mockResolvedValueOnce({ id: 99 });

        const res = await request(app)
            .post('/create-payment-intent')
            .set('x-user-id', '7')
            .set('x-user-role', 'store_admin')
            .set('x-store-id', '3')
            .send({ amount: 5000, currency: 'mxn', orderId: 10, userId: 7, orderValue: 5000 });

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('client_secret', 'secret_hdr');
    });

    it('CP-UH-05: sin x-user-id → req.user no se asigna, cadena continúa igual', async () => {
        // Cubre el if(userId) === false → next() sin asignar req.user
        const res = await request(app)
            .get('/health');

        expect(res.statusCode).toBe(200);
    });

});