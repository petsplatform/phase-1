const cloudinary = require("cloudinary").v2;
const { CloudinaryStorage } = require("multer-storage-cloudinary");
const multer = require("multer");

cloudinary.config({
  cloud_name: String(process.env.CLOUDINARY_CLOUD_NAME || "").trim(),
  api_key: String(process.env.CLOUDINARY_API_KEY || "").trim(),
  api_secret: String(process.env.CLOUDINARY_API_SECRET || "").trim(),
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "e-commerce",
    allowed_formats: ["jpg", "jpeg", "png", "gif", "webp", "svg"],
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  },
});

const upload = multer({ storage });

function createCloudinaryUpload({
  folder = "e-commerce",
  allowedFormats = ["jpg", "jpeg", "png", "webp"],
  allowedMimeTypes = ["image/jpeg", "image/png", "image/webp"],
  maxFileSize = 5 * 1024 * 1024,
} = {}) {
  const scopedStorage = new CloudinaryStorage({
    cloudinary,
    params: {
      folder,
      allowed_formats: allowedFormats,
      transformation: [{ quality: "auto", fetch_format: "auto" }],
    },
  });

  return multer({
    storage: scopedStorage,
    limits: { fileSize: maxFileSize },
    fileFilter: (req, file, cb) => {
      if (allowedMimeTypes.includes(file.mimetype)) {
        cb(null, true);
        return;
      }

      const error = new Error("Only JPEG, PNG, and WEBP images are allowed");
      error.status = 400;
      cb(error);
    },
  });
}

/**
 * Upload a single image to Cloudinary.
 * Returns the secure URL.
 */
async function uploadImage(filePath) {
  const result = await cloudinary.uploader.upload(filePath, {
    folder: "e-commerce",
    transformation: [{ quality: "auto", fetch_format: "auto" }],
  });
  return result.secure_url;
}

/**
 * Delete an image from Cloudinary by its URL.
 */
async function deleteImage(imageUrl) {
  if (!imageUrl || !imageUrl.includes("cloudinary")) return;
  try {
    // Extract public_id from URL: .../e-commerce/abc123.jpg → e-commerce/abc123
    const parts = imageUrl.split("/");
    const folderAndFile = parts.slice(parts.indexOf("e-commerce")).join("/");
    const publicId = folderAndFile.replace(/\.[^/.]+$/, ""); // remove extension
    await cloudinary.uploader.destroy(publicId);
  } catch (err) {
    console.error("Cloudinary delete error:", err.message);
  }
}

module.exports = { cloudinary, upload, createCloudinaryUpload, uploadImage, deleteImage };
