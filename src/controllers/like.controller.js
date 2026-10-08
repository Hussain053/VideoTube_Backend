import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Comment } from "../models/comment.model.js";
import { Like } from "../models/like.model.js";
import { Tweet } from "../models/tweet.model.js";
import { Video } from "../models/video.model.js";

const targetModels = {
    video: Video,
    comment: Comment,
    tweet: Tweet
};

const toggleLike = asyncHandler(async (req, res) => {
    const { videoId, commentId, tweetId } = req.body;
    const providedTargets = [
        ["video", videoId],
        ["comment", commentId],
        ["tweet", tweetId]
    ].filter(([, id]) => id);
    if (providedTargets.length !== 1) {
        throw new ApiError(400, "Provide exactly one of videoId, commentId, or tweetId");
    }

    const [targetType, targetId] = providedTargets[0];
    if (!mongoose.isValidObjectId(targetId)) throw new ApiError(400, `Invalid ${targetType} ID`);
    const targetFilter = targetType === "video" ? { _id: targetId, isPublished: true } : { _id: targetId };
    const target = await targetModels[targetType].findOne(targetFilter);
    if (!target) throw new ApiError(404, `${targetType} not found`);

    const likeFilter = { [targetType]: targetId, likedBy: req.user._id };
    const existingLike = await Like.findOne(likeFilter);
    if (existingLike) {
        await existingLike.deleteOne();
        return res.status(200).json(new ApiResponse(200, { liked: false }, "Like removed"));
    }

    await Like.create(likeFilter);
    return res.status(200).json(new ApiResponse(200, { liked: true }, "Like added"));
});

const getLikedVideos = asyncHandler(async (req, res) => {
    const likes = await Like.find({ likedBy: req.user._id, video: { $exists: true, $ne: null } })
        .sort({ createdAt: -1 })
        .populate({
            path: "video",
            match: { isPublished: true },
            populate: { path: "owner", select: "username fullName avatar" }
        });
    const videos = likes.map((like) => like.video).filter(Boolean);
    return res.status(200).json(new ApiResponse(200, videos, "Liked videos fetched successfully"));
});

const getVideoLikeStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    const [likesCount, liked] = await Promise.all([
        Like.countDocuments({ video: videoId }),
        req.user
            ? Like.exists({ video: videoId, likedBy: req.user._id })
            : Promise.resolve(null)
    ]);
    return res.status(200).json(new ApiResponse(200, {
        likesCount,
        liked: Boolean(liked)
    }, "Video like status fetched successfully"));
});

export { getLikedVideos, getVideoLikeStatus, toggleLike };
