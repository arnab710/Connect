"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const mongoose_1 = __importDefault(require("mongoose"));
const likeSchema = new mongoose_1.default.Schema({
    post: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: "Post",
        required: [true, "Provide a Post ID"],
    },
    user: {
        type: mongoose_1.default.Schema.ObjectId,
        ref: "User",
        required: [true, "Provide a User ID"],
    },
});
likeSchema.index({ post: 1, user: 1 }, { unique: true });
const Like = mongoose_1.default.model("Like", likeSchema);
exports.default = Like;
