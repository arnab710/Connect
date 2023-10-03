"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteComment = exports.allComments = exports.createComment = void 0;
const CommentModel_1 = __importDefault(require("../Models/CommentModel"));
const catchAsync_1 = require("../Utils/catchAsync");
const customError_1 = __importDefault(require("../Utils/customError"));
const PostModel_1 = __importDefault(require("../Models/PostModel"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.createComment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { post, comment } = req.body;
    const userID = req.user._id;
    if (!post)
        return next(new customError_1.default(400, "A Post is Required To Be Commented On"));
    if (!comment || comment === "")
        return next(new customError_1.default(400, `Comment Body Can't Be Empty`));
    const postObj = yield PostModel_1.default.findById(post).select("_id comments");
    if (!postObj)
        return next(new customError_1.default(404, "Post Not Found"));
    const newComment = new CommentModel_1.default({ post, comment, user: userID });
    //transaction
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        yield newComment.save({ session });
        yield postObj.updateOne({ $inc: { comments: 1 } }, { session });
        yield session.commitTransaction();
    }
    catch (err) {
        yield session.abortTransaction();
        if (process.env.NODE_ENV === "development")
            console.log(err);
        return next(new customError_1.default(500, "Can't Complete this action"));
    }
    finally {
        session.endSession();
    }
    return res.status(201).json({ result: "pass", message: "New Comment Created", newComment });
}));
exports.allComments = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID } = req.params;
    const allComments = yield CommentModel_1.default.find({ post: postID }).select("-post").populate({ path: "user", select: "profilePicture firstName lastName" }).sort("-createdAt").limit(4);
    return res.status(200).json({ result: "pass", allComments });
}));
exports.deleteComment = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { commentID } = req.params;
    const deletedComment = yield CommentModel_1.default.findById(commentID).select("_id post");
    if (!deletedComment)
        return next(new customError_1.default(400, "No Comment Found To Delete"));
    const postID = deletedComment.post;
    //transaction process
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        yield PostModel_1.default.findByIdAndUpdate(postID, { $inc: { comments: -1 } }, { session });
        yield deletedComment.deleteOne({ session });
        yield session.commitTransaction();
    }
    catch (err) {
        yield session.abortTransaction();
        if (process.env.NODE_ENV === "development")
            console.log(err);
        return next(new customError_1.default(500, "Can't complete the action"));
    }
    finally {
        session.endSession();
    }
    return res.status(200).json({ result: "pass", message: "Comment Deleted Successfully" });
}));
