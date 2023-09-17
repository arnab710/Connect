import { Request } from "express";
import mongoose from "mongoose";

type IUserType = {
	_id?: mongoose.Types.ObjectId;
	firstName: string;
	lastName: string;
	email: string;
	password: string;
	role?: "admin" | "user";
	profilePicture?: string;
	coverPicture?: string;
	followers: { user: string; _id: mongoose.Types.ObjectId }[];
	followings: { user: string; _id: mongoose.Types.ObjectId }[];
	passwordChangedAt?: any;
	passwordResetToken?: any;
	passwordResetExpires?: any;
	active?: boolean;
	city: string;
	country: string;
	bio: string;
	occupation: string;
};

interface newRequestType extends Request {
	user: IUserType;
}

export type { newRequestType };
