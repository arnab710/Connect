"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.redisClientError = exports.client = void 0;
const redis_1 = require("redis");
exports.client = (0, redis_1.createClient)({
    password: process.env.REDIS_PASSWORD,
    socket: {
        host: process.env.REDIS_HOST,
        port: Number(process.env.REDIS_PORT),
        reconnectStrategy: () => {
            return 5 * 60 * 1000;
        },
    },
});
exports.redisClientError = false;
const RedisServer = () => __awaiter(void 0, void 0, void 0, function* () {
    exports.client.on("error", (err) => {
        if (process.env.NODE_ENV === "development")
            console.log(`Redis connection error ${err}`);
        exports.redisClientError = true;
    });
    exports.client.on("ready", () => {
        if (process.env.NODE_ENV === "development")
            console.log("Redis is ready");
        exports.redisClientError = false;
    });
    exports.client.on("reconnecting", () => {
        exports.redisClientError = false;
    });
    try {
        yield exports.client.connect();
        if (process.env.NODE_ENV === "development")
            console.log("Redis connect successful");
        exports.redisClientError = false;
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.error(`Error connecting to Redis: ${err}`);
        exports.redisClientError = true;
    }
});
exports.default = RedisServer;
