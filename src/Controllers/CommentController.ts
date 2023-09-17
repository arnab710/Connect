import { NextFunction, Request, Response } from "express";
import Comment from "../Models/CommentModel";
import { catchAsync } from "../Utils/catchAsync";
import customError from "../Utils/customError";
import Post from "../Models/PostModel";

export const createComment = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const { post, comment } = req.body;
	const userID = req.user;

	if (!post) return next(new customError(400, "A Post is Required To Be Commented On"));
	if (!comment || comment === "") return next(new customError(400, `Comment Body Can't Be Empty`));

	const postObj = await Post.findById(post).select("_id comments");

	if (!postObj) return next(new customError(404, "Post Not Found"));

	const newComment = new Comment({ post, comment, user: userID });

	await newComment.save();
	await postObj.updateOne({ $inc: { comments: 1 } });

	return res.status(201).json({ result: "pass", message: "New Comment Created", newComment });
});

export const allComments = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
	const { postID } = req.params;

	const allComments = await Comment.find({ post: postID }).select("-post").populate({ path: "user", select: "profilePicture firstName lastName" }).sort("-createdAt").limit(4);

	return res.status(200).json({ result: "pass", allComments });
});

export const deleteComment = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	const { commentID } = req.params;

	const deletedComment = await Comment.findByIdAndDelete(commentID);
	if (!deletedComment) return next(new customError(400, "Some Error Occurred While Deleting The Comment"));

	const postID = deletedComment.post;

	await Post.findByIdAndUpdate(postID, { $inc: { comments: -1 } });
	res.status(200).json({ result: "pass", message: "Comment Deleted Successfully" });
});
