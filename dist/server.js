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
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const dotenv_1 = __importDefault(require("dotenv"));
dotenv_1.default.config({ path: `${__dirname}/../config.env` });
const app_1 = __importDefault(require("./app"));
const dbConnection_1 = __importDefault(require("./dbConnection"));
const RedisConnection_1 = __importDefault(require("./RedisConnection"));
const CloudinaryConnection_1 = __importDefault(require("./CloudinaryConnection"));
const PORT = process.env.PORT || 3000;
const server = () => __awaiter(void 0, void 0, void 0, function* () {
    try {
        (0, dbConnection_1.default)(); //DB connection
        (0, CloudinaryConnection_1.default)();
        app_1.default.listen(PORT, () => {
            if (process.env.NODE_ENV === "development")
                console.log(`App is running at port ${PORT}`);
        });
        yield (0, RedisConnection_1.default)(); //Redis connection
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.log(err);
        process.exit(1);
    }
});
//running the server
server();
