import mongoose from "mongoose";
import IPost from "../Types/PostTypes";

const PostSchema = new mongoose.Schema<IPost>(
	{
		user: {
			type: mongoose.Schema.ObjectId,
			ref: "User",
			required: [true, "Please Provide The User"],
		},
		location: {
			type: String,
			minlength: [3, "Location Length Must Be Atleast 3"],
		},
		description: {
			type: String,
			minlength: [2, "Description Length Must Be Atleast 2"],
		},
		picture: String,
		video: String,
		audio: String,
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
