import cloudinary from "cloudinary";

import { NextFunction, Request, Response } from "express";
import customError from "./customError";

export const GenerateSignedUpload = async (req: Request, res: Response, next: NextFunction) => {
	try {
		if (!req.body || !req.body.fileType) return next(new customError(400, "FileType Not Mentioned"));

		const fileTypeArray = ["profile-picture", "cover-photo", "image-post", "video", "audio"];

		if (!fileTypeArray.includes(req.body.fileType)) return next(new customError(400, "Invalid File Type Provided"));

		const timestamp = Math.round(new Date().getTime() / 1000);

		const sizeObj =
			req.body.fileType === "profile-picture"
				? "c_fill,h_500,w_500,q_auto,f_auto"
				: req.body.fileType === "cover-photo"
				? "c_fill,h_312,w_820,q_auto,f_auto"
				: req.body.fileType === "image-post"
				? "c_fill,h_1350,w_1080,q_auto,f_auto"
				: req.body.fileType === "video"
				? "c_fill,h_400,w_600"
				: "af_8000,ac_mp3";

		let signature = cloudinary.v2.utils.api_sign_request(
			{
				timestamp: timestamp,
				transformation: sizeObj,
			},
			process.env.CLOUDINARY_API_SECRET as string
		);

		res.status(200).json({ result: "pass", signature, timestamp });
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.log(err);

		res.status(500).json({ result: "fail", message: "Some Error Occurred !! Please Try Again Later" });
	}
};
