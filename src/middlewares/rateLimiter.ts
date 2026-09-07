import { type Request, type Response, type NextFunction } from 'express';
import { redisClient } from '../config/redisClient.js';

export async function rateLimiter(req: Request, res: Response, next: NextFunction) {
    const clientIp = req.ip ?? "unknown";

    const redisKey = "rate-limit:" + clientIp;

    try {
        const requestCount = await redisClient.incr(redisKey);

        if (requestCount === 1) {
            await redisClient.expire(redisKey, 60);
        }

        if (requestCount > 100) {
            res.status(429).json({ error: 'Too many requests, please try again later' });
            return;
        }

        next();
    }
    catch (err) {
        console.error(err);
        next();
    }
};
