import 'dotenv/config';
import express, { type Request, type Response, type NextFunction } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { connectRedis, redisClient } from './config/redisClient.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { cacheMiddleware } from './middlewares/cache.js';
import { authenticate } from './middlewares/auth.js';
import proxyRouter from './routes/proxy.js';

const app = express();

app.use(helmet());

app.use(cors({
    exposedHeaders: ['X-Cache']
}));

app.use(async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        await redisClient.incr('gateway:total_requests');
    } catch (err) {
        console.error('Telemetry logging error:', err);
    }
    next();
});

app.use(rateLimiter);

app.use(authenticate);

app.use(cacheMiddleware);

app.delete('/api/cache', async (req, res) => {
    try {
        await redisClient.flushAll();
        res.status(200).json({ message: "Redis cache completely cleared" });
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: "Failed to flush Redis" });
    }
});

app.use(proxyRouter);

const PORT = process.env.PORT ?? 8000;

async function startServer() {

    try {
        await connectRedis();

        app.listen(PORT, () => {
            console.log("Server is listening on port: " + PORT);
        });

    }
    catch (err) {
        console.error(err);
        process.exit(1);
    }
};

startServer();
