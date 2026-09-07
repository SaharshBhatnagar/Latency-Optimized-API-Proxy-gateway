import 'dotenv/config';
import express from 'express';
import helmet from 'helmet';
import cors from 'cors';
import { connectRedis } from './config/redisClient.js';
import { rateLimiter } from './middlewares/rateLimiter.js';
import { cacheMiddleware } from './middlewares/cache.js';
import { authenticate } from './middlewares/auth.js';
import proxyRouter from './routes/proxy.js';

const app = express();

app.use(helmet());

app.use(cors());

app.use(rateLimiter);

app.use(cacheMiddleware);

app.use(authenticate);

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
