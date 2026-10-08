import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Playlist } from "../models/playlist.model.js";
import { Video } from "../models/video.model.js";

const createPlaylist = asyncHandler(async (req, res) => {
    const { name, description } = req.body;
    if (typeof name !== "string" || !name.trim() ||
        typeof description !== "string" || !description.trim()) {
        throw new ApiError(400, "Playlist name and description are required");
    }
    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    });
    return res.status(201).json(new ApiResponse(201, playlist, "Playlist created successfully"));
});

const getUserPlaylists = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
    const playlists = await Playlist.find({ owner: userId }).sort({ createdAt: -1 });
    return res.status(200).json(new ApiResponse(200, playlists, "Playlists fetched successfully"));
});

const getPlaylistById = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");
    const playlist = await Playlist.findById(playlistId)
        .populate({ path: "videos", populate: { path: "owner", select: "username fullName avatar" } })
        .populate("owner", "username fullName avatar");
    if (!playlist) throw new ApiError(404, "Playlist not found");
    if (String(playlist.owner._id) !== String(req.user._id)) {
        throw new ApiError(403, "You do not have access to this playlist");
    }
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist fetched successfully"));
});

const updatePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");
    const updates = {};
    for (const field of ["name", "description"]) {
        if (req.body[field] !== undefined) {
            if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
                throw new ApiError(400, `${field} must be a non-empty string`);
            }
            updates[field] = req.body[field].trim();
        }
    }
    if (!Object.keys(updates).length) throw new ApiError(400, "No playlist updates provided");
    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
    );
    if (!playlist) throw new ApiError(404, "Playlist not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist updated successfully"));
});

const deletePlaylist = asyncHandler(async (req, res) => {
    const { playlistId } = req.params;
    if (!mongoose.isValidObjectId(playlistId)) throw new ApiError(400, "Invalid playlist ID");
    const playlist = await Playlist.findOneAndDelete({ _id: playlistId, owner: req.user._id });
    if (!playlist) throw new ApiError(404, "Playlist not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, playlist, "Playlist deleted successfully"));
});

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    const [playlist, video] = await Promise.all([
        Playlist.findOne({ _id: playlistId, owner: req.user._id }),
        Video.findOne({ _id: videoId, isPublished: true })
    ]);
    if (!playlist) throw new ApiError(404, "Playlist not found or you do not own it");
    if (!video) throw new ApiError(404, "Video not found");
    await Playlist.updateOne({ _id: playlistId }, { $addToSet: { videos: videoId } });
    return res.status(200).json(new ApiResponse(200, {}, "Video added to playlist"));
});

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const { playlistId, videoId } = req.params;
    if (!mongoose.isValidObjectId(playlistId) || !mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid playlist or video ID");
    }
    const playlist = await Playlist.findOneAndUpdate(
        { _id: playlistId, owner: req.user._id },
        { $pull: { videos: videoId } },
        { new: true }
    );
    if (!playlist) throw new ApiError(404, "Playlist not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, playlist, "Video removed from playlist"));
});

export {
    addVideoToPlaylist,
    createPlaylist,
    deletePlaylist,
    getPlaylistById,
    getUserPlaylists,
    removeVideoFromPlaylist,
    updatePlaylist
};
