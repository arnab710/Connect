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
exports.EmailSender = exports.CreatePasswordResetToken = exports.CheckPasswordChangedTime = exports.VerifyToken = exports.CookieSetter = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const crypto_1 = __importDefault(require("crypto"));
const mail_1 = __importDefault(require("@sendgrid/mail"));
// cookie setter in response
const CookieSetter = (token, res) => {
    res.cookie("jwt", token, {
        expires: new Date(Date.now() + Number(process.env.JWT_COOKIE_EXPIRE) * 24 * 60 * 60 * 1000),
        httpOnly: true,
        sameSite: "none",
        secure: true,
    });
};
exports.CookieSetter = CookieSetter;
//jwt verifier
const VerifyToken = (token) => {
    return new Promise((resolve, reject) => {
        jsonwebtoken_1.default.verify(token, process.env.JWT_SECRET, (err, data) => {
            if (err)
                return reject(err);
            return resolve(data);
        });
    });
};
exports.VerifyToken = VerifyToken;
//password changed time checker
const CheckPasswordChangedTime = (changedTime, tokenTime) => {
    //checking if the passwordChangedAt exist
    if (changedTime) {
        //changing it into date object
        const date = new Date(changedTime);
        //getting and transforming passwordChangedAt time to second for comparing it with iat
        const passwordTime = date.getTime() / 1000;
        //checking if token issued later
        if (passwordTime < tokenTime)
            return false;
        else
            return true;
    }
    return false; // this means password didn't changed after token was issued
};
exports.CheckPasswordChangedTime = CheckPasswordChangedTime;
//generating random token for reset password
const CreatePasswordResetToken = function (user) {
    const ResetToken = crypto_1.default.randomBytes(32).toString("hex");
    user.passwordResetToken = crypto_1.default.createHash("sha256").update(ResetToken).digest("hex");
    //setting a time for after 5 mins
    user.passwordResetExpires = Date.now() + 5 * 60 * 1000;
    return ResetToken;
};
exports.CreatePasswordResetToken = CreatePasswordResetToken;
const EmailSender = (UserEmail, url) => __awaiter(void 0, void 0, void 0, function* () {
    mail_1.default.setApiKey(process.env.SENDGRID_API);
    const message = {
        to: UserEmail,
        from: {
            name: "Team Connect",
            email: "teamconnect710@gmail.com",
        },
        subject: "Reset Password Link (valid for 5 min)",
        text: `Click the link to reset your password. This is only valid for 5 minutes.\n Link:\n ${url}`,
    };
    return yield mail_1.default.send(message);
});
exports.EmailSender = EmailSender;
