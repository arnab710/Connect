import mongoose from "mongoose";

export interface Like {
	post: mongoose.Types.ObjectId;
	user: mongoose.Types.ObjectId;
}
