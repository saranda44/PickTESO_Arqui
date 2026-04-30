import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';

const createProxy = (target: string) =>
    createProxyMiddleware({
        target,
        changeOrigin: true,
        on: {
            proxyReq: (proxyReq, req: Request) => {
                const authHeader = req.headers['authorization'];
                console.log('AUTH HEADER:', req.headers['authorization']);
                
                if (authHeader) {
                    proxyReq.setHeader('Authorization', authHeader);
                }
                if (req.user) {
                    const user = req.user as any;
                    proxyReq.setHeader('X-User-Id', String(user.id));
                    proxyReq.setHeader('X-User-Role', user.role);
                    if (user.storeId) {
                        proxyReq.setHeader('X-Store-Id', String(user.storeId));
                    }
                }
            },
        },
    });

export const catalogProxy = createProxy(process.env.CATALOG_SERVICE_URL as string);
export const ordersProxy = createProxy(process.env.ORDERS_SERVICE_URL as string);
export const notificationsProxy = createProxy(process.env.NOTIFICATIONS_SERVICE_URL as string);
export const paymentProxy = createProxy(process.env.PAYMENT_SERVICE_URL as string);
export const paymentConfirmProxy = createProxy(process.env.PAYMENT_SERVICE_URL as string);
export const sellersProxy = createProxy(process.env.SELLERS_SERVICE_URL as string);