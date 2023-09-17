import mongoose, { Schema } from "mongoose";
import validator from "validator";
import bcrypt from "bcryptjs";
import { IUser } from "../Types/UserTypes";

const UserSchema: Schema = new mongoose.Schema<IUser>(
	{
		firstName: {
			type: String,
			required: [true, "Please Provide Your First Name"],
			trim: true,
		},
		lastName: {
			type: String,
			required: [true, "Please Provide Your Last Name"],
			trim: true,
		},
		email: {
			type: String,
			required: [true, "Please Provide Your Email Address"],
			trim: true,
			unique: true,
			validate: {
				validator: function (val: string): boolean {
					return validator.isEmail(val);
				},
				message: "Please Provide a Valid Email",
			},
		},
		password: {
			type: String,
			required: [true, "Please Provide a Strong Password"],
			minLength: [8, "Password Should Be Minimum 8 Characters Long"],
			select: false,
		},
		role: {
			type: String,
			enum: ["admin", "user"],
			default: "user",
			select: false,
		},
		profilePicture: {
			type: String,
			default: "",
		},
		coverPicture: {
			type: String,
			default: "",
		},
		followers: {
			type: [
				{
					user: {
						type: mongoose.Schema.ObjectId,
						ref: "User",
					},
				},
			],
			default: [],
		},
		followings: {
			type: [
				{
					user: {
						type: mongoose.Schema.ObjectId,
						ref: "User",
					},
				},
			],
			default: [],
		},
		passwordChangedAt: {
			type: Date,
			select: false,
		},
		passwordResetToken: {
			type: String,
			select: false,
		},
		passwordResetExpires: {
			type: Date,
			select: false,
		},
		active: {
			type: Boolean,
			default: true,
			select: false,
		},
		city: {
			type: String,
			required: [true, "Please Provide Your Current City"],
			maxlength: [20, "City Name Must Be Atmost 20 Characters Long"],
		},
		country: {
			type: String,
			required: [true, "Please Provide Your Current Country"],
			maxlength: [20, "Country Name Must Be Atmost 20 Characters Long"],
		},
		bio: {
			type: String,
			required: [true, "Please provide your bio"],
			minlength: [5, "Bio Must Be Atleast 5 Characters Long"],
			maxlength: [100, "Bio Must Be Atmost 100 Characters Long"],
		},
		occupation: {
			type: String,
			required: [true, "Please Provide Your Occupation"],
			maxlength: [30, "Occupation Name Must Be Atmost 30 Characters Long"],
		},
	},
	{ timestamps: true }
);

//hashing password
UserSchema.pre("save", async function (next) {
	if (!this.isModified("password")) return next();
	this.password = await bcrypt.hash(this.password, 12);
	next();
});

//for creating a field for passwordChangedAt
UserSchema.pre("save", function (next) {
	//checking if password is modified or new data entried for the first time
	if (!this.isModified("password") || this.isNew) return next();

	//for real life purpose , saving it 1s earlier
	this.passwordChangedAt = Date.now() - 1000;
	next();
});

const User = mongoose.model<IUser>("User", UserSchema);
export default User;
