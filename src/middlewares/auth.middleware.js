import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandlers.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

const getTokenUser = async (req) => {
    const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "");
    if (!token) return null;

    let decodedToken;
    try {
        decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    } catch {
        throw new ApiError(401, "Invalid access token");
    }

    const user = await User.findById(decodedToken?._id).select("-password -refreshToken");
    if (!user) throw new ApiError(401, "Invalid access token");
    return user;
};

export const verifyJWT = asyncHandler(async(req, _, next) => {
    const user = await getTokenUser(req);
    if (!user) throw new ApiError(401, "Unauthorized request");
    req.user = user;
    next();
});

export const optionalVerifyJWT = asyncHandler(async (req, _, next) => {
    req.user = await getTokenUser(req);
    next();
});