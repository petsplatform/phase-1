const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

function makeCrudService(modelName, typeName) {
  return {
    list: ({ q }) => {
      const model = prisma[modelName];
      const searchable = [{ title: { contains: q, mode: "insensitive" } }, { subtitle: { contains: q, mode: "insensitive" } }];

      return model.findMany({
        where: q ? { OR: searchable } : undefined,
        orderBy: { createdAt: "desc" },
      });
    },
    get: async (id) => {
      const model = prisma[modelName];
      const record = await model.findUnique({ where: { id } });
      if (!record) throw new ApiError(404, `${typeName} not found`);
      return record;
    },
    create: (payload) => prisma[modelName].create({ data: { id: generateId(typeName), ...payload } }),
    update: async (id, payload) => {
      const model = prisma[modelName];
      await ensureRecord(model, id, typeName);
      return model.update({ where: { id }, data: payload });
    },
    remove: async (id) => {
      const model = prisma[modelName];
      await ensureRecord(model, id, typeName);
      await model.delete({ where: { id } });
    },
  };
}

const bannerService = makeCrudService("banner", "banner");

const getPopup = () => prisma.popup.findUnique({ where: { id: "default" } });

const updatePopup = (payload) => prisma.popup.upsert({
  where: { id: "default" },
  create: { id: "default", ...payload },
  update: payload,
});

const getAnnouncement = () => prisma.announcement.findUnique({ where: { id: "default" } });

const updateAnnouncement = (payload) => prisma.announcement.upsert({
  where: { id: "default" },
  create: { id: "default", ...payload },
  update: payload,
});

async function ensureRecord(model, id, typeName) {
  const record = await model.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, `${typeName} not found`);
}

module.exports = {
  bannerService,
  getAnnouncement,
  getPopup,
  updateAnnouncement,
  updatePopup,
};
