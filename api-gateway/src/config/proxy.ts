import { createProxyMiddleware } from 'http-proxy-middleware';
import { Request } from 'express';

const proxyConfig = (target: string, pathRewrite?: Record<string, string>) =>
    createProxyMiddleware({
        target,
        changeOrigin: true,
        pathRewrite,
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

export const catalogProxy = proxyConfig(process.env.CATALOG_SERVICE_URL as string);
export const ordersProxy = proxyConfig(process.env.ORDERS_SERVICE_URL as string, { '^/api/orders': '' });
export const notificationsProxy = proxyConfig(process.env.NOTIFICATIONS_SERVICE_URL as string);
export const paymentProxy = proxyConfig(
    process.env.PAYMENT_SERVICE_URL as string,
    { '^/api/payments': '' }
);
export const paymentConfirmProxy = proxyConfig(process.env.PAYMENT_SERVICE_URL as string);
export const sellersProxy = proxyConfig(process.env.SELLERS_SERVICE_URL as string);