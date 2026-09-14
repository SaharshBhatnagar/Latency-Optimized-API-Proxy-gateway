import { type Request, type Response, type NextFunction } from 'express';
import { redisClient } from '../config/redisClient.js';

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    if (req.method !== 'GET') {
        return next();
    }

    if (req.originalUrl.includes('/metrics')) {
        return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {

            await redisClient.incr('gateway:cache_hits');

            res.setHeader("Content-Type", "application/json");
            res.setHeader('X-Cache', 'HIT');
            res.status(200).send(cachedData);
            return;
        }

        await redisClient.incr('gateway:cache_misses');
        
        res.locals.cacheKey = cacheKey;
        res.setHeader('X-Cache', 'MISS');
        next();
    } 
    catch (err) {
        console.error('[CloudWatch Alert] Redis Cache Read Error:', err);
        next();
    }

};