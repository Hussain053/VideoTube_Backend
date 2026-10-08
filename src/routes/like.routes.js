import { Router } from "express";
import { getLikedVideos, getVideoLikeStatus, toggleLike } from "../controllers/like.controller.js";
import { optionalVerifyJWT, verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/toggle").post(verifyJWT, toggleLike);
router.route("/videos").get(verifyJWT, getLikedVideos);
router.route("/videos/:videoId").get(optionalVerifyJWT, getVideoLikeStatus);

export default router;
