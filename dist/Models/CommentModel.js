"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const commentSchema = new mongoose_1.default.Schema({
    post: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: "Post",
        required: [true, "Please Provide a Post"],
    },
    user: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: "User",
        required: [true, "Please Provide a User"],
    },
    comment: {
        type: String,
        required: [true, "Please Provide a Comment"],
    },
}, { timestamps: true });
const Comment = mongoose_1.default.model("Comment", commentSchema);
exports.default = Comment;
