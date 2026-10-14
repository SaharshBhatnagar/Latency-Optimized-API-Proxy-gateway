import { Router, type Request, type Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { redisClient } from '../config/redisClient.js';
import fs from 'fs';
import dns from 'dns/promises';

let defaultBackend = process.env.BACKEND_URL || "http://127.0.0.1:5001";
try {
    await dns.lookup('proxy-backend');
    defaultBackend = "http://proxy-backend:5000";
} catch {
}

let gatewayConfig = [
    {
        route: "/api",
        target: defaultBackend
    }
];

try {
    const configPath = new URL('../config/gateway.json', import.meta.url);
    if (fs.existsSync(configPath)) {
        gatewayConfig = JSON.parse(fs.readFileSync(configPath, 'utf8'));
    }
} catch {
}

const proxyRouter = Router();

gatewayConfig.forEach((route: any) => {
    let targetUrl = process.env.BACKEND_URL || route.target;
    if (targetUrl.includes('localhost') || targetUrl.includes('127.0.0.1')) {
        targetUrl = defaultBackend;
    }

    proxyRouter.use(route.route, createProxyMiddleware({
        target: targetUrl, 
        changeOrigin: true,
        selfHandleResponse: true,
        pathRewrite: (path, req) => {
            const expressReq = req as Request;
            return expressReq.originalUrl;
        },
        on: {
            proxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
                const expressReq = req as Request;
                const expressRes = res as Response;

                const contentType = proxyRes.headers['content-type'];
                const isJson = contentType && contentType.includes('application/json');

                if (expressReq.method === 'GET' && proxyRes.statusCode === 200 && isJson) {
                    try {
                        const responseData = responseBuffer.toString('utf8');
                        const cacheKey = expressRes.locals.cacheKey || `gateway_cache:${expressReq.originalUrl}`;
                        
                        redisClient.setEx(cacheKey, 3600, responseData).catch(err => {
                            console.error('[CloudWatch Alert] Redis Background Write Error:', err);
                        });
                    } catch (err) {
                        console.error('[CloudWatch Alert] Proxy Buffer Parse Error:', err);
                    }
                }
            
                return responseBuffer;
            }),
            error: (err, req, res) => {
                const expressRes = res as Response;

                console.error('[CloudWatch Alert] Downstream Proxy Error:', err);
                if (!expressRes.headersSent) {
                    expressRes.status(502).json({ error: "Bad Gateway: Downstream service unavailable" });
                }
            }
        }
    }));
});

export default proxyRouter;