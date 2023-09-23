import { NextFunction, Request, Response } from "express";
import Post from "../Models/PostModel";
import APIFeatures from "../Utils/APIFeature";
import { catchAsync } from "../Utils/catchAsync";
import customError from "../Utils/customError";
import { newRequestType } from "../Types/ReqestTypeWithUser";
import Like from "../Models/LikeModel";
import mongoose from "mongoose";
import { Ipost2 } from "../Types/PostTypes";

export const PostCreate = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const id = req.user?._id;

	const { fileType, description, file_secure_url } = req.body;
	if (!description && !file_secure_url) return next(new customError(400, "Post Can't Be Empty"));

	//creating mongoose instance based on fileType
	let newPost;
	if (fileType === "image-post" && file_secure_url && req.file.mimetype.startsWith("image")) newPost = new Post({ user: id, picture: file_secure_url, description });
	else if (fileType === "video" && file_secure_url && req.file.mimetype.startsWith("video")) newPost = new Post({ user: id, video: file_secure_url, description });
	else if (fileType === "audio" && file_secure_url && req.file.mimetype.startsWith("audio")) newPost = new Post({ user: id, audio: file_secure_url, description });
	else newPost = new Post({ user: id, description });

	//saving the DB
	await newPost.save();
	res.status(201).json({ result: "pass", message: "Post Created Successfully" });
});

export const allPost = catchAsync(async (req: newRequestType, res: Response, _next: NextFunction) => {
	const PostsObject = new APIFeatures(Post.find().populate({ path: "user", select: "firstName lastName occupation profilePicture" }), req.query).Filtering().Sorting().Paging();
	let Posts = await PostsObject.Query;
	const userID = req.user._id;

	//all the posts that user likes
	const userLikedPosts = await Like.find({ user: userID }).select("post -_id");
	const likedPostIds = userLikedPosts.map((like) => like.post.toString());

	// Modify the Posts array
	const UpdatedPosts = Posts.map((post: Ipost2) => {
		let postObject = post.toObject();
		postObject.alreadyLiked = likedPostIds.includes(post._id.toString());
		return postObject;
	});

	return res.status(200).json({ result: "pass", UpdatedPosts });
});

export const userPost = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
	const userID = req.params?.id;
	const postQuery = new APIFeatures(Post.find({ user: userID }), req.query).Filtering().Sorting().Paging().Query;

	const posts = await postQuery;
	return res.status(200).json({ result: "pass", posts });
});

export const like = catchAsync(async (req: newRequestType, res: Response, next: NextFunction) => {
	const { postID } = req.params;

	const userID = req.user._id;

	const post = await Post.findById(postID).select("likes");
	if (!post) return next(new customError(404, "Post Not Found"));

	const checkLikeOrNot = await Like.findOne({ post: postID, user: userID }).select("_id");
	if (checkLikeOrNot) return next(new customError(400, "You Have Already Liked This Post"));

	const newLike = new Like({ post: postID, user: userID });

	//Transaction
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		await newLike.save({ session });
		await post.updateOne({ $inc: { likes: 1 } }, { session });
		await session.commitTransaction();
	} catch (err) {
		await session.abortTransaction();
		if (process.env.NODE_ENV === "development") console.log(err);
		return next(new customError(500, "Can't Complete this action"));
	} finally {
		session.endSession();
	}

	return res.status(200).json({ result: "pass", message: "Post Liked Successfully" });
});

export const dislike = catchAsync(async (req: newRequestType, res: Response, next: NextFunction) => {
	const { postID } = req.params;
	const userID = req.user._id;
	const post = await Post.findById(postID).select("likes");
	if (!post) return next(new customError(404, "Post Not Found"));

	const checkLikeOrNot = await Like.findOne({ post: postID, user: userID }).select("_id");
	if (!checkLikeOrNot) return next(new customError(400, "You Haven't Liked This Post Yet"));

	//transaction process
	const session = await mongoose.startSession();
	try {
		session.startTransaction();
		await post.updateOne({ $inc: { likes: -1 } }, { session });
		await checkLikeOrNot.deleteOne({ session });
		await session.commitTransaction();
	} catch (err) {
		await session.abortTransaction();
		if (process.env.NODE_ENV === "development") console.log(err);
		return next(new customError(500, "Can't complete the action"));
	} finally {
		session.endSession();
	}

	return res.status(200).json({ result: "pass", message: "Like Removed Successfully" });
});

export const deletePost = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const postID: string = req.params?.id;

	//finding post and delete
	const post = await Post.findByIdAndDelete(postID);
	if (!post) return next(new customError(404, "Post Not Found"));

	return res.status(200).json({ result: "pass", message: "Post Deleted Successfully" });
});
