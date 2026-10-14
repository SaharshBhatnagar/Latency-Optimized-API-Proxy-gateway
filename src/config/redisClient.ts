import { createClient } from 'redis';
import dns from 'dns/promises';
import 'dotenv/config';

let redisUrl = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (!process.env.REDIS_URL || process.env.REDIS_URL.includes('127.0.0.1') || process.env.REDIS_URL.includes('localhost')) {
  try {
    await dns.lookup('proxy-redis');
    redisUrl = 'redis://proxy-redis:6379';
  } catch {
  }
}

const redisClient = createClient(
  {
    url: redisUrl,
    pingInterval: 1000 * 60 * 4
  }
);

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.on("connect", () => {
  console.log("Redis client connected");
});

async function connectRedis() {
  await redisClient.connect();
}

export { redisClient, connectRedis };