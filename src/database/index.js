import mongoose from "mongoose";
import { DB_NAME } from "../constant.js";


const connectDB = async () => {
    try {
        const configuredUri = process.env.MONGODB_URI;
        if (!configuredUri) {
            throw new Error("MONGODB_URI is not configured");
        }

        const queryIndex = configuredUri.indexOf("?");
        const uriWithoutQuery = queryIndex === -1 ? configuredUri : configuredUri.slice(0, queryIndex);
        const query = queryIndex === -1 ? "" : configuredUri.slice(queryIndex);
        const protocolEnd = uriWithoutQuery.indexOf("://");
        if (protocolEnd === -1) {
            throw new Error("MONGODB_URI must be a valid MongoDB connection URI");
        }

        const authorityStart = protocolEnd + 3;
        const pathStart = uriWithoutQuery.indexOf("/", authorityStart);
        const authority = pathStart === -1 ? uriWithoutQuery : uriWithoutQuery.slice(0, pathStart);
        const uri = `${authority}/${DB_NAME}${query}`;
        
        const connectionInstance = await mongoose.connect(uri)
        console.log(`\n MongoDB connected !! DB HOST: ${connectionInstance.connection.host}`);
        console.log(` Database Name: ${DB_NAME}`);
    } catch (error) {
        console.log("MONGODB connection FAILED ", error);
        process.exit(1)
    }
}

export default connectDB