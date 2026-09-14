const express = require("express");
const multer = require("multer");
const controller = require("../controllers/bulkImportController");

const router = express.Router();

// Use memory storage so we can pass buffer directly to ExcelJS
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB
  fileFilter: (req, file, cb) => {
    const allowed = [
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "application/vnd.ms-excel",
      "text/csv",
    ];
    if (allowed.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error("Only .xlsx, .xls, or .csv files are allowed"), false);
    }
  },
});

// GET  /api/bulk-import/template        — Download Excel template
router.get("/template", controller.downloadTemplate);

// GET  /api/bulk-import/export          — Export all products as Excel
router.get("/export", controller.exportProducts);

// GET  /api/bulk-import/history         — Get import history list
router.get("/history", controller.getHistory);

// GET  /api/bulk-import/history/:importId/errors — Download error report
router.get("/history/:importId/errors", controller.downloadErrorReport);

// POST /api/bulk-import/validate        — Upload & validate (preview)
router.post("/validate", upload.single("file"), controller.validateImport);

// POST /api/bulk-import/execute         — Execute confirmed import
router.post("/execute", controller.executeImport);

module.exports = router;
