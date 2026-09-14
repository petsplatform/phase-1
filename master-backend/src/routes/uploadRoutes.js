const express = require("express");
const { upload, deleteImage } = require("../config/cloudinary");
const asyncHandler = require("../utils/asyncHandler");

const router = express.Router();

// POST /api/upload — Upload a single image to Cloudinary
router.post(
  "/",
  upload.single("image"),
  asyncHandler(async (req, res) => {
    if (!req.file) {
      return res.status(400).json({ success: false, message: "No image file provided" });
    }
    res.json({
      success: true,
      data: {
        url: req.file.path,
        public_id: req.file.filename,
      },
    });
  })
);

// POST /api/upload/multiple — Upload multiple images to Cloudinary
router.post(
  "/multiple",
  upload.array("images", 10),
  asyncHandler(async (req, res) => {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ success: false, message: "No image files provided" });
    }
    const uploaded = req.files.map((file) => ({
      url: file.path,
      public_id: file.filename,
    }));
    res.json({ success: true, data: uploaded });
  })
);

// DELETE /api/upload — Delete an image from Cloudinary by URL
router.delete(
  "/",
  asyncHandler(async (req, res) => {
    const { imageUrl } = req.body;
    if (!imageUrl) {
      return res.status(400).json({ success: false, message: "imageUrl is required" });
    }
    await deleteImage(imageUrl);
    res.json({ success: true, message: "Image deleted" });
  })
);

module.exports = router;
