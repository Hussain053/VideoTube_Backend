import mongoose from "mongoose";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import { Subscription } from "../models/subcription.model.js";
import { User } from "../models/user.model.js";

const toggleSubscription = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");
    if (String(req.user._id) === String(channelId)) {
        throw new ApiError(400, "You cannot subscribe to your own channel");
    }
    const channel = await User.findById(channelId);
    if (!channel) throw new ApiError(404, "Channel not found");

    const subscriptionFilter = { subscriber: req.user._id, channel: channelId };
    const subscription = await Subscription.findOne(subscriptionFilter);
    if (subscription) {
        await subscription.deleteOne();
        return res.status(200).json(new ApiResponse(200, { subscribed: false }, "Unsubscribed successfully"));
    }

    await Subscription.create(subscriptionFilter);
    return res.status(200).json(new ApiResponse(200, { subscribed: true }, "Subscribed successfully"));
});

const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const { channelId } = req.params;
    if (!mongoose.isValidObjectId(channelId)) throw new ApiError(400, "Invalid channel ID");
    const subscriptions = await Subscription.find({ channel: channelId })
        .sort({ createdAt: -1 })
        .populate("subscriber", "username fullName avatar");
    return res.status(200).json(new ApiResponse(200, subscriptions, "Channel subscribers fetched successfully"));
});

const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params;
    if (!mongoose.isValidObjectId(subscriberId)) throw new ApiError(400, "Invalid user ID");
    const subscriptions = await Subscription.find({ subscriber: subscriberId })
        .sort({ createdAt: -1 })
        .populate("channel", "username fullName avatar");
    return res.status(200).json(new ApiResponse(200, subscriptions, "Subscribed channels fetched successfully"));
});

export { getSubscribedChannels, getUserChannelSubscribers, toggleSubscription };
