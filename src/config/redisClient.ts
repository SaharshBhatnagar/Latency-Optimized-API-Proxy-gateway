import { createClient } from 'redis';
import 'dotenv/config';

const redisClient = createClient(
    {
  url: process.env.REDIS_URL as string,
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