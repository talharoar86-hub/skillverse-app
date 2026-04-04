const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const videoStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillverse/mentor-videos',
    resource_type: 'video',
    allowed_formats: ['mp4', 'mov', 'avi', 'webm', 'mkv'],
    transformation: [
      { width: 1280, height: 720, crop: 'limit', quality: 'auto' }
    ]
  }
});

const imageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillverse/images',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'gif', 'webp'],
    transformation: [
      { width: 1920, height: 1080, crop: 'limit', quality: 'auto' }
    ]
  }
});

const coverImageStorage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: 'skillverse/mentor-covers',
    resource_type: 'image',
    allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
    transformation: [
      { width: 1920, height: 600, crop: 'limit', quality: 'auto' }
    ]
  }
});

const uploadVideo = multer({
  storage: videoStorage,
  limits: { fileSize: 100 * 1024 * 1024 } // 100MB limit for videos
});

const uploadImage = multer({
  storage: imageStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit for images
});

const uploadCoverImage = multer({
  storage: coverImageStorage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

module.exports = {
  cloudinary,
  uploadVideo,
  uploadImage,
  uploadCoverImage
};
