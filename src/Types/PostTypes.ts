import mongoose from "mongoose";

interface IPost {
	user: mongoose.Types.ObjectId;
	location?: string;
	description: string;
	picture?: string;
	video?: string;
	audio?: string;
	publicID?: string;
	likes: number;
	comments: number;
}
export interface Ipost2 {
	_id: mongoose.Types.ObjectId;
	user: mongoose.Types.ObjectId;
	location?: string;
	description: string;
	picture?: string;
	video?: string;
	audio?: string;
	likes: number;
	comments: number;
	toObject(): {
		_id: mongoose.Types.ObjectId;
		user: mongoose.Types.ObjectId;
		location?: string;
		description: string;
		picture?: string;
		video?: string;
		audio?: string;
		likes: number;
		comments: number;
		alreadyLiked: boolean;
	};
}

export default IPost;
