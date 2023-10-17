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
exports.GenerateSignedUpload = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const customError_1 = __importDefault(require("./customError"));
const GenerateSignedUpload = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        if (!req.body || !req.body.fileType)
            return next(new customError_1.default(400, "FileType Not Mentioned"));
        const fileTypeArray = ["profile-picture", "cover-photo", "image-post", "video", "audio"];
        if (!fileTypeArray.includes(req.body.fileType))
            return next(new customError_1.default(400, "Invalid File Type Provided"));
        const timestamp = Math.round(new Date().getTime() / 1000);
        const sizeObj = req.body.fileType === "profile-picture"
            ? "c_fill,h_500,w_500,q_auto,f_auto"
            : req.body.fileType === "cover-photo"
                ? "c_fill,h_312,w_820,q_auto,f_auto"
                : req.body.fileType === "image-post"
                    ? "c_fill,h_1350,w_1080,q_auto,f_auto"
                    : req.body.fileType === "video"
                        ? "c_fill,h_400,w_600"
                        : "af_8000,ac_mp3";
        let signature = cloudinary_1.default.v2.utils.api_sign_request({
            timestamp: timestamp,
            transformation: sizeObj,
        }, process.env.CLOUDINARY_API_SECRET);
        res.status(200).json({ result: "pass", signature, timestamp });
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.log(err);
        res.status(500).json({ result: "fail", message: "Some Error Occurred !! Please Try Again Later" });
    }
});
exports.GenerateSignedUpload = GenerateSignedUpload;
