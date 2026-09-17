import { createClient } from 'redis';
import 'dotenv/config';

const redisClient = createClient(
    {
  url: process.env.REDIS_URL as string,
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