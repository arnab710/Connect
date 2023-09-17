import { NextFunction, Request, Response } from "express";

interface wholeErrObj {
	message: string;
	statusCode?: number;
	stack: object;
	name?: string;
	code?: number;
	keyPattern?: object;
	errors?: object;
	isAlreadyHandled?: boolean;
}

interface errorObj {
	message: string;
}

export const globalErrorHandler = (err: wholeErrObj, _req: Request, res: Response, _next: NextFunction) => {
	err.statusCode = err.statusCode || 500;
	err.message = err.message || "Somethig Went Wrong";

	if (process.env.NODE_ENV === "development") {
		console.error(err);
		return res.status(err.statusCode).json({ result: "fail", message: err.message, stack: err.stack, error: err });
	} else {
		if (err.name === "CastError") return res.status(400).json({ result: "fail", message: "Invalid Parameters Are Provided" });
		if (err.code === 11000) {
			const field: string = Object.keys(err.keyPattern ?? {})[0];
			return res.status(400).json({ result: "fail", message: `This ${field} Already Exists, Try Again With A Different ${field}` });
		}
		if (err.name === "ValidationError") {
			const { message } = Object.values(err.errors ?? {})[0] as errorObj;
			return res.status(400).json({ result: "fail", message });
		}
		//for the error which we already handled beautifully in next() fxn
		if (err.isAlreadyHandled) return res.status(err.statusCode).json({ result: "fail", message: err.message });
	}
};
