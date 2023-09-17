import mongoose from "mongoose";
import { Like } from "../Types/LikeTypes";

const likeSchema = new mongoose.Schema<Like>({
	post: {
		type: mongoose.Schema.ObjectId,
		ref: "Post",
		required: [true, "Provide a Post ID"],
	},
	user: {
		type: mongoose.Schema.ObjectId,
		ref: "User",
		required: [true, "Provide a User ID"],
	},
});

likeSchema.index({ post: 1, user: 1 }, { unique: true });

const Like = mongoose.model<Like>("Like", likeSchema);
export default Like;
