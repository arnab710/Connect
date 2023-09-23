import { Request } from "express";
import multer from "multer";
import customError from "./customError";

const multerStorage = multer.diskStorage({
	destination: (_req: Request, file: Express.Multer.File, cb) => {
		if (file.mimetype.split("/")[0] === "image") cb(null, "public/assets/images");
		else if (file.mimetype.split("/")[0] === "video") cb(null, "public/assets/videos");
		else if (file.mimetype.startsWith("audio")) cb(null, "public/assets/audios");
		else cb(new customError(400, "file type not supported"), "");
	},
	filename: (req: any, file: Express.Multer.File, cb) => {
		const ext = file.mimetype.split("/")[1];
		cb(null, `user-${req.user._id}-${Date.now()}.${ext}`);
	},
});

const multerFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
	if (file.mimetype?.startsWith("image") || file.mimetype?.startsWith("video") || file.mimetype?.startsWith("audio")) cb(null, true);
	else {
		if (process.env.NODE_ENV === "development") console.log("Not an supported file format");
		cb(new customError(400, "Not a supported file format"), false);
	}
};

const upload = multer({
	storage: multerStorage,
	fileFilter: multerFilter,
	limits: { fileSize: 7 * 1024 * 1024 },
});

export const uploadFile = upload.single("file");
