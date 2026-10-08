import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { User } from "../models/user.model.js";
import { Video } from "../models/video.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const escapeRegex = (value) => value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const publishVideo = asyncHandler(async (req, res) => {
    const { title, description } = req.body;
    const videoFilePath = req.files?.videoFile?.[0]?.path;
    const thumbnailPath = req.files?.thumbnail?.[0]?.path;

    if (!title?.trim() || !description?.trim()) {
        throw new ApiError(400, "Title and description are required");
    }
    if (!videoFilePath || !thumbnailPath) {
        throw new ApiError(400, "Video file and thumbnail are required");
    }

    const [videoFile, thumbnail] = await Promise.all([
        uploadOnCloudinary(videoFilePath),
        uploadOnCloudinary(thumbnailPath)
    ]);
    if (!videoFile?.url || !thumbnail?.url) {
        throw new ApiError(500, "Video or thumbnail upload failed");
    }

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title: title.trim(),
        description: description.trim(),
        duration: Number(videoFile.duration) || 0,
        owner: req.user._id
    });

    return res.status(201).json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID");
    }

    const video = await Video.findById(videoId).populate("owner", "username fullName avatar");
    if (!video || (!video.isPublished && String(video.owner._id) !== String(req.user?._id))) {
        throw new ApiError(404, "Video not found");
    }

    if (video.isPublished) {
        await Promise.all([
            Video.updateOne({ _id: video._id }, { $inc: { views: 1 } }),
            req.user
                ? User.updateOne({ _id: req.user._id }, { $addToSet: { watchHistory: video._id } })
                : Promise.resolve()
        ]);
        video.views += 1;
    }

    return res.status(200).json(new ApiResponse(200, video, "Video fetched successfully"));
});

const getAllVideos = asyncHandler(async (req, res) => {
    const { page, limit, skip } = getPagination(req.query);
    const filter = { isPublished: true };
    const { query, userId, sortBy = "createdAt", sortType = "desc" } = req.query;

    if (userId) {
        if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
        filter.owner = userId;
    }
    if (query?.trim()) {
        const search = escapeRegex(query.trim());
        filter.$or = [
            { title: { $regex: search, $options: "i" } },
            { description: { $regex: search, $options: "i" } }
        ];
    }

    const allowedSortFields = ["createdAt", "views", "title", "duration"];
    const sortField = allowedSortFields.includes(sortBy) ? sortBy : "createdAt";
    const sortDirection = sortType === "asc" ? 1 : -1;
    const [videos, totalVideos] = await Promise.all([
        Video.find(filter)
            .sort({ [sortField]: sortDirection })
            .skip(skip)
            .limit(limit)
            .populate("owner", "username fullName avatar"),
        Video.countDocuments(filter)
    ]);

    return res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: { page, limit, totalVideos, totalPages: Math.ceil(totalVideos / limit) }
    }, "Videos fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");

    const updates = {};
    for (const field of ["title", "description"]) {
        if (req.body[field] !== undefined) {
            if (typeof req.body[field] !== "string" || !req.body[field].trim()) {
                throw new ApiError(400, `${field} must be a non-empty string`);
            }
            updates[field] = req.body[field].trim();
        }
    }
    if (req.file?.path) {
        const thumbnail = await uploadOnCloudinary(req.file.path);
        if (!thumbnail?.url) throw new ApiError(500, "Thumbnail upload failed");
        updates.thumbnail = thumbnail.url;
    }
    if (!Object.keys(updates).length) throw new ApiError(400, "No video updates provided");

    const video = await Video.findOneAndUpdate(
        { _id: videoId, owner: req.user._id },
        { $set: updates },
        { new: true, runValidators: true }
    );
    if (!video) throw new ApiError(404, "Video not found or you do not own it");

    return res.status(200).json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    const video = await Video.findOneAndDelete({ _id: videoId, owner: req.user._id });
    if (!video) throw new ApiError(404, "Video not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, video, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
    const { videoId } = req.params;
    if (!mongoose.isValidObjectId(videoId)) throw new ApiError(400, "Invalid video ID");
    const video = await Video.findOne({ _id: videoId, owner: req.user._id });
    if (!video) throw new ApiError(404, "Video not found or you do not own it");
    video.isPublished = !video.isPublished;
    await video.save({ validateBeforeSave: false });
    return res.status(200).json(new ApiResponse(200, video, "Video publish status updated"));
});

export { deleteVideo, getAllVideos, getVideoById, publishVideo, togglePublishStatus, updateVideo };
