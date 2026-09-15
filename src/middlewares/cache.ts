import { type Request, type Response, type NextFunction } from 'express';
import { redisClient } from '../config/redisClient.js';

export const cacheMiddleware = async (req: Request, res: Response, next: NextFunction): Promise<void> => {

    if (req.method !== 'GET') {
        return next();
    }

    const cacheKey = `cache:${req.originalUrl}`;

    try {
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {

            const hits = await redisClient.incr('gateway:cache_hits');
            const total = await redisClient.get('gateway:total_requests');

            const parsedData = JSON.parse(cachedData);
            parsedData.CacheHits = hits;
            parsedData.totalRequest = parseInt(total || '0', 10);

            res.setHeader("Content-Type", "application/json");
            res.setHeader('X-Cache', 'HIT');
            res.status(200).send(JSON.stringify(parsedData));
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