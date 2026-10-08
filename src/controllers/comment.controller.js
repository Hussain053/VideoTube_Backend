import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Comment } from "../models/comment.model.js";
import { Video } from "../models/video.model.js";

const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const getVideoComments = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    const video = await Video.findOne({ _id: videoId, isPublished: true });
    if (!video) throw new ApiError(404, "Video not found");

    const { page, limit, skip } = getPagination(req.query);
    const [comments, totalComments] = await Promise.all([
        Comment.find({ video: videoId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate("owner", "username fullName avatar"),
        Comment.countDocuments({ video: videoId })
    ]);
    return res.status(200).json(new ApiResponse(200, {
        comments,
        pagination: { page, limit, totalComments, totalPages: Math.ceil(totalComments / limit) }
    }, "Comments fetched successfully"));
});

const addComment = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    if (!content) throw new ApiError(400, "Comment content is required");
    const video = await Video.findOne({ _id: videoId, isPublished: true });
    if (!video) throw new ApiError(404, "Video not found");

    const comment = await Comment.create({ content, video: videoId, owner: req.user._id });
    await comment.populate("owner", "username fullName avatar");
    return res.status(201).json(new ApiResponse(201, comment, "Comment added successfully"));
});

const updateComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
    if (!content) throw new ApiError(400, "Comment content is required");
    const comment = await Comment.findOneAndUpdate(
        { _id: commentId, owner: req.user._id },
        { $set: { content } },
        { new: true, runValidators: true }
    ).populate("owner", "username fullName avatar");
    if (!comment) throw new ApiError(404, "Comment not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, comment, "Comment updated successfully"));
});

const deleteComment = asyncHandler(async (req, res) => {
    const { commentId } = req.params;
    if (!mongoose.isValidObjectId(commentId)) throw new ApiError(400, "Invalid comment ID");
    const comment = await Comment.findOneAndDelete({ _id: commentId, owner: req.user._id });
    if (!comment) throw new ApiError(404, "Comment not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, comment, "Comment deleted successfully"));
});

export { addComment, deleteComment, getVideoComments, updateComment };
