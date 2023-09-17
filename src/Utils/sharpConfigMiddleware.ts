import sharp from "sharp";
import { NextFunction, Request, Response } from "express";
import deletingAssetFile from "./HandlingassetFile";
import path from "path";

interface dimensionOfFiles {
	"profile-picture": number[];
	"cover-photo": number[];
	"image-post": number[];
}

export const sharpConfig = async (req: Request, res: Response, next: NextFunction) => {
	if (!req.file || !req.file.mimetype.startsWith("image")) return next();

	const dimensionsByFileType: dimensionOfFiles = {
		"profile-picture": [500, 500],
		"cover-photo": [820, 312],
		"image-post": [700, 800],
	};

	//converting the path path from windows version to cross-platform version
	const filePath = path.normalize(req.file.path).replace(/\\/g, "/");

	//creating a new file path with webP format
	const newFilePath = `${path.join(path.dirname(filePath), path.basename(filePath, path.extname(filePath)))}.webp`.replace(/\\/g, "/");

	//resizing user's file and creating a webP file
	try {
		const dimensions: number[] = dimensionsByFileType[req.body.fileType as keyof dimensionOfFiles];
		await sharp(filePath).resize(dimensions[0], dimensions[1]).webp().toFile(newFilePath);

		//deleting previous file
		await deletingAssetFile(filePath);

		//attaching a new file path to req.file
		req.file.path = newFilePath;

		next();
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.log({ err });
		return res.status(400).json({ result: "fail", message: "File Upload error, Please try again later" });
	}
};
