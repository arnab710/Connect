import mongoose from "mongoose";
import IComment from "../Types/CommentTypes";

const commentSchema = new mongoose.Schema<IComment>(
	{
		post: {
			type: mongoose.Schema.ObjectId,
			ref: "Post",
			required: [true, "Please Provide a Post"],
		},
		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Please Provide a User"],
		},
		comment: {
			type: String,
			required: [true, "Please Provide a Comment"],
		},
	},
	{ timestamps: true }
);

const Comment = mongoose.model<IComment>("Comment", commentSchema);
export default Comment;
