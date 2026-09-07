import { Router } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';

import gatewayConfig from '../config/gateway.json' with { type: 'json'};

const router = Router();

gatewayConfig.forEach((routeObj) => {

    router.use(routeObj.route, createProxyMiddleware({
        target: routeObj.target, 
        changeOrigin: true,
    }));

});

export default router;