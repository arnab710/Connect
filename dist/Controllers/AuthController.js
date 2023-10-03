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
exports.resetPassword = exports.forgotPassword = exports.logout = exports.authCheck = exports.login = exports.register = void 0;
const UserModel_1 = __importDefault(require("../Models/UserModel"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const ControllerHelper_1 = require("../Utils/ControllerHelper");
const RedisConnection_1 = require("../RedisConnection");
const crypto_1 = __importDefault(require("crypto"));
const catchAsync_1 = require("../Utils/catchAsync");
const customError_1 = __importDefault(require("../Utils/customError"));
const register = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    if ((_a = req.cookies) === null || _a === void 0 ? void 0 : _a.jwt)
        return next(new customError_1.default(403, "You Are Already Logged In"));
    const { firstName, lastName, email, password, confirmPassword, city, country, bio, occupation } = req.body;
    if (password !== confirmPassword)
        return next(new customError_1.default(403, "Password And Confirm Password Are Not Same"));
    //creating and saving new mongoose instance
    let newUser = new UserModel_1.default({ firstName, lastName, email, password, city, country, bio, occupation });
    yield newUser.save();
    //token generation
    const token = jsonwebtoken_1.default.sign({ id: newUser._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
    //deleting sensitive data
    const DeletedData = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active"];
    DeletedData.forEach((val) => (newUser[val] = undefined));
    //setting jwt cookie
    (0, ControllerHelper_1.CookieSetter)(token, res);
    return res.status(201).json({ result: "pass", message: "User Created Successfully", newUser, jwtToken: token });
}));
exports.register = register;
const login = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _b;
    if ((_b = req.cookies) === null || _b === void 0 ? void 0 : _b.jwt)
        return next(new customError_1.default(403, "You Are Already Logged In"));
    const { email, password } = req.body;
    if (!email || !password)
        return next(new customError_1.default(400, "Please Provide Required Details"));
    let user = yield UserModel_1.default.findOne({ email }).select("+password +active");
    if (!user)
        return next(new customError_1.default(401, "Incorrect Email Or Password"));
    //password check
    const encryptedPassword = user.password;
    const matched = yield bcryptjs_1.default.compare(password, encryptedPassword);
    if (!matched)
        return next(new customError_1.default(401, "Incorrect Email Or Password"));
    //setting active to true if it was previously false (user previously deleted his account)
    if (user.active === false) {
        user.active = true;
        yield user.save({ validateBeforeSave: false });
    }
    //token generation
    const token = jsonwebtoken_1.default.sign({ id: user._id }, process.env.JWT_SECRET, {
        expiresIn: process.env.JWT_EXPIRE,
    });
    //after the save I can manipulate NewUser to delete sensitive data
    const DeletedData = ["__v", "password", "role", "passwordChangedAt", "passwordResetToken", "passwordResetExpires", "active"];
    DeletedData.forEach((val) => (user[val] = undefined));
    //setting jwt cookie
    (0, ControllerHelper_1.CookieSetter)(token, res);
    res.status(200).json({ result: "pass", message: "Logged-In Successful", token, user });
}));
exports.login = login;
const authCheck = (0, catchAsync_1.catchAsync)((req, _res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _c, _d, _e;
    //JWT-TOKEN from cookie or request header
    let token = "";
    if ((_c = req.cookies) === null || _c === void 0 ? void 0 : _c.jwt)
        token = req.cookies.jwt;
    else if (req.headers && ((_d = req.headers) === null || _d === void 0 ? void 0 : _d.authorization) && ((_e = req.headers.authorization) === null || _e === void 0 ? void 0 : _e.startsWith("Bearer"))) {
        token = req.headers.authorization.split(" ")[1];
    }
    if (token === "")
        return next(new customError_1.default(403, "Please Login"));
    //token verification
    const user = { id: "", iat: 0 };
    const data = yield (0, ControllerHelper_1.VerifyToken)(token);
    user.id = data === null || data === void 0 ? void 0 : data.id;
    user.iat = data === null || data === void 0 ? void 0 : data.iat;
    let verifiedUser;
    //trying to retrieve user data from Redis Database --cache hit
    if (!RedisConnection_1.redisClientError) {
        try {
            verifiedUser = yield (RedisConnection_1.client === null || RedisConnection_1.client === void 0 ? void 0 : RedisConnection_1.client.get(`user:${user.id}`));
            verifiedUser = JSON.parse(verifiedUser);
        }
        catch (err) {
            if (process.env.NODE_ENV === "development")
                console.error(`Redis Connection Problem ${err}`);
        }
    }
    //cache miss not found in redis
    if (!verifiedUser) {
        //checking it in the DB
        verifiedUser = yield UserModel_1.default.findById(user.id).select("+role +passwordChangedAt");
        if (!verifiedUser)
            return next(new customError_1.default(401, "Some Error Occurred . Please Login Again"));
        //checking if password changed after jwt token issued
        const CheckPasswordChangedAfterTokenIssued = (0, ControllerHelper_1.CheckPasswordChangedTime)(verifiedUser.passwordChangedAt, user.iat);
        if (CheckPasswordChangedAfterTokenIssued)
            return next(new customError_1.default(403, "Password Was Changed"));
        //setting the client for caching in future
        if (!RedisConnection_1.redisClientError) {
            try {
                yield (RedisConnection_1.client === null || RedisConnection_1.client === void 0 ? void 0 : RedisConnection_1.client.setEx(`user:${user.id}`, 60 * 60 * 2, JSON.stringify(verifiedUser)));
            }
            catch (err) {
                if (process.env.NODE_ENV === "development")
                    console.error(`Redis Connection Problem ${err}`);
            }
        }
    }
    //if cache hit
    else {
        //checking if password changed after jwt token issued
        const CheckPasswordChangedAfterTokenIssued = (0, ControllerHelper_1.CheckPasswordChangedTime)(verifiedUser.passwordChangedAt, user.iat);
        if (CheckPasswordChangedAfterTokenIssued)
            return next(new customError_1.default(403, "Password Was Changed"));
    }
    //setting verified user as user in the request object
    req.user = verifiedUser;
    //Calling next protected route
    next();
}));
exports.authCheck = authCheck;
const logout = (0, catchAsync_1.catchAsync)((req, res, _next) => __awaiter(void 0, void 0, void 0, function* () {
    // set cookie
    res.cookie("jwt", "", {
        expires: new Date(Date.now() - 10 * 1000),
        httpOnly: true,
    });
    //deleting from redis client
    if (!RedisConnection_1.redisClientError) {
        try {
            const user = req.user;
            yield (RedisConnection_1.client === null || RedisConnection_1.client === void 0 ? void 0 : RedisConnection_1.client.del(`user:${user._id}`));
        }
        catch (err) {
            if (process.env.NODE_ENV === "development")
                console.error(`Redis Connection Problem ${err}`);
        }
    }
    res.status(200).json({ result: "pass", message: "Logout Successful" });
}));
exports.logout = logout;
const forgotPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    var _f;
    if ((_f = req.cookies) === null || _f === void 0 ? void 0 : _f.jwt)
        return next(new customError_1.default(403, "You Are Already Logged In"));
    const { email } = req.body;
    if (!email)
        return next(new customError_1.default(400, "No Email Provided"));
    const user = yield UserModel_1.default.findOne({ email }).select("_id");
    if (!user)
        return next(new customError_1.default(400, "This Email is Not Registered"));
    const resetToken = (0, ControllerHelper_1.CreatePasswordResetToken)(user);
    //modifying passwordResetToken and passwordResetToken and saving
    yield user.save();
    const url = `${process.env.FRONTEND_ORIGIN}/Reset-Password/${resetToken}`;
    //sending emails
    yield (0, ControllerHelper_1.EmailSender)(email, url);
    return res.status(200).json({ result: "pass", message: "Reset Email Sent Successfully!" });
}));
exports.forgotPassword = forgotPassword;
const resetPassword = (0, catchAsync_1.catchAsync)((req, res, next) => __awaiter(void 0, void 0, void 0, function* () {
    const { resetToken, newPassword, confirmNewPassword } = req.body;
    if (!newPassword || !confirmNewPassword)
        return next(new customError_1.default(400, "Please Enter Required Details"));
    if (newPassword !== confirmNewPassword)
        return next(new customError_1.default(403, "Password and Confirm password are Different"));
    //rehashing the token to compare
    const hashToken = crypto_1.default.createHash("sha256").update(resetToken).digest("hex");
    const user = yield UserModel_1.default.findOne({ passwordResetToken: hashToken, passwordResetExpires: { $gte: Date.now() } }).select("+passwordResetToken +passwordResetExpires +password");
    if (!user)
        return next(new customError_1.default(404, "Invalid Link or Link Expired ,Please Try Again !"));
    //setting new password
    user.password = newPassword;
    //setting passwordResetToken and passwordTokenExpires undefined
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    //saving the user
    yield user.save();
    return res.status(200).json({ result: "pass", message: "Password Changed Successfully" });
}));
exports.resetPassword = resetPassword;
