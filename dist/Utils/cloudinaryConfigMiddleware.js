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
exports.cloudinaryConfig = void 0;
const cloudinary_1 = __importDefault(require("cloudinary"));
const streamifier_1 = __importDefault(require("streamifier"));
const customError_1 = __importDefault(require("./customError"));
const uploadToCloudinary = (transformation, buffer) => {
    return new Promise((resolve, reject) => {
        let cld_upload_stream = cloudinary_1.default.v2.uploader.upload_stream(transformation, (error, result) => {
            if (error)
                reject(error);
            else
                resolve(result);
        });
        streamifier_1.default.createReadStream(buffer).pipe(cld_upload_stream);
    });
};
const cloudinaryConfig = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if (!req.file)
        return next();
    try {
        const buffer = req.file.buffer;
        const fileType = (_a = req.body) === null || _a === void 0 ? void 0 : _a.fileType;
        let transformation;
        if (req.file.mimetype.startsWith("image") && fileType === "profile-picture") {
            transformation = { width: 500, height: 500, crop: "fill" };
        }
        else if (req.file.mimetype.startsWith("image") && fileType === "cover-photo") {
            transformation = { width: 820, height: 312, crop: "fill" };
        }
        else if (req.file.mimetype.startsWith("image") && fileType === "image-post") {
            transformation = { width: 1080, height: 1350, crop: "fill" };
        }
        else if (req.file.mimetype.startsWith("video") && fileType === "video") {
            transformation = { eager: [{ width: 600, height: 750, crop: "fill" }], eager_async: true, resource_type: "video", chunk_size: 2000000 };
        }
        else if (req.file.mimetype.startsWith("audio") && fileType === "audio") {
            transformation = { transformation: [{ audio_frequency: 8000 }, { audio_codec: "mp3" }], resource_type: "video", chunk_size: 1000000 };
        }
        //uploading to cloudinary
        if (!transformation)
            return next(new customError_1.default(400, "No File Type Provided"));
        let result = yield uploadToCloudinary(transformation, buffer);
        if (!result)
            return next(new customError_1.default(500, "File Upload failed"));
        //attaching secure file url with the body
        req.body.file_secure_url = result.secure_url;
        req.body.file_public_id = result.public_id;
        next();
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.log(err);
        return res.status(400).json({ result: "fail", message: err === null || err === void 0 ? void 0 : err.message });
    }
});
exports.cloudinaryConfig = cloudinaryConfig;
