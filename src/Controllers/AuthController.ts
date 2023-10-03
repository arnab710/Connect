import { NextFunction, Request, Response } from "express";
import User from "../Models/UserModel";
import jwt from "jsonwebtoken";
import { Document } from "mongoose";
import bcrypt from "bcryptjs";
import { IUser } from "../Types/UserTypes";
import { CheckPasswordChangedTime, CookieSetter, CreatePasswordResetToken, EmailSender, VerifyToken } from "../Utils/ControllerHelper";
import { client, redisClientError } from "../RedisConnection";
import { JwtPayload } from "../Types/jwtTypes";
import crypto from "crypto";
import { catchAsync } from "../Utils/catchAsync";
import customError from "../Utils/customError";

const register = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (req.cookies?.jwt) return next(new customError(403, "You Are Already Logged In"));

	const { firstName, lastName, email, password, confirmPassword, city, country, bio, occupation } = req.body;
	if (password !== confirmPassword) return next(new customError(403, "Password And Confirm Password Are Not Same"));

	//creating and saving new mongoose instance
	let newUser: IUser & Document = new User({ firstName, lastName, email, password, city, country, bio, occupation });
	await newUser.save();

	//token generation
	const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET as string, {
		expiresIn: process.env.JWT_EXPIRE as string,
	});

	//deleting sensitive data
	const DeletedData: string[] = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active"];
	DeletedData.forEach((val: string) => ((newUser as any)[val] = undefined));

	//setting jwt cookie
	CookieSetter(token, res);

	return res.status(201).json({ result: "pass", message: "User Created Successfully", newUser, jwtToken: token });
});

const login = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (req.cookies?.jwt) return next(new customError(403, "You Are Already Logged In"));

	const { email, password } = req.body;
	if (!email || !password) return next(new customError(400, "Please Provide Required Details"));

	let user: any = await User.findOne({ email }).select("+password +active");
	if (!user) return next(new customError(401, "Incorrect Email Or Password"));

	//password check
	const encryptedPassword: string = user.password;
	const matched = await bcrypt.compare(password, encryptedPassword);
	if (!matched) return next(new customError(401, "Incorrect Email Or Password"));

	//setting active to true if it was previously false (user previously deleted his account)
	if (user.active === false) {
		user.active = true;
		await user.save({ validateBeforeSave: false });
	}

	//token generation
	const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET as string, {
		expiresIn: process.env.JWT_EXPIRE as string,
	});

	//after the save I can manipulate NewUser to delete sensitive data
	const DeletedData = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active"];
	DeletedData.forEach((val) => ((user as any)[val] = undefined));

	//setting jwt cookie
	CookieSetter(token, res);

	res.status(200).json({ result: "pass", message: "Logged-In Successful", token, user });
});

const authCheck = catchAsync(async (req: any, _res: Response, next: NextFunction) => {
	//JWT-TOKEN from cookie or request header
	let token: string = "";
	if (req.cookies?.jwt) token = req.cookies.jwt;
	else if (req.headers && req.headers?.authorization && req.headers.authorization?.startsWith("Bearer")) {
		token = req.headers.authorization.split(" ")[1];
	}
	if (token === "") return next(new customError(403, "Please Login"));

	//token verification
	const user: { id?: string; iat?: number } = { id: "", iat: 0 };
	const data: JwtPayload | null = await VerifyToken(token);

	user.id = data?.id;
	user.iat = data?.iat;

	let verifiedUser: any;
	//trying to retrieve user data from Redis Database --cache hit
	if (!redisClientError) {
		try {
			verifiedUser = await client?.get(`user:${user.id}`);
			verifiedUser = JSON.parse(verifiedUser);
		} catch (err) {
			if (process.env.NODE_ENV === "development") console.error(`Redis Connection Problem ${err}`);
		}
	}

	//cache miss not found in redis
	if (!verifiedUser) {
		//checking it in the DB
		verifiedUser = await User.findById(user.id).select("+role +passwordChangedAt");
		if (!verifiedUser) return next(new customError(401, "Some Error Occurred . Please Login Again"));

		//checking if password changed after jwt token issued
		const CheckPasswordChangedAfterTokenIssued = CheckPasswordChangedTime(verifiedUser.passwordChangedAt, user.iat);
		if (CheckPasswordChangedAfterTokenIssued) return next(new customError(403, "Password Was Changed"));

		//setting the client for caching in future
		if (!redisClientError) {
			try {
				await client?.setEx(`user:${user.id}`, 60 * 60 * 2, JSON.stringify(verifiedUser));
			} catch (err) {
				if (process.env.NODE_ENV === "development") console.error(`Redis Connection Problem ${err}`);
			}
		}
	}
	//if cache hit
	else {
		//checking if password changed after jwt token issued
		const CheckPasswordChangedAfterTokenIssued = CheckPasswordChangedTime(verifiedUser.passwordChangedAt, user.iat);
		if (CheckPasswordChangedAfterTokenIssued) return next(new customError(403, "Password Was Changed"));
	}

	//setting verified user as user in the request object
	req.user = verifiedUser;
	//Calling next protected route
	next();
});

const logout = catchAsync(async (req: any, res: Response, _next: NextFunction) => {
	// set cookie
	res.clearCookie("jwt");

	//deleting from redis client
	if (!redisClientError) {
		try {
			const user: any = req.user;
			await client?.del(`user:${user._id}`);
		} catch (err) {
			if (process.env.NODE_ENV === "development") console.error(`Redis Connection Problem ${err}`);
		}
	}

	res.status(200).json({ result: "pass", message: "Logout Successful" });
});

const forgotPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	if (req.cookies?.jwt) return next(new customError(403, "You Are Already Logged In"));
	const { email } = req.body;
	if (!email) return next(new customError(400, "No Email Provided"));
	const user = await User.findOne({ email }).select("_id");
	if (!user) return next(new customError(400, "This Email is Not Registered"));

	const resetToken = CreatePasswordResetToken(user);

	//modifying passwordResetToken and passwordResetToken and saving
	await user.save();

	const url = `${process.env.FRONTEND_ORIGIN}/Reset-Password/${resetToken}`;

	//sending emails
	await EmailSender(email, url);

	return res.status(200).json({ result: "pass", message: "Reset Email Sent Successfully!" });
});

const resetPassword = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { resetToken, newPassword, confirmNewPassword } = req.body;

	if (!newPassword || !confirmNewPassword) return next(new customError(400, "Please Enter Required Details"));
	if (newPassword !== confirmNewPassword) return next(new customError(403, "Password and Confirm password are Different"));

	//rehashing the token to compare
	const hashToken = crypto.createHash("sha256").update(resetToken).digest("hex");

	const user = await User.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gte: Date.now() } }).select("+passwordResetToken +passwordResetExpires +password");
	if (!user) return next(new customError(404, "Invalid Link or Link Expired ,Please Try Again !"));

	//setting new password
	user.password = newPassword;

	//setting passwordResetToken and passwordTokenExpires undefined
	user.passwordResetToken = undefined;
	user.passwordResetExpires = undefined;

	//saving the user
	await user.save();

	return res.status(200).json({ result: "pass", message: "Password Changed Successfully" });
});

export { register, login, authCheck, logout, forgotPassword, resetPassword };
