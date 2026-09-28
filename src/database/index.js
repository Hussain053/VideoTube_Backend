import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () => {
    try {
        // Remove any existing database name from URI and append the correct one
        const uri = process.env.MONGODB_URI.replace(/\/[^/]*$/, '') + `/${DB_NAME}`;
        
        const connectionInstance = await mongoose.connect(uri)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log(` Database Name: ${DB_NAME}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB