import { toast } from 'react-hot-toast'; // Assuming you have toast, or replace with console/alert

// We fetch the signature from OUR backend so the secret is never exposed here.
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export interface CloudinaryUploadResult {
    public_id: string;
    secure_url: string;
    format: string;
    width: number;
    height: number;
}

export const cloudinaryService = {
    /**
     * Uploads an image file to Cloudinary securely.
     * @param file The file object from an input[type="file"]
     * @returns Promise with the result object (url, public_id, etc)
     */
    uploadImage: async (file: File): Promise<CloudinaryUploadResult> => {
        try {
            // 1. Get Signature from Backend
            const signResponse = await fetch(`${API_URL}/api/sign-cloudinary`, {
                method: 'POST',
            });

            if (!signResponse.ok) {
                const err = await signResponse.json();
                throw new Error(err.error || 'Failed to get upload signature');
            }

            const { signature, timestamp, cloudName, apiKey } = await signResponse.json();

            if (!cloudName || cloudName === 'YOUR_CLOUD_NAME_HERE') {
                throw new Error('Cloud Name is missing in server environment. Please check .env file.');
            }

            // 2. Upload to Cloudinary
            const formData = new FormData();
            formData.append('file', file);
            formData.append('api_key', apiKey);
            formData.append('timestamp', timestamp.toString());
            formData.append('signature', signature);
            formData.append('folder', 'namelime_assets'); // Must match backend signing folder

            const uploadResponse = await fetch(`https://api.cloudinary.com/v1_1/${cloudName}/image/upload`, {
                method: 'POST',
                body: formData,
            });

            if (!uploadResponse.ok) {
                const err = await uploadResponse.json();
                throw new Error(err.error?.message || 'Failed to upload image to Cloud');
            }

            const data = await uploadResponse.json();
            return data as CloudinaryUploadResult;

        } catch (error: any) {
            console.error('[Cloudinary Service Error]', error);
            toast.error(error.message || 'Image upload failed');
            throw error;
        }
    }
};
