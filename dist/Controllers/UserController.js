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
exports.findUser = exports.unfollow = exports.follow = exports.getUserFollowers = exports.getUserFollowings = exports.getUserInfo = exports.deleteMe = exports.updateMe = exports.fetchMyInfo = void 0;
const RedisConnection_1 = require("../RedisConnection");
const UserModel_1 = __importDefault(require("../Models/UserModel"));
const catchAsync_1 = require("../Utils/catchAsync");
const customError_1 = __importDefault(require("../Utils/customError"));
const PostModel_1 = __importDefault(require("../Models/PostModel"));
//fetching my details
const fetchMyInfo = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    const myID = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
    const myDetails = yield UserModel_1.default.findById(myID);
    return res.status(200).json({ result: "pass", myInfo: myDetails });
}));
exports.fetchMyInfo = fetchMyInfo;
//fxn to find a particular user by it's name
const findUser = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    const { name } = req.query;
    const nameRegex = new RegExp(name, "i");
    const users = yield UserModel_1.default.find({ firstName: { $regex: nameRegex } })
        .limit(4)
        .select("firstName lastName bio occupation profilePicture followers followings");
    return res.status(200).json({ result: "pass", users });
}));
exports.findUser = findUser;
const updateMe = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    const userID = (_b = req.user) === null || _b === void 0 ? void 0 : _b._id;
    const { firstName, lastName, fileType, bio, occupation, country, city, file_secure_url } = req.body;
    //fetching my details from db
    const userData = yield UserModel_1.default.findById(userID).select("firstName lastName profilePicture coverPicture");
    if (!userData)
        return next(new customError_1.default(404, "User Not Found"));
    //updating user details
    if (firstName && firstName !== userData.firstName)
        userData.firstName = firstName;
    if (lastName && lastName !== userData.lastName)
        userData.lastName = lastName;
    if (bio)
        userData.bio = bio;
    if (occupation)
        userData.occupation = occupation;
    if (country)
        userData.country = country;
    if (city)
        userData.city = city;
    //updating profile picture or cover photo
    if (fileType === "profile-picture" && file_secure_url)
        userData.profilePicture = file_secure_url;
    else if (fileType === "cover-photo" && file_secure_url)
        userData.coverPicture = file_secure_url;
    //saving userData to DB
    yield userData.save();
    //deleting sensitive data
    const DeletedData = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active", "updatedAt"];
    DeletedData.forEach((val) => (userData[val] = undefined));
    //deleting the cache memory -- important before save
    if (!RedisConnection_1.redisClientError) {
        try {
            yield (RedisConnection_1.client === null || RedisConnection_1.client === void 0 ? void 0 : RedisConnection_1.client.del(`user:${userData._id}`)); //necessary for further AuthCheck
        }
        catch (err) {
            if (process.env.NODE_ENV === "development")
                console.log(err);
        }
    }
    return res.status(200).json({ result: "pass", message: "Your Details Updated Successfully", imgFileLink: file_secure_url });
}));
exports.updateMe = updateMe;
const deleteMe = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c;
    const userID = (_c = req.user) === null || _c === void 0 ? void 0 : _c._id;
    //finding the current user
    const user = yield UserModel_1.default.findById(userID).select("+active");
    if (!user)
        return next(new customError_1.default(404, "User Not Found"));
    //setting active false and saving
    user.active = false;
    yield user.save();
    //deleting the JWT token from cookie
    res.cookie("jwt", "", {
        expires: new Date(Date.now() - 10 * 1000),
        httpOnly: true,
    });
    if (!RedisConnection_1.redisClientError) {
        //deleting the cache memory --redis client
        try {
            yield (RedisConnection_1.client === null || RedisConnection_1.client === void 0 ? void 0 : RedisConnection_1.client.del(`user:${userID}`));
        }
        catch (err) {
            if (process.env.NODE_ENV === "development")
                console.error(err);
        }
    }
    return res.status(200).json({ result: "pass", message: "User Deleted Successfully" });
}));
exports.deleteMe = deleteMe;
const getUserInfo = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _d;
    //finding userID and finding from DB
    const userID = (_d = req.params) === null || _d === void 0 ? void 0 : _d.id;
    const userData = yield UserModel_1.default.findById(userID).select("-email -__v -createdAt -updatedAt");
    //if not found
    if (!userData)
        return next(new customError_1.default(404, "User Not Found"));
    const postArray = yield PostModel_1.default.find({ user: userID }).select("_id");
    return res.status(200).json({ result: "pass", userData, postNumber: postArray.length });
}));
exports.getUserInfo = getUserInfo;
const getUserFollowings = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _e;
    const userID = (_e = req.params) === null || _e === void 0 ? void 0 : _e.id;
    const user = yield UserModel_1.default.findById(userID).select("followings").populate({ path: "followings.user", select: "firstName lastName occupation profilePicture" });
    if (!user)
        return next(new customError_1.default(404, "User not found"));
    return res.status(200).json({ result: "pass", followings: user === null || user === void 0 ? void 0 : user.followings });
}));
exports.getUserFollowings = getUserFollowings;
const getUserFollowers = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    const userID = (_f = req.params) === null || _f === void 0 ? void 0 : _f.id;
    const user = yield UserModel_1.default.findById(userID).select("followers").populate({ path: "followers.user", select: "firstName lastName occupation profilePicture" });
    if (!user)
        return next(new customError_1.default(404, "User not found"));
    return res.status(200).json({ result: "pass", followers: user === null || user === void 0 ? void 0 : user.followers });
}));
exports.getUserFollowers = getUserFollowers;
const follow = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _g, _h, _j, _k;
    const { id } = req.body;
    //changing its type to mongoose object
    const myUserID = (_g = req.user) === null || _g === void 0 ? void 0 : _g._id;
    // Check if the user is trying to follow himself
    if (myUserID === id)
        return next(new customError_1.default(400, "You Cannot Follow Yourself"));
    //fetching current user's following array
    const myUser = yield UserModel_1.default.findById(myUserID).select("followings");
    if (!myUser)
        return next(new customError_1.default(404, "User Not Found"));
    //fetching other user's followers array
    const followerUser = yield UserModel_1.default.findById(id).select("followers");
    if (!followerUser)
        return next(new customError_1.default(404, "User Not Found"));
    // Check if the user is already following the target user
    if ((_h = myUser === null || myUser === void 0 ? void 0 : myUser.followings) === null || _h === void 0 ? void 0 : _h.some((following) => String(following.user) === id)) {
        return next(new customError_1.default(400, "Already Following This User"));
    }
    //pushing the new following in the following array and saving
    (_j = myUser === null || myUser === void 0 ? void 0 : myUser.followings) === null || _j === void 0 ? void 0 : _j.push({ user: id });
    yield (myUser === null || myUser === void 0 ? void 0 : myUser.save());
    //pushing the new following in the followers array of the other user and saving
    (_k = followerUser === null || followerUser === void 0 ? void 0 : followerUser.followers) === null || _k === void 0 ? void 0 : _k.push({ user: myUserID });
    yield (followerUser === null || followerUser === void 0 ? void 0 : followerUser.save());
    return res.status(200).json({ result: "pass", message: "Following Successful" });
}));
exports.follow = follow;
const unfollow = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _l, _m, _o, _p;
    const { id } = req.body;
    const myUserID = (_l = req.user) === null || _l === void 0 ? void 0 : _l._id;
    // Check if the user is trying to unfollow himself
    if (myUserID === id)
        return next(new customError_1.default(400, "You Cannot Unfollow Yourself"));
    //fetching current user's following array
    const myUser = yield UserModel_1.default.findById(myUserID).select("followings");
    if (!myUser)
        return next(new customError_1.default(404, "User Not Found"));
    //fetching other user's followers array
    const followerUser = yield UserModel_1.default.findById(id).select("followers");
    if (!followerUser)
        return next(new customError_1.default(404, "User Not Found"));
    // Check if the user is not following the target user
    if (!((_m = myUser === null || myUser === void 0 ? void 0 : myUser.followings) === null || _m === void 0 ? void 0 : _m.some((following) => String(following.user) === id))) {
        return next(new customError_1.default(400, "You Are Not Following This User"));
    }
    //removing the target user from following array
    const newFollowingsArray = (_o = myUser === null || myUser === void 0 ? void 0 : myUser.followings) === null || _o === void 0 ? void 0 : _o.filter((following) => String(following.user) !== id);
    myUser.followings = newFollowingsArray;
    yield myUser.save();
    //removing the current user from the target's user array
    const newFollowersArray = (_p = followerUser === null || followerUser === void 0 ? void 0 : followerUser.followers) === null || _p === void 0 ? void 0 : _p.filter((follower) => String(follower.user) !== myUserID);
    followerUser.followers = newFollowersArray;
    yield followerUser.save();
    return res.status(200).json({ result: "pass", message: "Unfollowed Successfully" });
}));
exports.unfollow = unfollow;
