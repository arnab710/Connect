import { Request } from "express";
import multer from "multer";
import customError from "./customError";

const multerFilter = (_req: Request, file: Express.Multer.File, cb: any) => {
	if (file.mimetype?.startsWith("image") || file.mimetype?.startsWith("video") || file.mimetype?.startsWith("audio")) cb(null, true);
	else {
		if (process.env.NODE_ENV === "development") console.log("Not an supported file format");
		cb(new customError(400, "Not a supported file format"), false);
	}
};

const upload = multer({
	storage: multer.memoryStorage(),
	fileFilter: multerFilter,
	limits: { fileSize: 4 * 1024 * 1024 },
});

export const uploadFile = upload.single("file");
