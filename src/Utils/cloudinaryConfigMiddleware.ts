import cloudinary from "cloudinary";
import { NextFunction, Request, Response } from "express";
import streamifier from "streamifier";
import customError from "./customError";

const uploadToCloudinary = (transformation: cloudinary.UploadApiOptions, buffer: Buffer): Promise<cloudinary.UploadApiResponse | undefined> => {
	return new Promise((resolve, reject) => {
		let cld_upload_stream = cloudinary.v2.uploader.upload_stream(transformation, (error, result) => {
			if (error) reject(error);
			else resolve(result);
		});

		streamifier.createReadStream(buffer).pipe(cld_upload_stream);
	});
};

export const cloudinaryConfig = async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file) return next();
	try {
		const buffer = req.file.buffer;
		const fileType = req.body?.fileType;

		let transformation: cloudinary.UploadApiOptions | undefined;
		if (req.file.mimetype.startsWith("image") && fileType === "profile-picture") {
			transformation = { width: 500, height: 500, crop: "fill" };
		} else if (req.file.mimetype.startsWith("image") && fileType === "cover-photo") {
			transformation = { width: 820, height: 312, crop: "fill" };
		} else if (req.file.mimetype.startsWith("image") && fileType === "image-post") {
			transformation = { width: 1080, height: 1350, crop: "fill" };
		} else if (req.file.mimetype.startsWith("video") && fileType === "video") {
			transformation = { eager: [{ width: 600, height: 750, crop: "fill" }], eager_async: true, resource_type: "video", chunk_size: 2000000 };
		} else if (req.file.mimetype.startsWith("audio") && fileType === "audio") {
			transformation = { transformation: [{ audio_frequency: 8000 }, { audio_codec: "mp3" }], resource_type: "video", chunk_size: 1000000 };
		}

		//uploading to cloudinary
		if (!transformation) return next(new customError(400, "No File Type Provided"));

		let result: cloudinary.UploadApiResponse | undefined = await uploadToCloudinary(transformation, buffer);

		if (!result) return next(new customError(500, "File Upload failed"));

		//attaching secure file url with the body
		req.body.file_secure_url = result.secure_url;
		req.body.file_public_id = result.public_id;

		next();
	} catch (err: any) {
		if (process.env.NODE_ENV === "development") console.log(err);
		return res.status(400).json({ result: "fail", message: err?.message });
	}
};
