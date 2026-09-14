import { accountApi } from "../api/accountApi";

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);

export function getCustomerProfile() {
  return accountApi.getProfile();
}

export function updateCustomerProfile(values) {
  return accountApi.updateProfile({
    name: values.fullName.trim(),
    phone: values.phone.trim(),
  });
}

export function validateAvatarFile(file) {
  if (!file) return "Please select an image file.";
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return "Please upload a PNG, JPG, JPEG, or WEBP image.";
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Profile photo must be 5 MB or smaller.";
  }
  return "";
}

export async function uploadCustomerAvatar(file) {
  const validationError = validateAvatarFile(file);
  if (validationError) throw new Error(validationError);

  const profile = await accountApi.uploadAvatar(file);
  if (!profile.avatar) throw new Error("Avatar upload did not return an image URL.");
  return profile;
}
