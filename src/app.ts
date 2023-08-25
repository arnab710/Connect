import express, { Application } from "express";
import cors from "cors";
import SecurityMiddlewareRouter from "./Routers/SecurityMiddlewareRouter";
import UserRouter from "./Routers/UserRouter";

const app:Application = express();
const API:string = String(process.env.API);

app.use(cors());
app.use(express.json());
app.use(SecurityMiddlewareRouter);

app.use(`/${API}/users`,UserRouter);

export default  app;