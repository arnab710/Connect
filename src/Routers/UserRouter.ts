import express, { Router } from "express"
import {register,login, authCheck, logout} from "../Controllers/AuthController";
import { deleteMe, updateMe } from "../Controllers/UserController";


const router:Router = express.Router();

//user specific routes
router.route("/sign-up").post(register);
router.route("/login").post(login);
router.route("/logout").get(authCheck,logout);
router.route('/updateMyDetails').patch(authCheck,updateMe);
router.route('/deleteMyAccount').delete(authCheck,deleteMe);

export default router;