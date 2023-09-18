import { createClient } from "redis";
export const client = createClient({
	password: process.env.REDIS_PASSWORD,
	socket: {
		host: process.env.REDIS_HOST as string,
		port: Number(process.env.REDIS_PORT),
		reconnectStrategy: () => {
			return 5 * 60 * 1000;
		},
	},
});

export let redisClientError = false;
const RedisServer = async () => {
	client.on("error", (err) => {
		if (process.env.NODE_ENV === "development") console.log(`Redis connection error ${err}`);
		redisClientError = true;
	});

	client.on("ready", () => {
		if (process.env.NODE_ENV === "development") console.log("Redis is ready");
		redisClientError = false;
	});

	client.on("reconnecting", () => {
		redisClientError = false;
	});

	try {
		await client.connect();
		if (process.env.NODE_ENV === "development") console.log("Redis connect successful");
		redisClientError = false;
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.error(`Error connecting to Redis: ${err}`);
		redisClientError = true;
	}
};

export default RedisServer;
