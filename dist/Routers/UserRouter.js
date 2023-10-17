"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const AuthController_1 = require("../Controllers/AuthController");
const UserController_1 = require("../Controllers/UserController");
const router = express_1.default.Router();
//user specific routes
router.route("/sign-up").post(AuthController_1.register);
router.route("/login").post(AuthController_1.login);
router.route("/forget-password").post(AuthController_1.forgotPassword);
router.route("/reset-password").patch(AuthController_1.resetPassword);
router.route("/findUser").get(AuthController_1.authCheck, UserController_1.findUser);
router.route("/My-details").get(AuthController_1.authCheck, UserController_1.fetchMyInfo);
router.route("/updateMyDetails").patch(AuthController_1.authCheck, UserController_1.updateMe);
router.route("/deleteMyAccount").delete(AuthController_1.authCheck, UserController_1.deleteMe);
router.route("/totalFollowings/:id").get(AuthController_1.authCheck, UserController_1.getUserFollowings);
router.route("/totalFollowers/:id").get(AuthController_1.authCheck, UserController_1.getUserFollowers);
router.route("/singleUser/:id").get(AuthController_1.authCheck, UserController_1.getUserInfo);
router.route("/follow").post(AuthController_1.authCheck, UserController_1.follow);
router.route("/unfollow").post(AuthController_1.authCheck, UserController_1.unfollow);
router.route("/logout").post(AuthController_1.authCheck, AuthController_1.logout);
exports.default = router;
