const asyncHandler = require("../utils/asyncHandler");
const ApiError = require("../utils/apiError");
const bulkImportService = require("../services/bulkImportService");
const { masterPrisma } = require("../config/db");

// Helper: get the correct db for this request (tenant or master)
function getDb(req) {
  return req.tenantDb || masterPrisma;
}

// ─── Download Excel Template ──────────────────────────────────────────────────
const downloadTemplate = asyncHandler(async (req, res) => {
  const workbook = await bulkImportService.generateTemplate(getDb(req));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", "attachment; filename=Product_Import_Template.xlsx");
  await workbook.xlsx.write(res);
  res.end();
});

// ─── Validate Uploaded File (Preview) ────────────────────────────────────────
const validateImport = asyncHandler(async (req, res) => {
  if (!req.file) throw new ApiError(400, "No file uploaded");

  const allowedMimes = [
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    "application/vnd.ms-excel",
    "text/csv",
  ];
  if (!allowedMimes.includes(req.file.mimetype)) {
    throw new ApiError(400, "Only .xlsx, .xls, or .csv files are allowed");
  }
  if (req.file.size > 10 * 1024 * 1024) {
    throw new ApiError(400, "File size must not exceed 10MB");
  }

  const db = getDb(req);
  const importMode = req.body.importMode || "AddNew";
  const rows = await bulkImportService.parseExcelFile(req.file.buffer);

  if (rows.length === 0) throw new ApiError(400, "The uploaded file contains no data rows");

  const { valid, errors } = await bulkImportService.validateRows(rows, importMode, db);

  res.json({
    success: true,
    data: {
      totalRows: rows.length,
      validRows: valid.length,
      invalidRows: errors.length,
      errors,
      validRowsData: valid,
      importMode,
      fileName: req.file.originalname,
    },
  });
});

// ─── Execute Import ───────────────────────────────────────────────────────────
const executeImport = asyncHandler(async (req, res) => {
  const { validRowsData, importMode, fileName } = req.body;

  if (!Array.isArray(validRowsData) || validRowsData.length === 0) {
    throw new ApiError(400, "No valid rows to import");
  }

  const db = getDb(req);
  const importedBy = req.user?.email || req.user?.name || "Admin";

  const { successCount, failedRows, durationMs } = await bulkImportService.importRows(
    validRowsData,
    importMode || "AddNew",
    importedBy,
    db,
  );

  let history = null;
  let historyWarning = null;
  try {
    history = await bulkImportService.saveImportHistory({
      fileName: fileName || "import.xlsx",
      importedBy,
      importMode: importMode || "AddNew",
      totalRows: validRowsData.length,
      successRows: successCount,
      failedRows: failedRows.length,
      durationMs,
      errors: failedRows.map((f) => ({ ...f, reasons: [f.reason] })),
    });
  } catch (error) {
    console.error("[Bulk Import] Failed to save import history:", error);
    historyWarning = "Products were imported, but import history could not be saved.";
  }

  res.json({
    success: true,
    data: {
      importId: history?.id || null,
      totalRows: validRowsData.length,
      successRows: successCount,
      failedRows: failedRows.length,
      durationMs,
      status: history?.status || (failedRows.length === 0 ? "Completed" : successCount === 0 ? "Failed" : "PartialSuccess"),
      warning: historyWarning,
    },
  });
});

// ─── Get Import History ───────────────────────────────────────────────────────
const getHistory = asyncHandler(async (req, res) => {
  const history = await bulkImportService.getImportHistory();
  res.json({ success: true, data: history });
});

// ─── Download Error Report ────────────────────────────────────────────────────
const downloadErrorReport = asyncHandler(async (req, res) => {
  const { importId } = req.params;
  const { workbook, fileName } = await bulkImportService.generateErrorReport(importId);
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=${encodeURIComponent(fileName)}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

// ─── Export Products ──────────────────────────────────────────────────────────
const exportProducts = asyncHandler(async (req, res) => {
  const workbook = await bulkImportService.exportProducts(getDb(req));
  res.setHeader("Content-Type", "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet");
  res.setHeader("Content-Disposition", `attachment; filename=Products_Export_${Date.now()}.xlsx`);
  await workbook.xlsx.write(res);
  res.end();
});

module.exports = {
  downloadTemplate,
  validateImport,
  executeImport,
  getHistory,
  downloadErrorReport,
  exportProducts,
};
