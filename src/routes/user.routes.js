import { Router } from 'express';
import {registerUser} from "../controllers/user.controller.js"
import { upload } from "../middlewares/multer.middleware.js"

const router = Router();

router.route("/register").post(
    (req, res, next) => {
        console.log("Register route hit");
        next();
    },
    upload.fields([
        {
            name: "avatar",
            maxCount: 1
        }, 
        {
            name: "coverImage",
            maxCount: 1
        }
    ]),
    (req, res, next) => {
        console.log("After multer middleware");
        console.log("Files after multer:", req.files);
        next();
    },
    registerUser
);

export default router