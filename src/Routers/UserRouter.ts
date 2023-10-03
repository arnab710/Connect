import express, { Router } from "express";
import { register, login, authCheck, logout, forgotPassword, resetPassword } from "../Controllers/AuthController";
import { deleteMe, fetchMyInfo, findUser, follow, getUserFollowers, getUserFollowings, getUserInfo, unfollow, updateMe } from "../Controllers/UserController";
import { uploadFile } from "../Utils/multerConfig";
import { cloudinaryConfig } from "../Utils/cloudinaryConfigMiddleware";

const router: Router = express.Router();

//user specific routes
router.route("/sign-up").post(register);
router.route("/login").post(login);

router.route("/forget-password").post(forgotPassword);
router.route("/reset-password").patch(resetPassword);

router.route("/findUser").get(authCheck, findUser);

router.route("/My-details").get(authCheck, fetchMyInfo);
router.route("/updateMyDetails").patch(authCheck, uploadFile, cloudinaryConfig, updateMe);
router.route("/deleteMyAccount").delete(authCheck, deleteMe);

router.route("/totalFollowings/:id").get(authCheck, getUserFollowings);
router.route("/totalFollowers/:id").get(authCheck, getUserFollowers);
router.route("/singleUser/:id").get(authCheck, getUserInfo);

router.route("/follow").post(authCheck, follow);
router.route("/unfollow").post(authCheck, unfollow);

router.route("/logout").post(authCheck, logout);

export default router;
