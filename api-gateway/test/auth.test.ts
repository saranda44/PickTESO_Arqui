import { describe, it, expect, vi, beforeAll, afterAll } from 'vitest';
import request from 'supertest';

// ─── Mock de pool ANTES de importar app ───────────────────────────────────────
// Evita conexión real a Neon en pruebas
vi.mock('../src/db/clients', () => ({
    default: {
        query: vi.fn(),
    },
}));

// ─── Mock de passport para no iniciar flujo OAuth real ────────────────────────
vi.mock('../src/config/passport', () => ({
    default: {
        initialize: () => (_req: any, _res: any, next: any) => next(),
        authenticate: (_strategy: string, _opts: any) =>
            (_req: any, _res: any, next: any) => next(),
    },
}));

// ─── Mock de proxies (no existen en test) ─────────────────────────────────────
vi.mock('../src/config/proxy', () => ({
    catalogProxy: (_req: any, _res: any, next: any) => next(),
    ordersProxy: (_req: any, _res: any, next: any) => next(),
    notificationsProxy: (_req: any, _res: any, next: any) => next(),
    paymentProxy: (_req: any, _res: any, next: any) => next(),
    sellersProxy: (_req: any, _res: any, next: any) => next(),
}));

import app from '../src/app';
import pool from '../src/db/clients';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'test_secret';

