const { upload } = require("../config/cloudinary");

/**
 * Middleware for single image upload.
 * After multer + Cloudinary process the file, req.file.path contains the Cloudinary URL.
 * This middleware copies it into req.body.image so the existing service layer works seamlessly.
 */
function uploadSingleImage(fieldName = "image") {
  return [
    upload.single(fieldName),
    (req, res, next) => {
      if (req.file) {
        req.body.image = req.file.path; // Cloudinary secure URL
      }
      next();
    },
  ];
}

/**
 * Middleware for multiple image uploads.
 * After processing, req.body.images will contain an array of Cloudinary URLs.
 */
function uploadMultipleImages(fieldName = "images", maxCount = 5) {
  return [
    upload.array(fieldName, maxCount),
    (req, res, next) => {
      if (req.files && req.files.length > 0) {
        req.body.images = req.files.map((file) => file.path);
      }
      next();
    },
  ];
}

module.exports = { uploadSingleImage, uploadMultipleImages };
