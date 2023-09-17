import { NextFunction, Request, Response } from "express";
import { client } from "../RedisConnection";
import User from "../Models/UserModel";
import { catchAsync } from "../Utils/catchAsync";
import customError from "../Utils/customError";
import { newRequestType } from "../Types/ReqestTypeWithUser";

//fetching my details
const fetchMyInfo = catchAsync(async (req: newRequestType, res: Response, _next: NextFunction) => {
	const myID = req.user?._id;
	const myDetails = await User.findById(myID);

	return res.status(200).json({ result: "pass", myInfo: myDetails });
});

//fxn to find a particular user by it's name
const findUser = catchAsync(async (req: Request, res: Response, _next: NextFunction) => {
	const { name } = req.query;

	const nameRegex = new RegExp(name as string, "i");
	const users = await User.find({ firstName: { $regex: nameRegex } })
		.limit(4)
		.select("firstName lastName bio occupation profilePicture followers followings");

	return res.status(200).json({ result: "pass", users });
});

const updateMe = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const userID = req.user?._id;

	const { firstName, lastName, fileType, bio, occupation, file_secure_url } = req.body;

	//fetching my details from db
	const userData: any = await User.findById(userID).select("firstName lastName profilePicture coverPicture");
	if (!userData) return next(new customError(404, "User Not Found"));

	//updating user details
	if (firstName && firstName !== userData.firstName) userData.firstName = firstName;
	if (lastName && lastName !== userData.lastName) userData.lastName = lastName;
	if (bio) userData.bio = bio;
	if (occupation) userData.occupation = occupation;

	//updating profile picture or cover photo
	if (fileType === "profile-picture" && file_secure_url && req.file?.mimetype.startsWith("image")) userData.profilePicture = file_secure_url;
	else if (fileType === "cover-photo" && file_secure_url && req.file?.mimetype.startsWith("image")) userData.coverPicture = file_secure_url;

	//saving userData to DB
	await userData.save();

	//deleting sensitive data
	const DeletedData = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active", "updatedAt"];
	DeletedData.forEach((val) => (userData[val] = undefined));

	//deleting the cache memory -- important before save
	try {
		await client.del(`user:${userData._id}`); //necessary for further AuthCheck
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.log(err);
	}

	return res.status(200).json({ result: "pass", message: "Your Details Updated Successfully" });
});

const deleteMe = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const userID = req.user?._id;

	//finding the current user
	const user = await User.findById(userID).select("+active");
	if (!user) return next(new customError(404, "User Not Found"));

	//setting active false and saving
	user.active = false;
	await user.save();

	//deleting the JWT token from cookie
	res.cookie("jwt", "", {
		expires: new Date(Date.now() - 10 * 1000), // Set it in the past to ensure deletion
		httpOnly: true,
	});

	//deleting the cache memory --redis client
	try {
		await client.del(`user:${userID}`);
	} catch (err) {
		if (process.env.NODE_ENV === "development") console.error(err);
	}

	return res.status(200).json({ result: "pass", message: "User Deleted Successfully" });
});

const getUserInfo = catchAsync(async (req: Request, res: Response, next: NextFunction) => {
	//finding userID and finding from DB
	const userID: string = req.params?.id;
	const userData = await User.findById(userID).select("-email -__v -createdAt -updatedAt");

	//if not found
	if (!userData) return next(new customError(404, "User Not Found"));

	return res.status(200).json({ result: "pass", userData });
});

const getUserFollowings = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const userID: string = req.user?._id;
	const user = await User.findById(userID).select("followings").populate({ path: "followings.user", select: "firstName lastName occupation profilePicture" });
	if (!user) return next(new customError(404, "User not found"));

	return res.status(200).json({ result: "pass", followings: user?.followings });
});

const getUserFollowers = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const userID: string = req.user?._id;
	const user = await User.findById(userID).select("followers").populate({ path: "followers.user", select: "firstName lastName occupation" });
	if (!user) return next(new customError(404, "User not found"));

	return res.status(200).json({ result: "pass", followers: user?.followers });
});

const follow = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const { id }: { id: string } = req.body;
	//changing its type to mongoose object
	const myUserID: string = req.user?._id;

	// Check if the user is trying to follow himself
	if (myUserID === id) return next(new customError(400, "You Cannot Follow Yourself"));

	//fetching current user's following array
	const myUser = await User.findById(myUserID).select("followings");
	if (!myUser) return next(new customError(404, "User Not Found"));

	//fetching other user's followers array
	const followerUser = await User.findById(id).select("followers");
	if (!followerUser) return next(new customError(404, "User Not Found"));

	// Check if the user is already following the target user
	if (myUser?.followings?.some((following) => String(following.user) === id)) {
		return next(new customError(400, "Already Following This User"));
	}

	//pushing the new following in the following array and saving
	myUser?.followings?.push({ user: id });
	await myUser?.save();

	//pushing the new following in the followers array of the other user and saving
	followerUser?.followers?.push({ user: myUserID });
	await followerUser?.save();

	return res.status(200).json({ result: "pass", message: "Following Successful" });
});

const unfollow = catchAsync(async (req: any, res: Response, next: NextFunction) => {
	const { id }: { id: string } = req.body;
	const myUserID: string = req.user?._id;

	// Check if the user is trying to unfollow himself
	if (myUserID === id) return next(new customError(400, "You Cannot Unfollow Yourself"));

	//fetching current user's following array
	const myUser = await User.findById(myUserID).select("followings");
	if (!myUser) return next(new customError(404, "User Not Found"));

	//fetching other user's followers array
	const followerUser = await User.findById(id).select("followers");
	if (!followerUser) return next(new customError(404, "User Not Found"));

	// Check if the user is not following the target user
	if (!myUser?.followings?.some((following) => String(following.user) === id)) {
		return next(new customError(400, "You Are Not Following This User"));
	}

	//removing the target user from following array
	const newFollowingsArray = myUser?.followings?.filter((following) => String(following.user) !== id);
	myUser.followings = newFollowingsArray;
	await myUser.save();

	//removing the current user from the target's user array
	const newFollowersArray = followerUser?.followers?.filter((follower) => String(follower.user) !== myUserID);
	followerUser.followers = newFollowersArray;
	await followerUser.save();

	return res.status(200).json({ result: "pass", message: "Unfollowed Successfully" });
});

export { fetchMyInfo, updateMe, deleteMe, getUserInfo, getUserFollowings, getUserFollowers, follow, unfollow, findUser };
