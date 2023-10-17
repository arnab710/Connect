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
const GenerateSignedUpload = (req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        let timestamp = Math.round(new Date().getTime() / 1000);
        let signature = cloudinary_1.default.v2.utils.api_sign_request({
            timestamp: timestamp,
            eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
            public_id: "sample_image",
        }, process.env.CLOUDINARY_API_SECRET);
        console.log(signature);
    }
    catch (err) {
        if (process.env.NODE_ENV === "development")
            console.log(err);
        res.status(500).json({ result: "fail", message: "Some Error Occurred !! Please Try Again Later" });
    }
});
exports.GenerateSignedUpload = GenerateSignedUpload;
