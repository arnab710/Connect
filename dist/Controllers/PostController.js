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
exports.deletePost = exports.dislike = exports.like = exports.userPost = exports.allPost = exports.PostCreate = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const PostModel_1 = __importDefault(require("../Models/PostModel"));
const APIFeature_1 = __importDefault(require("../Utils/APIFeature"));
const catchAsync_1 = require("../Utils/catchAsync");
const customError_1 = __importDefault(require("../Utils/customError"));
const LikeModel_1 = __importDefault(require("../Models/LikeModel"));
const mongoose_1 = __importDefault(require("mongoose"));
exports.PostCreate = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const id = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const { resource_type, description, file_secure_url, public_id, audio } = req.body;
    if (!description && (!file_secure_url || !public_id))
        return next(new customError_1.default(400, "Post Can't Be Empty"));
    //creating mongoose instance based on fileType
    let newPost;
    if (resource_type === "image" && file_secure_url)
        newPost = new PostModel_1.default({ user: id, picture: file_secure_url, publicID: public_id, description });
    else if (resource_type === "video" && file_secure_url) {
        if (!audio)
            newPost = new PostModel_1.default({ user: id, video: file_secure_url, publicID: public_id, description });
        else
            newPost = new PostModel_1.default({ user: id, audio: file_secure_url, publicID: public_id, description });
    }
    else
        newPost = new PostModel_1.default({ user: id, description });
    //saving the DB
    yield newPost.save();
    res.status(201).json({ result: "pass", message: "Post Created Successfully" });
}));
exports.allPost = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const PostsObject = new APIFeature_1.default(PostModel_1.default.find().populate({ path: "user", select: "firstName lastName occupation profilePicture" }), req.query).Filtering().Sorting().Paging();
    let Posts = yield PostsObject.Query;
    const userID = req.user._id;
    //all the posts that user likes
    const userLikedPosts = yield LikeModel_1.default.find({ user: userID }).select("post -_id");
    const likedPostIds = userLikedPosts.map((like) => like.post.toString());
    // Modify the Posts array
    const UpdatedPosts = Posts.map((post) => {
        let postObject = post.toObject();
        postObject.alreadyLiked = likedPostIds.includes(post._id.toString());
        return postObject;
    });
    return res.status(200).json({ result: "pass", UpdatedPosts });
}));
exports.userPost = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userID = (_b = req.params) === null || _b === void 0 ? void 0 : _b.id;
    const myID = req.user._id;
    const postQuery = new APIFeature_1.default(PostModel_1.default.find({ user: userID }).populate({ path: "user", select: "firstName lastName occupation profilePicture" }), req.query).Filtering().Sorting().Paging().Query;
    const posts = yield postQuery;
    //all the posts that user likes
    const userLikedPosts = yield LikeModel_1.default.find({ user: myID }).select("post -_id");
    const likedPostIds = userLikedPosts.map((like) => like.post.toString());
    // Modify the Posts array
    const UpdatedPosts = posts.map((post) => {
        let postObject = post.toObject();
        postObject.alreadyLiked = likedPostIds.includes(post._id.toString());
        return postObject;
    });
    return res.status(200).json({ result: "pass", UpdatedPosts });
}));
exports.like = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID } = req.params;
    const userID = req.user._id;
    const post = yield PostModel_1.default.findById(postID).select("likes");
    if (!post)
        return next(new customError_1.default(404, "Post Not Found"));
    const checkLikeOrNot = yield LikeModel_1.default.findOne({ post: postID, user: userID }).select("_id");
    if (checkLikeOrNot)
        return next(new customError_1.default(400, "You Have Already Liked This Post"));
    const newLike = new LikeModel_1.default({ post: postID, user: userID });
    //Transaction
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        yield newLike.save({ session });
        yield post.updateOne({ $inc: { likes: 1 } }, { session });
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
    return res.status(200).json({ result: "pass", message: "Post Liked Successfully" });
}));
exports.dislike = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { postID } = req.params;
    const userID = req.user._id;
    const post = yield PostModel_1.default.findById(postID).select("likes");
    if (!post)
        return next(new customError_1.default(404, "Post Not Found"));
    const checkLikeOrNot = yield LikeModel_1.default.findOne({ post: postID, user: userID }).select("_id");
    if (!checkLikeOrNot)
        return next(new customError_1.default(400, "You Haven't Liked This Post Yet"));
    //transaction process
    const session = yield mongoose_1.default.startSession();
    try {
        session.startTransaction();
        yield post.updateOne({ $inc: { likes: -1 } }, { session });
        yield checkLikeOrNot.deleteOne({ session });
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
    return res.status(200).json({ result: "pass", message: "Like Removed Successfully" });
}));
exports.deletePost = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const postID = (_c = req.params) === null || _c === void 0 ? void 0 : _c.id;
    //finding post and delete
    const post = yield PostModel_1.default.findById(postID).select("publicID picture video audio");
    if (!post)
        return next(new customError_1.default(404, "Post Not Found"));
    yield post.deleteOne();
    try {
        if (post.picture)
            yield cloudinary_1.default.v2.uploader.destroy(String(post.publicID), { resource_type: "image" });
        else if (post.video || post.audio)
            yield cloudinary_1.default.v2.uploader.destroy(String(post.publicID), { resource_type: "video" });
        if (process.env.NODE_ENV === "development")
            console.log("Cloudinary Asset deleted successfully");
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.log(err);
    }
    return res.status(200).json({ result: "pass", message: "Post Deleted Successfully" });
}));
