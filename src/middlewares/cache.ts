import { type Request, type Response, type NextFunction } from 'express';
import { redisClient } from '../config/redisClient.js';

export async function cacheMiddleware(req: Request, res: Response, next: NextFunction) {

    if (req.method !== 'GET') {
        next();
        return;
    }

    const cacheKey = "cache:" + req.originalUrl;

    try {
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            res.setHeader("Content-Type", "application/json");
            res.send(cachedData);
            return;
        }

        const originalSend = res.send.bind(res);
        
        res.send = ((body: any): Response => {

            redisClient.setEx(cacheKey, 120, body);

            return originalSend(body);
        }) as any;

        next();
    } 
    catch (err) {
        console.error(err);
        next();
    }

};