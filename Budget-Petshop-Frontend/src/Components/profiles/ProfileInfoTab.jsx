import { useState } from "react";
import {
  User,
  Mail,
  Phone,
  Edit2,
  Camera,
  Upload,
  Trash2,
} from "lucide-react";

export default function ProfileInfoTab({
  profileName,
  setProfileName,
  profileEmail,
  setProfileEmail,
  profilePhone,
  setProfilePhone,
  profileAvatar,
  setProfileAvatar,
  isAvatarUploading,
  onAvatarUpload,
  avatarError,
  handleSaveProfile,
  handleCancelProfile,
  isEditingProfile,
  setIsEditingProfile,
  profileMessage,
}) {
  const [errors, setErrors] = useState({});

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    e.target.value = "";
    if (!file || isAvatarUploading) return;

    const allowedTypes = ["image/jpeg", "image/jpg", "image/png", "image/webp"];
    if (!allowedTypes.includes(file.type)) {
      onAvatarUpload(null, "Only JPG, JPEG, PNG, and WEBP images are allowed.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      onAvatarUpload(null, "Avatar image must be 5MB or smaller.");
      return;
    }

    const previousAvatar = profileAvatar;
    const previewUrl = URL.createObjectURL(file);
    setProfileAvatar(previewUrl);

    try {
      await onAvatarUpload(file);
    } catch {
      setProfileAvatar(previousAvatar);
    } stroke:
    URL.revokeObjectURL(previewUrl);
  };

  const validate = () => {
    const nextErrors = {};

    const fn = String(profileName || "").trim();
    if (!fn) {
      nextErrors.name = "Full name is required.";
    } else if (fn.length < 2) {
      nextErrors.name = "Full name must be at least 2 characters.";
    } else if (fn.length > 50) {
      nextErrors.name = "Full name must not exceed 50 characters.";
    }

    const emailVal = String(profileEmail || "").trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    const phoneDigits = String(profilePhone || "").replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const onSubmit = (e) => {
    e.preventDefault();
    if (!validate()) return;
    handleSaveProfile(e);
  };

  return (
    <div className="text-left">
      <div className="flex items-center justify-between border-b border-outline pb-4 mb-6">
        <div>
          <h2 className="text-2xl font-bold text-on-background">My Profile</h2>
          <p className="text-xs text-charcoal-text mt-0.5">
            Manage your personal settings and contact info
          </p>
        </div>
        {!isEditingProfile && (
          <button
            onClick={() => setIsEditingProfile(true)}
            className="inline-flex items-center gap-2 border border-outline-strong bg-white hover:border-primary hover:text-primary transition rounded-full px-4 py-2 text-xs font-bold cursor-pointer"
          >
            <Edit2 size={12} />
            <span>Edit Profile</span>
          </button>
        )}
      </div>

      {profileMessage && (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-2xl p-4 text-sm font-bold mb-6 animate-fade-in">
          {profileMessage}
        </div>
      )}

      {/* Profile Picture Section */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-tint/20 border border-outline rounded-3xl p-6 mb-6">
        <div className="relative group">
          <div className="h-24 w-24 rounded-full overflow-hidden border-2 border-secondary/20 flex items-center justify-center bg-secondary/10 text-secondary font-extrabold text-3xl shrink-0">
            {profileAvatar ? (
              <img
                src={profileAvatar}
                alt="Profile"
                className="h-full w-full object-cover"
              />
            ) : profileName ? (
              profileName
                .split(" ")
                .map((n) => n[0])
                .join("")
                .toUpperCase()
                .slice(0, 2)
            ) : (
              "U"
            )}
          </div>
          {isEditingProfile && (
            <label
              htmlFor="avatar-upload"
              className="absolute inset-0 bg-black/40 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition cursor-pointer text-[10px] font-bold"
            >
              <Camera size={18} className="mb-1" />
              <span>Change</span>
            </label>
          )}
        </div>

        {isEditingProfile ? (
          <div className="flex flex-col gap-2 items-center sm:items-start text-center sm:text-left">
            <div className="flex gap-2">
              <label
                htmlFor="avatar-upload"
                className={`inline-flex items-center justify-center gap-2 rounded-full bg-secondary px-4 py-2 text-xs font-bold text-white transition active:scale-95 shadow-sm ${
                  isAvatarUploading
                    ? "cursor-not-allowed opacity-70"
                    : "hover:bg-secondary/90 cursor-pointer"
                }`}
              >
                {isAvatarUploading ? (
                  <span className="h-3.5 w-3.5 rounded-full border-2 border-white/50 border-t-white animate-spin" />
                ) : (
                  <Upload size={13} />
                )}
                <span>{isAvatarUploading ? "Uploading..." : "Upload Photo"}</span>
              </label>
              <input
                type="file"
                id="avatar-upload"
                accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                className="hidden"
                disabled={isAvatarUploading}
                onChange={handleImageChange}
              />
              {profileAvatar && (
                <button
                  type="button"
                  onClick={() => setProfileAvatar("")}
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-rose-200 bg-rose-50 text-rose-600 hover:bg-rose-100 px-4 py-2 text-xs font-bold transition cursor-pointer active:scale-95 shadow-sm"
                >
                  <Trash2 size={13} />
                  <span>Remove</span>
                </button>
              )}
            </div>
            <p className="text-[10px] text-charcoal-text">
              Supports JPG, PNG, or WEBP. Max size 5MB.
            </p>
            {avatarError ? (
              <p className="text-[11px] font-semibold text-rose-600">
                {avatarError}
              </p>
            ) : null}
          </div>
        ) : (
          <div className="text-center sm:text-left">
            <h4 className="font-bold text-on-background text-lg">
              {profileName}
            </h4>
            <p className="text-xs text-charcoal-text mt-0.5">Profile Picture</p>
          </div>
        )}
      </div>

      {isEditingProfile ? (
        <form onSubmit={onSubmit} className="space-y-5" noValidate>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                  Full Name <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-charcoal-text/60">Min 2, Max 50 chars</span>
              </div>
              <input
                type="text"
                maxLength={50}
                value={profileName}
                onChange={(e) => {
                  setProfileName(e.target.value);
                  if (errors.name) setErrors((err) => ({ ...err, name: "" }));
                }}
                className={`w-full rounded-xl border ${
                  errors.name ? "border-rose-400 bg-rose-50" : "border-outline-strong focus:border-secondary"
                } px-4 py-3 text-sm text-on-background outline-none transition`}
              />
              {errors.name && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.name}</p>}
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <span className="text-[10px] text-charcoal-text/60">Valid email</span>
              </div>
              <input
                type="email"
                maxLength={100}
                value={profileEmail}
                onChange={(e) => {
                  setProfileEmail(e.target.value);
                  if (errors.email) setErrors((err) => ({ ...err, email: "" }));
                }}
                className={`w-full rounded-xl border ${
                  errors.email ? "border-rose-400 bg-rose-50" : "border-outline-strong focus:border-secondary"
                } px-4 py-3 text-sm text-on-background outline-none transition`}
              />
              {errors.email && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.email}</p>}
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <div className="mb-2 flex items-center justify-between">
                <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text">
                  Phone Number
                </label>
                <span className="text-[10px] text-charcoal-text/60">Exact 10 digits</span>
              </div>
              <input
                type="tel"
                maxLength={10}
                value={profilePhone}
                onChange={(e) => {
                  setProfilePhone(e.target.value.replace(/\D/g, "").slice(0, 10));
                  if (errors.phone) setErrors((err) => ({ ...err, phone: "" }));
                }}
                className={`w-full rounded-xl border ${
                  errors.phone ? "border-rose-400 bg-rose-50" : "border-outline-strong focus:border-secondary"
                } px-4 py-3 text-sm text-on-background outline-none transition`}
              />
              {errors.phone && <p className="mt-1 text-xs font-semibold text-rose-600">{errors.phone}</p>}
            </div>
          </div>

          <div className="flex gap-3 justify-end pt-4 border-t border-outline">
            <button
              type="button"
              onClick={handleCancelProfile}
              className="rounded-full border border-outline-strong bg-white px-5 py-2.5 text-xs font-bold text-charcoal-text hover:bg-surface-soft transition cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isAvatarUploading}
              className="rounded-full bg-secondary hover:bg-secondary/90 px-6 py-2.5 text-xs font-bold text-white transition cursor-pointer"
            >
              Save Changes
            </button>
          </div>
        </form>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-surface-tint/30 border border-outline rounded-2xl p-6">
            <div className="flex gap-3 items-start">
              <User className="text-secondary shrink-0" size={20} />
              <div>
                <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
                  Full Name
                </p>
                <p className="text-base font-bold text-on-background mt-0.5">
                  {profileName}
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Mail className="text-secondary shrink-0" size={20} />
              <div>
                <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
                  Email Address
                </p>
                <p className="text-base font-bold text-on-background mt-0.5">
                  {profileEmail}
                </p>
              </div>
            </div>
            <div className="flex gap-3 items-start">
              <Phone className="text-secondary shrink-0" size={20} />
              <div>
                <p className="text-[10px] font-bold text-[#8a8f88] uppercase tracking-wider">
                  Phone Number
                </p>
                <p className="text-base font-bold text-on-background mt-0.5">
                  {profilePhone || "Not set"}
                </p>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
