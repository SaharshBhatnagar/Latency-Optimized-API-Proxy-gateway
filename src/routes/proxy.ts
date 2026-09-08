import { Router, type Request, type Response } from 'express';
import { createProxyMiddleware, responseInterceptor } from 'http-proxy-middleware';
import { redisClient } from '../config/redisClient.js';
import fs from 'fs';

const gatewayConfig = JSON.parse(fs.readFileSync(new URL('../config/gateway.json', import.meta.url), 'utf8'));

const proxyRouter = Router();

gatewayConfig.forEach((route: any) => {

    proxyRouter.use(route.route, createProxyMiddleware({
        target: route.target, 
        changeOrigin: true,
        selfHandleResponse: true,
        pathRewrite: (path, req) => {
            const expressReq = req as Request;
            return expressReq.originalUrl.replace('/api', '');
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