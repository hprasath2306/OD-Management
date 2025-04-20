import { v2 as cloudinary } from 'cloudinary';
// Configure Cloudinary with your credentials
cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
    secure: true
});
/**
 * Uploads a file to Cloudinary
 * @param fileStr Base64 encoded file string
 * @param folder Optional folder to store the file in
 * @returns Promise with the upload result
 */
export const uploadToCloudinary = async (fileStr, folder = 'od-proofs') => {
    try {
        // Handle base64 image uploads
        if (!fileStr) {
            throw new Error('No file provided');
        }
        // Upload the file to Cloudinary
        const uploadResponse = await cloudinary.uploader.upload(fileStr, {
            folder,
            resource_type: 'auto', // Automatically detect the resource type
        });
        console.log('File uploaded to Cloudinary:', uploadResponse.public_id);
        return {
            url: uploadResponse.secure_url,
            publicId: uploadResponse.public_id,
            format: uploadResponse.format,
        };
    }
    catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        throw new Error(`Upload failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
};
