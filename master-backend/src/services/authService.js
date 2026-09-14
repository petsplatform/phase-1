const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

const adminLoginSelect = {
  id: true,
  name: true,
  role: true,
  email: true,
  avatar: true,
  passwordHash: true,
};

const activeAssignmentSelect = {
  role: true,
  storeId: true,
  store: {
    select: {
      id: true,
      name: true,
      slug: true,
      storeKey: true,
      primaryDomain: true,
      status: true,
    },
  },
};

const publicAdmin = (admin) => ({
  id: admin.id,
  name: admin.name,
  role: admin.role,
  email: admin.email,
  avatar: admin.avatar,
  store: admin.store || null,
});

async function loginAdmin({ email, password }) {
  const admin = await prisma.adminUser.findUnique({
    where: { email },
    select: adminLoginSelect,
  });

  const envEmail = process.env.ADMIN_EMAIL || "owner@adminstore.com";
  const envPassword = process.env.ADMIN_PASSWORD || "admin123";
  const usingEnvAdmin =
    !admin && email === envEmail && password === envPassword;

  if (!admin && !usingEnvAdmin) {
    throw new ApiError(401, "Invalid email or password");
  }

  if (admin) {
    const matches = await bcrypt.compare(password, admin.passwordHash);
    if (!matches) {
      throw new ApiError(401, "Invalid email or password");
    }
  }

  const user = admin || {
    id: "env-admin",
    name: process.env.ADMIN_NAME || "admin Store",
    role: "Store Owner",
    email: envEmail,
    avatar: null,
  };

  let assignment = null;
  if (admin && admin.role !== "SUPER_ADMIN") {
    assignment = await prisma.userStoreAssignment.findFirst({
      where: { userId: admin.id, isActive: true, store: { status: "ACTIVE" } },
      select: activeAssignmentSelect,
      orderBy: { createdAt: "asc" },
    });
  }

  const tokenPayload = {
    id: user.id,
    userId: user.id,
    email: user.email,
    role: assignment?.role || user.role,
    ...(assignment ? { storeId: assignment.storeId } : {}),
  };

  const token = jwt.sign(
    tokenPayload,
    process.env.JWT_SECRET,
    { expiresIn: "7d" },
  );

  return {
    token,
    admin: publicAdmin({
      ...user,
      role: tokenPayload.role,
      store: assignment
        ? {
            id: assignment.store.id,
            name: assignment.store.name,
            slug: assignment.store.slug,
            storeKey: assignment.store.storeKey,
            primaryDomain: assignment.store.primaryDomain,
            status: assignment.store.status,
          }
        : null,
    }),
  };
}

async function getCurrentAdmin(user) {
  const admin = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!admin) return user;

  if (admin.role === "SUPER_ADMIN") {
    return publicAdmin({
      ...admin,
      role: "SUPER_ADMIN",
      store: null,
    });
  }

  const assignment = await prisma.userStoreAssignment.findFirst({
    where: { userId: admin.id, isActive: true },
    include: { store: true },
    orderBy: { createdAt: "asc" },
  });

  return publicAdmin({
    ...admin,
    role: assignment?.role || admin.role,
    store: assignment
      ? {
          id: assignment.store.id,
          name: assignment.store.name,
          slug: assignment.store.slug,
          storeKey: assignment.store.storeKey,
          primaryDomain: assignment.store.primaryDomain,
          status: assignment.store.status,
        }
      : null,
  });
}

async function changePassword(user, { currentPassword, newPassword }) {
  if (user.id === "env-admin") {
    throw new ApiError(
      400,
      "Default environment admin password cannot be changed here",
    );
  }

  const admin = await prisma.adminUser.findUnique({ where: { id: user.id } });
  if (!admin) {
    throw new ApiError(404, "Admin account not found");
  }

  const matches = await bcrypt.compare(currentPassword, admin.passwordHash);
  if (!matches) {
    throw new ApiError(400, "Current password is incorrect");
  }

  const reusesCurrentPassword = await bcrypt.compare(newPassword, admin.passwordHash);
  if (reusesCurrentPassword) {
    throw new ApiError(400, "New password must be different from the current password");
  }

  const passwordHash = await bcrypt.hash(newPassword, 10);
  await prisma.adminUser.update({
    where: { id: admin.id },
    data: { passwordHash },
  });

  return { message: "Password changed successfully" };
}

module.exports = { changePassword, getCurrentAdmin, loginAdmin };
