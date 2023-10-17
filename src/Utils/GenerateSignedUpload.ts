import cloudinary from "cloudinary";

import { NextFunction, Request, Response } from "express";

export const GenerateSignedUpload = async (req: Request, res: Response, next: NextFunction) => {
	try {
		let timestamp = Math.round(new Date().getTime() / 1000);

		let signature = cloudinary.v2.utils.api_sign_request(
			{
				timestamp: timestamp,
				eager: "w_400,h_300,c_pad|w_260,h_200,c_crop",
				public_id: "sample_image",
			},
			process.env.CLOUDINARY_API_SECRET as string
		);
		console.log(signature);
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.log(err);

		res.status(500).json({ result: "fail", message: "Some Error Occurred !! Please Try Again Later" });
	}
};
