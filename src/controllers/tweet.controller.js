import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Tweet } from "../models/tweet.model.js";

const getPagination = (query) => {
    const page = Math.max(Number.parseInt(query.page, 10) || 1, 1);
    const limit = Math.min(Math.max(Number.parseInt(query.limit, 10) || 10, 1), 100);
    return { page, limit, skip: (page - 1) * limit };
};

const createTweet = asyncHandler(async (req, res) => {
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!content) throw new ApiError(400, "Tweet content is required");
    const tweet = await Tweet.create({ content, owner: req.user._id });
    return res.status(201).json(new ApiResponse(201, tweet, "Tweet created successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
    const { userId } = req.params;
    if (!mongoose.isValidObjectId(userId)) throw new ApiError(400, "Invalid user ID");
    const { page, limit, skip } = getPagination(req.query);
    const [tweets, totalTweets] = await Promise.all([
        Tweet.find({ owner: userId }).sort({ createdAt: -1 }).skip(skip).limit(limit)
            .populate("owner", "username fullName avatar"),
        Tweet.countDocuments({ owner: userId })
    ]);
    return res.status(200).json(new ApiResponse(200, {
        tweets,
        pagination: { page, limit, totalTweets, totalPages: Math.ceil(totalTweets / limit) }
    }, "Tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    const content = typeof req.body.content === "string" ? req.body.content.trim() : "";
    if (!mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");
    if (!content) throw new ApiError(400, "Tweet content is required");
    const tweet = await Tweet.findOneAndUpdate(
        { _id: tweetId, owner: req.user._id },
        { $set: { content } },
        { new: true, runValidators: true }
    );
    if (!tweet) throw new ApiError(404, "Tweet not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
    const { tweetId } = req.params;
    if (!mongoose.isValidObjectId(tweetId)) throw new ApiError(400, "Invalid tweet ID");
    const tweet = await Tweet.findOneAndDelete({ _id: tweetId, owner: req.user._id });
    if (!tweet) throw new ApiError(404, "Tweet not found or you do not own it");
    return res.status(200).json(new ApiResponse(200, tweet, "Tweet deleted successfully"));
});

export { createTweet, deleteTweet, getUserTweets, updateTweet };
