import { Router } from "express";
import {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
} from "../controllers/playlist.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route("/").post(verifyJWT, createPlaylist);
router.route("/user/:userId").get(verifyJWT, getUserPlaylists);
router.route("/:playlistId").get(verifyJWT, getPlaylistById).patch(verifyJWT, updatePlaylist).delete(verifyJWT, deletePlaylist);
router.route("/:playlistId/videos/:videoId")
    .post(verifyJWT, addVideoToPlaylist)
    .delete(verifyJWT, removeVideoFromPlaylist);

export default router;
