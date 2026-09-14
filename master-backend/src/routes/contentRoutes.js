const express = require("express");
const {
  bannerController,
  getAnnouncement,
  getPopup,
  updateAnnouncement,
  updatePopup,
} = require("../controllers/contentController");
const validate = require("../middleware/validate");
const { uploadSingleImage } = require("../middleware/uploadMiddleware");
const {
  announcementSchema,
  bannerSchema,
  idParam,
  popupSchema,
} = require("../validations/adminSchemas");
const { requireAuth } = require("../middleware/auth");
const resolveAdminTenant = require("../middleware/resolveAdminTenant");
const resolveAdminOrPublicTenant = require("../middleware/resolveAdminOrPublicTenant");
const superAdminReadOnly = require("../middleware/superAdminReadOnly");

const router = express.Router();

router.get("/announcement", resolveAdminOrPublicTenant, getAnnouncement);

router.use(requireAuth, superAdminReadOnly, resolveAdminTenant);

router.get("/banners", bannerController.list);
router.post("/banners", ...uploadSingleImage("image"), validate(bannerSchema), bannerController.create);
router.get("/banners/:id", validate(idParam), bannerController.get);
router.put("/banners/:id", ...uploadSingleImage("image"), validate(bannerSchema), bannerController.update);
router.delete("/banners/:id", validate(idParam), bannerController.remove);

router.get("/popup", getPopup);
router.put("/popup", ...uploadSingleImage("image"), validate(popupSchema), updatePopup);

router.put("/announcement", validate(announcementSchema), updateAnnouncement);

module.exports = router;
