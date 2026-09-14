const contentService = require("../services/contentService");
const asyncHandler = require("../utils/asyncHandler");

function makeCrudController(service, typeName) {
  return {
    list: asyncHandler(async (req, res) => {
      const records = await service.list(req.query);
      res.json({ success: true, data: records });
    }),
    get: asyncHandler(async (req, res) => {
      const record = await service.get(req.params.id);
      res.json({ success: true, data: record });
    }),
    create: asyncHandler(async (req, res) => {
      const record = await service.create(req.validated.body);
      res.status(201).json({ success: true, data: record });
    }),
    update: asyncHandler(async (req, res) => {
      const record = await service.update(req.params.id, req.validated.body);
      res.json({ success: true, data: record });
    }),
    remove: asyncHandler(async (req, res) => {
      await service.remove(req.params.id);
      res.json({ success: true, message: `${typeName} deleted` });
    }),
  };
}

const bannerController = makeCrudController(contentService.bannerService, "banner");

const getPopup = asyncHandler(async (req, res) => {
  const popup = await contentService.getPopup();
  res.json({ success: true, data: popup });
});

const updatePopup = asyncHandler(async (req, res) => {
  const popup = await contentService.updatePopup(req.validated.body);
  res.json({ success: true, data: popup });
});

const getAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await contentService.getAnnouncement();
  res.json({ success: true, data: announcement });
});

const updateAnnouncement = asyncHandler(async (req, res) => {
  const announcement = await contentService.updateAnnouncement(req.validated.body);
  res.json({ success: true, data: announcement });
});

module.exports = {
  bannerController,
  getAnnouncement,
  getPopup,
  updateAnnouncement,
  updatePopup,
};
