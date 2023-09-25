import mongoose from "mongoose";
import IPost from "../Types/PostTypes";

const PostSchema = new mongoose.Schema<IPost>(
	{
		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Please Provide The User"],
		},
		description: {
			type: String,
		},
		picture: String,
		video: String,
		audio: String,
		publicID: String,
		likes: {
			type: Number,
			default: 0,
		},
		comments: {
			type: Number,
			default: 0,
		},
	},
	{ timestamps: true }
);

const Post = mongoose.model<IPost>("Post", PostSchema);
export default Post;
