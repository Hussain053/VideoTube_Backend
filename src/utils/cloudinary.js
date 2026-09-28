import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

// Configure Cloudinary
const configureCloudinary = () => {
    console.log("Cloudinary Environment Variables:");
    console.log("CLOUDINARY_CLOUD_NAME:", process.env.CLOUDINARY_CLOUD_NAME);
    console.log("CLOUDINARY_API_KEY:", process.env.CLOUDINARY_API_KEY ? "SET" : "NOT SET");
    console.log("CLOUDINARY_API_SECRET:", process.env.CLOUDINARY_API_SECRET ? "SET" : "NOT SET");

    cloudinary.config({ 
      cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
      api_key: process.env.CLOUDINARY_API_KEY, 
      api_secret: process.env.CLOUDINARY_API_SECRET 
    });
}

const uploadOnCloudinary = async (localFilePath) => {
    try {
        // Configure Cloudinary before upload
        configureCloudinary();
        
        if (!localFilePath) return null
        
        // Convert Windows backslashes to forward slashes
        const normalizedPath = localFilePath.replace(/\\/g, '/');
        
        console.log("Attempting to upload to Cloudinary:", normalizedPath);
        
        //upload the file on cloudinary
        const response = await cloudinary.uploader.upload(normalizedPath, {
            resource_type: "auto"
        })
        // file has been uploaded successfull
        console.log("file is uploaded on cloudinary ", response.url);
        fs.unlinkSync(localFilePath)
        return response;

    } catch (error) {
        console.error("Cloudinary upload error:", error);
        fs.unlinkSync(localFilePath) // remove the locally saved temporary file as the upload operation got failed
        return null;
    }
}



export {uploadOnCloudinary}