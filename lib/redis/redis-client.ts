import { createClient } from "redis";

const redisClient = await createClient({
  socket: {
    host: process.env.REDIS_HOST as string,
    port: parseInt(process.env.REDIS_PORT as string),
  },
  password: process.env.REDIS_PASSWORD as string,
})
  .on("error", (err) => console.log("Redis Client Error", err))
  .connect();

export default redisClient;
