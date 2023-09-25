import cloudinary from "cloudinary";
import { NextFunction, Request, Response } from "express";
import deletingAssetFile from "./HandlingassetFile";
import path from "path";

export const cloudinaryConfig = async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file) return next();
	try {
		let result: any;
		const normalized_path = path.normalize(req.file.path).replace(/\\/g, "/");
		//uploading to cloudinary
		if (req.file.mimetype.startsWith("video") && req.body?.fileType === "video") {
			result = await cloudinary.v2.uploader.upload(normalized_path, {
				resource_type: "video",
				chunk_size: 2000000,
				eager: [{ width: 600, height: 750, crop: "fill" }],
				eager_async: true,
			});
		} else if (req.file.mimetype.startsWith("audio") && req.body?.fileType === "audio") {
			result = await cloudinary.v2.uploader.upload(normalized_path, {
				resource_type: "video",
				transformation: [{ audio_frequency: 8000 }, { audio_codec: "mp3" }],
				chunk_size: 1000000,
			});
		} else {
			result = await cloudinary.v2.uploader.upload(req.file.path);
		}

		//deleting the existing file in the server
		await deletingAssetFile(normalized_path);

		//attaching secure file url with the body
		req.body.file_secure_url = result.secure_url;
		req.body.file_public_id = result.public_id;

		next();
	} catch (err: any) {
		if (process.env.NODE_ENV === "development") console.log(err);
		return res.status(400).json({ result: "fail", message: err?.message });
	}
};