// Token válido para GET /api/auth/me
const validToken = jwt.sign(
    {
        id: 1,
        email: 'test@iteso.mx',
        role: 'customer',
        firstName: 'Test',
        storeId: null,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

// Token store_admin para rutas restringidas
const adminToken = jwt.sign(
    {
        id: 2,
        email: 'admin@iteso.mx',
        role: 'store_admin',
        firstName: 'Admin',
        storeId: 1,
    },
    JWT_SECRET,
    { expiresIn: '1h' }
);

// ─────────────────────────────────────────────────────────────────────────────
// Controlador directo: googleCallback — authController.ts líneas 11-32
// Se testea unitario con req/res mockeados, sin pasar por Express ni Passport
// ─────────────────────────────────────────────────────────────────────────────
import { googleCallback } from '../src/controllers/authController';

describe('googleCallback() — unit test directo', () => {

    const makeReq = (user: object) => ({ user }) as any;
    const makeRes = () => ({ redirect: vi.fn() }) as any;

    it('CP-AUTH-CB-01: customer → redirect a CUSTOMER_FRONTEND_URL con token, id y role', () => {
        const req = makeReq({
            id: 1,
            email: 'student@iteso.mx',
            role: 'customer',
            firstName: 'Juan',
            storeId: null,
        });
        const res = makeRes();

        googleCallback(req, res);

        expect(res.redirect).toHaveBeenCalledOnce();
        const url: string = res.redirect.mock.calls[0][0];
        expect(url).toContain('/login?token=');
        expect(url).toContain('role=customer');
        expect(url).toContain('id=1');
        // storeId NO debe aparecer en la URL de customer
        expect(url).not.toContain('storeId=');
    });

    it('CP-AUTH-CB-02: store_admin → redirect a SELLER_FRONTEND_URL con storeId', () => {
        const req = makeReq({
            id: 2,
            email: 'admin@iteso.mx',
            role: 'store_admin',
            firstName: 'Admin',
            storeId: 5,
        });
        const res = makeRes();

        googleCallback(req, res);

        expect(res.redirect).toHaveBeenCalledOnce();
        const url: string = res.redirect.mock.calls[0][0];
        expect(url).toContain('/login?token=');
        expect(url).toContain('role=store_admin');
        expect(url).toContain('storeId=5');
    });

    it('CP-AUTH-CB-03: el token en la URL es un JWT válido con todos los campos del payload', () => {
        const req = makeReq({
            id: 3,
            email: 'sofia@iteso.mx',
            role: 'customer',
            firstName: 'Sofía',
            storeId: null,
        });
        const res = makeRes();

        googleCallback(req, res);

        const url: string = res.redirect.mock.calls[0][0];
        const tokenMatch = url.match(/token=([^&]+)/);
        expect(tokenMatch).not.toBeNull();

        const decoded = jwt.verify(tokenMatch![1], JWT_SECRET) as any;
        expect(decoded).toMatchObject({
            id: 3,
            email: 'sofia@iteso.mx',
            role: 'customer',
            firstName: 'Sofía',
            storeId: null,
        });
    });

    it('CP-AUTH-CB-04: el JWT expira en 8h (expiresIn dentro del payload)', () => {
        const req = makeReq({
            id: 4,
            email: 'oscar@iteso.mx',
            role: 'customer',
            firstName: 'Oscar',
            storeId: null,
        });
        const res = makeRes();

        const before = Math.floor(Date.now() / 1000);
        googleCallback(req, res);
        const after = Math.floor(Date.now() / 1000);

        const url: string = res.redirect.mock.calls[0][0];
        const token = url.match(/token=([^&]+)/)![1];
        const decoded = jwt.verify(token, JWT_SECRET) as any;

        // exp debe ser aproximadamente now + 8h (28800 segundos)
        expect(decoded.exp).toBeGreaterThanOrEqual(before + 28800);
        expect(decoded.exp).toBeLessThanOrEqual(after + 28800 + 5); // margen 5s
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: POST /api/auth/register
// Controlador: register — authController.ts
// ─────────────────────────────────────────────────────────────────────────────
describe('POST /api/auth/register — register()', () => {

    it('CP-AUTH-01: campos válidos → 201 + loginUrl', async () => {
        // pool.query: primera llamada (SELECT) sin filas → segunda (INSERT) ok
        (pool.query as any)
            .mockResolvedValueOnce({ rows: [] })   // SELECT → no existe
            .mockResolvedValueOnce({ rows: [] });   // INSERT → ok

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Juan',
                paternalLastName: 'Pérez',
                maternalLastName: 'López',
                email: 'juan@iteso.mx',
            });

        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('message', 'User registered successfully, please login');
        expect(res.body).toHaveProperty('loginUrl');
    });

    it('CP-AUTH-02: falta paternalLastName → 400 con mensaje de error', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({ firstName: 'Sara', email: 'sara@iteso.mx' }); // faltan 2 campos

        expect(res.statusCode).toBe(400);
        expect(res.body.error).toContain('required');
    });

    it('CP-AUTH-02b: body vacío → 400', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({});

        expect(res.statusCode).toBe(400);
    });

    it('CP-AUTH-03: email duplicado → 409', async () => {
        // pool.query SELECT devuelve una fila → usuario ya existe
        (pool.query as any)
            .mockResolvedValueOnce({ rows: [{ id: 99 }] });

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Ana',
                paternalLastName: 'García',
                maternalLastName: 'López',
                email: 'existente@iteso.mx',
            });

        expect(res.statusCode).toBe(409);
        expect(res.body.error).toContain('already exists');
    });

    it('CP-AUTH-03b: error de BD → 500', async () => {
        (pool.query as any)
            .mockRejectedValueOnce(new Error('DB connection failed'));

        const res = await request(app)
            .post('/api/auth/register')
            .send({
                firstName: 'Error',
                paternalLastName: 'Test',
                maternalLastName: 'BD',
                email: 'error@iteso.mx',
            });

        expect(res.statusCode).toBe(500);
        expect(res.body).toHaveProperty('error');
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /api/auth/me
// Controlador: me — authController.ts
// Middleware: authenticate
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/me — me()', () => {

    it('CP-AUTH-04: JWT válido → 200 con datos del usuario', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body.user).toHaveProperty('email', 'test@iteso.mx');
        expect(res.body.user).toHaveProperty('role', 'customer');
    });

    it('CP-AUTH-05: sin Authorization header → 401', async () => {
        const res = await request(app).get('/api/auth/me');
        expect(res.statusCode).toBe(401);
    });

    it('CP-AUTH-06: token manipulado → 401 o 403', async () => {
        const res = await request(app)
            .get('/api/auth/me')
            .set('Authorization', 'Bearer token.falso.manipulado');
        expect([401, 403]).toContain(res.statusCode);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /api/auth/admin-only
// Middleware: authenticate + authorize('platform_admin')
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/admin-only — authorize(platform_admin)', () => {

    it('CP-AUTH-07: customer intenta acceder → 403', async () => {
        const res = await request(app)
            .get('/api/auth/admin-only')
            .set('Authorization', `Bearer ${validToken}`); // role: customer

        expect(res.statusCode).toBe(403);
    });

    it('CP-AUTH-08: sin token → 401', async () => {
        const res = await request(app).get('/api/auth/admin-only');
        expect(res.statusCode).toBe(401);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /api/auth/store-only
// Middleware: authenticate + authorize('store_admin', 'platform_admin')
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/auth/store-only — authorize(store_admin)', () => {

    it('CP-AUTH-09: store_admin puede acceder → 200', async () => {
        const res = await request(app)
            .get('/api/auth/store-only')
            .set('Authorization', `Bearer ${adminToken}`);

        expect(res.statusCode).toBe(200);
        expect(res.body.message).toContain('store admin');
    });

    it('CP-AUTH-10: customer no puede acceder → 403', async () => {
        const res = await request(app)
            .get('/api/auth/store-only')
            .set('Authorization', `Bearer ${validToken}`);

        expect(res.statusCode).toBe(403);
    });

});

// ─────────────────────────────────────────────────────────────────────────────
// Ruta: GET /api/health
// Ruta pública de salud del servidor
// ─────────────────────────────────────────────────────────────────────────────
describe('GET /api/health', () => {

    it('CP-HEALTH-01: retorna 200 y status ok', async () => {
        const res = await request(app).get('/api/health');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('status', 'ok');
    });

});