import express from "express";
import cors from "cors";
import healthcheckRoutes from "./routes/healthcheckRoutes.routes.js";
import cookieParser from "cookie-parser"
import userRouter from './routes/user.routes.js';

const app = express();

app.use(cors({
    origin: process.env.CORS_ORIGIN,
    credentials: true
}))

app.use(express.json({limit: "16kb"}))
app.use(express.urlencoded({extended: true, limit: "16kb"}))
app.use(express.static("public"))

app.use("/api/v1/healthcheck", healthcheckRoutes)
app.use(cookieParser())
app.use("/api/v1/users", userRouter)

app.get("/", (req, res) => {
    res.send("VideoTube Server is Running! 🚀");
})

export default app;
