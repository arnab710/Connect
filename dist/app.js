"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const SecurityMiddlewareRouter_1 = __importDefault(require("./Routers/SecurityMiddlewareRouter"));
const UserRouter_1 = __importDefault(require("./Routers/UserRouter"));
const PostRouter_1 = __importDefault(require("./Routers/PostRouter"));
const customError_1 = __importDefault(require("./Utils/customError"));
const ErrorController_1 = require("./Controllers/ErrorController");
const app = (0, express_1.default)();
const API = String(process.env.API);
app.use((0, cors_1.default)({
    origin: "*",
    credentials: true,
}));
app.options("*", (0, cors_1.default)());
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
app.use(SecurityMiddlewareRouter_1.default);
app.get("/", (req, res) => res.send("hello"));
//application routes
app.use(`/${API}/users`, UserRouter_1.default);
app.use(`/${API}/posts`, PostRouter_1.default);
//for invalid route
app.all("*", (_req, _res, next) => next(new customError_1.default(404, "This route is not implemented")));
//global error handler
app.use(ErrorController_1.globalErrorHandler);
exports.default = app;
