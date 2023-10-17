"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../Controllers/AuthController");
const PostController_1 = require("../Controllers/PostController");
const CommentController_1 = require("../Controllers/CommentController");
const GenerateSignedUpload_1 = require("../Utils/GenerateSignedUpload");
const Router = express_1.default.Router();
Router.use(AuthController_1.authCheck); //authentication check
Router.route("/").get(PostController_1.allPost); //fetching all posts
Router.route("/singleUser/:id").get(PostController_1.userPost); //fetching single user's post
Router.route("/like/:postID").post(PostController_1.like); //liking a post
Router.route("/dislike/:postID").post(PostController_1.dislike); //disliking a post
Router.route("/new").post(GenerateSignedUpload_1.GenerateSignedUpload); //create a post
Router.route("/delete/:id").delete(PostController_1.deletePost); //deleting a post
Router.route("/comments/:postID").get(CommentController_1.allComments); //fetching all comment of a post
Router.route("/comments/new").post(CommentController_1.createComment); //creating a comment
Router.route("/comments/:commentID").delete(CommentController_1.deleteComment); //deleting a comment
exports.default = Router;
