import { v2 as cloudinary } from 'cloudinary';
import { Readable } from 'stream';
import dotenv from 'dotenv';

dotenv.config();

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure: true,
});

export const saveFileToCloudinary = (buffer) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'avatars',
        transformation: [
          { width: 200, height: 200, crop: 'thumb', gravity: 'face' },
        ],
      },
      (error, result) => {
        if (error) {
          return reject(error);
        }
        resolve(result);
      },
    );

    Readable.from(buffer).pipe(uploadStream);
  });
};
