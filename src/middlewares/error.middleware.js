import { ApiError } from "../utils/ApiError.js";

export const notFoundHandler = (req, res) => {
    return res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
};

export const errorHandler = (error, req, res, next) => {
    if (res.headersSent) return next(error);

    let statusCode = error instanceof ApiError ? error.statusCode : error.statusCode || 500;
    let message = error.message || "Internal Server Error";
    let errors = error.errors || [];

    if (error.code === 11000) {
        statusCode = 409;
        message = "A record with this value already exists";
    } else if (error.name === "ValidationError" || error.name === "CastError") {
        statusCode = 400;
    }

    if (statusCode >= 500 && !(error instanceof ApiError)) {
        console.error(error);
        message = "Internal Server Error";
        errors = [];
    }

    return res.status(statusCode).json({
        success: false,
        message,
        errors
    });
};
