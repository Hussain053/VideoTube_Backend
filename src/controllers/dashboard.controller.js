import mongoose from "mongoose";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Subscription } from "../models/subcription.model.js";
import { Video } from "../models/video.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
    const channelId = req.user._id;
    const [videoStats, subscribersCount] = await Promise.all([
        Video.aggregate([
            { $match: { owner: new mongoose.Types.ObjectId(channelId) } },
            {
                $group: {
                    _id: null,
                    totalVideos: { $sum: 1 },
                    totalViews: { $sum: "$views" }
                }
            }
        ]),
        Subscription.countDocuments({ channel: channelId })
    ]);

    return res.status(200).json(new ApiResponse(200, {
        totalVideos: videoStats[0]?.totalVideos || 0,
        totalViews: videoStats[0]?.totalViews || 0,
        subscribersCount
    }, "Channel statistics fetched successfully"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
    const { page = "1", limit = "10" } = req.query;
    const pageNumber = Math.max(Number.parseInt(page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(Number.parseInt(limit, 10) || 10, 1), 100);
    const [videos, totalVideos] = await Promise.all([
        Video.find({ owner: req.user._id })
            .sort({ createdAt: -1 })
            .skip((pageNumber - 1) * pageSize)
            .limit(pageSize),
        Video.countDocuments({ owner: req.user._id })
    ]);
    return res.status(200).json(new ApiResponse(200, {
        videos,
        pagination: {
            page: pageNumber,
            limit: pageSize,
            totalVideos,
            totalPages: Math.ceil(totalVideos / pageSize)
        }
    }, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
