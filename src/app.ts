import express, { Application, NextFunction, Request, Response } from "express";
import cors from "cors";
import SecurityMiddlewareRouter from "./Routers/SecurityMiddlewareRouter";
import UserRouter from "./Routers/UserRouter";
import PostRouter from "./Routers/PostRouter";
import customError from "./Utils/customError";
import { globalErrorHandler } from "./Controllers/ErrorController";

const app: Application = express();
const API: string = String(process.env.API);

app.use(
	cors({
		origin: process.env.FRONTEND_ORIGIN,
		credentials: true,
	})
);
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(SecurityMiddlewareRouter);

//application routes
app.use(`/${API}/users`, UserRouter);
app.use(`/${API}/posts`, PostRouter);

//for invalid route
app.all("*", (_req: Request, _res: Response, next: NextFunction) => next(new customError(404, "This route is not implemented")));

//global error handler
app.use(globalErrorHandler);

export default app;
