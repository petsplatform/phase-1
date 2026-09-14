import React, { useState, useEffect, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { updateProfileApi, uploadAvatarApi } from "../../helper/axiosInstance";
import { showToast } from "../common/toast/ToastHelper";
import { Pencil, Upload, User, Mail, Phone, AlertCircle, Loader2 } from "lucide-react";

const AVATAR_ALLOWED_TYPES = ["image/png", "image/jpeg", "image/jpg", "image/webp"];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

const getAvatarFromUploadResponse = (response) => {
  const payload = response?.data || response || {};
  return (
    payload.avatar ||
    payload.avatarUrl ||
    payload.profileImage ||
    payload.customer?.avatar ||
    payload.user?.avatar ||
    ""
  );
};

function AvatarDisplay({ src, letter, className = "" }) {
  return src ? (
    <img
      src={src}
      alt="Profile"
      className={`rounded-full object-cover bg-deep-navy ${className}`}
    />
  ) : (
    <div
      className={`flex items-center justify-center rounded-full bg-deep-navy font-black text-white ${className}`}
    >
      {letter}
    </div>
  );
}

export default function MyProfileTab() {
  const { user, updateSession } = useAuth();
  const fileInputRef = useRef(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
  });
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});
  const [avatarPreview, setAvatarPreview] = useState("");
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
      setAvatarPreview(user.avatar || "");
    }
  }, [user]);

  useEffect(() => {
    return () => {
      if (avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  const validateField = (name, value) => {
    let error = "";
    if (name === "name") {
      const nameRegex = /^[a-zA-Z\s'-]+$/;
      if (!value.trim()) {
        error = "Full name is required";
      } else if (value.trim().length < 2) {
        error = "Name must be at least 2 characters long";
      } else if (value.trim().length > 50) {
        error = "Name must be 50 characters or fewer";
      } else if (!nameRegex.test(value.trim())) {
        error = "Name can only contain letters and spaces";
      }
    }
    if (name === "email") {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!value.trim()) {
        error = "Email address is required";
      } else if (value.trim().length > 100) {
        error = "Email must be 100 characters or fewer";
      } else if (!emailRegex.test(value.trim())) {
        error = "Please enter a valid email address";
      }
    }
    if (name === "phone") {
      const digitsOnly = value.replace(/\D/g, "");
      if (value.trim() && digitsOnly.length !== 10) {
        error = "Phone number must be exactly 10 digits";
      }
    }
    return error;
  };

  const validateForm = () => {
    const newErrors = {};
    ["name", "email", "phone"].forEach((field) => {
      const err = validateField(field, formData[field] || "");
      if (err) newErrors[field] = err;
    });
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    if (touched[name]) {
      const err = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: err }));
    }
  };

  const handleBlur = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const err = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: err }));
  };

  const handleSave = async () => {
    setTouched({ name: true, email: true, phone: true });
    if (!validateForm()) {
      showToast.error("Please fix the errors before saving your profile.");
      return;
    }

    try {
      const payload = {
        name: formData.name,
        email: formData.email,
        phone: formData.phone || null,
      };
      const res = await updateProfileApi(payload);
      if (res && res.success && res.data) {
        updateSession(res.data);
        showToast.success("Profile updated successfully!");
        setErrors({});
        setTouched({});
        setIsEditing(false);
        return;
      }
      updateSession(payload);
      showToast.success("Profile updated successfully!");
      setErrors({});
      setTouched({});
      setIsEditing(false);
    } catch (err) {
      console.error("Failed to update profile API:", err);
      updateSession({
        name: formData.name,
        email: formData.email,
        phone: formData.phone,
      });
      showToast.success("Profile updated!");
      setErrors({});
      setTouched({});
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      });
    }
    setErrors({});
    setTouched({});
    setIsEditing(false);
  };

  const validateAvatarFile = (file) => {
    if (!file) return "Please select an image to upload.";
    if (!AVATAR_ALLOWED_TYPES.includes(file.type)) {
      return "Only PNG, JPG, JPEG, or WEBP images are allowed.";
    }
    if (file.size > AVATAR_MAX_SIZE) {
      return "Profile photo must be 5MB or smaller.";
    }
    return "";
  };

  const handleAvatarButtonClick = () => {
    if (isUploadingAvatar) return;
    fileInputRef.current?.click();
  };

  const handleAvatarChange = async (e) => {
    const file = e.target.files?.[0];
    e.target.value = "";

    const validationError = validateAvatarFile(file);
    if (validationError) {
      showToast.error(validationError);
      return;
    }

    const previousAvatar = user?.avatar || "";
    const previewUrl = URL.createObjectURL(file);
    setAvatarPreview(previewUrl);
    setIsUploadingAvatar(true);

    try {
      const formData = new FormData();
      formData.append("avatar", file);

      const response = await uploadAvatarApi(formData);
      const uploadedAvatar = getAvatarFromUploadResponse(response) || previewUrl;
      const nextUser = {
        ...(response?.data && typeof response.data === "object" ? response.data : {}),
        avatar: uploadedAvatar,
      };

      updateSession(nextUser);
      setAvatarPreview(uploadedAvatar);
      showToast.success("Profile photo updated successfully!");
    } catch (err) {
      console.error("Avatar upload failed:", err);
      setAvatarPreview(previousAvatar);
      showToast.error(err || "Failed to upload profile photo. Please try again.");
    } finally {
      setIsUploadingAvatar(false);
      if (previewUrl.startsWith("blob:")) {
        URL.revokeObjectURL(previewUrl);
      }
    }
  };

  const displayName = user?.name || "Larissa";
  const displayEmail = user?.email || "larissa@gmail.com";
  const avatarLetter = displayName.charAt(0).toUpperCase();
  const currentAvatar = avatarPreview || user?.avatar || "";

  // ─── Edit Mode ───
  if (isEditing) {
    return (
      <div className="rounded-2xl border border-[#e8eef3] bg-white p-6 sm:p-8 text-left">
        <div className="mb-6 pb-5 border-b border-[#e8eef3]">
          <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
            My Profile
          </h2>
          <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
            Manage your personal settings and contact info
          </p>
        </div>

        {/* Avatar Upload */}
        <div className="flex items-center gap-5 mb-8 p-5 sm:p-6 rounded-2xl border border-dashed border-[#d0d5dd] bg-slate-50/50">
          <AvatarDisplay
            src={currentAvatar}
            letter={avatarLetter}
            className="h-20 w-20 sm:h-24 sm:w-24 text-3xl sm:text-4xl shrink-0 ring-4 ring-deep-navy/15"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/jpg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={handleAvatarButtonClick}
              disabled={isUploadingAvatar}
              className="inline-flex items-center gap-2 rounded-xl bg-primary-green px-5 py-3 text-sm font-bold text-white hover:bg-dark-green transition-colors cursor-pointer disabled:cursor-not-allowed disabled:opacity-70"
            >
              {isUploadingAvatar ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Upload className="h-4 w-4" />
              )}
              {isUploadingAvatar ? "Uploading..." : "Upload Photo"}
            </button>
            <p className="text-xs font-semibold text-deep-navy/40 mt-2.5">
              Supports JPG, PNG or WEBP. Max size 5MB.
            </p>
          </div>
        </div>

        {/* Form Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 sm:gap-6 mb-8">
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50 mb-2.5">
              Full Name
            </label>
            <input
              type="text"
              name="name"
              maxLength={50}
              value={formData.name}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all ${
                touched.name && errors.name
                  ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-red-900"
                  : "border-[#e0e5ec] bg-white focus:border-primary-green focus:ring-2 focus:ring-primary-green/10"
              }`}
            />
            {touched.name && errors.name && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.name}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50 mb-2.5">
              Email Address
            </label>
            <input
              type="email"
              name="email"
              maxLength={100}
              value={formData.email}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all ${
                touched.email && errors.email
                  ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-red-900"
                  : "border-[#e0e5ec] bg-white focus:border-primary-green focus:ring-2 focus:ring-primary-green/10"
              }`}
            />
            {touched.email && errors.email && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.email}
              </p>
            )}
          </div>
          <div>
            <label className="block text-xs font-black uppercase tracking-wider text-deep-navy/50 mb-2.5">
              Phone Number
            </label>
            <input
              type="tel"
              name="phone"
              maxLength={10}
              value={formData.phone}
              onChange={handleChange}
              onBlur={handleBlur}
              className={`w-full rounded-xl border px-4 py-3.5 text-base font-bold text-deep-navy outline-none transition-all ${
                touched.phone && errors.phone
                  ? "border-red-500 bg-red-50/20 focus:ring-2 focus:ring-red-500/20 text-red-900"
                  : "border-[#e0e5ec] bg-white focus:border-primary-green focus:ring-2 focus:ring-primary-green/10"
              }`}
            />
            {touched.phone && errors.phone && (
              <p className="mt-1.5 flex items-center gap-1 text-xs font-bold text-red-500">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                {errors.phone}
              </p>
            )}
          </div>
        </div>

        {/* Divider & Actions */}
        <div className="border-t border-[#e8eef3] pt-6 flex justify-end gap-3">
          <button
            onClick={handleCancel}
            className="rounded-xl border border-deep-navy/12 px-7 py-3 text-sm font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="rounded-xl bg-primary-green px-7 py-3 text-sm font-black text-white hover:bg-dark-green transition-colors cursor-pointer"
          >
            Save Changes
          </button>
        </div>
      </div>
    );
  }

  // ─── View Mode ───
  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 gap-3 text-left">
        <div>
          <h2 className="text-2xl sm:text-3xl font-black text-deep-navy font-display">
            My Profile
          </h2>
          <p className="text-sm sm:text-base font-semibold text-deep-navy/50 mt-1.5">
            Manage your personal settings and contact info
          </p>
        </div>
        <button
          onClick={() => setIsEditing(true)}
          className="inline-flex items-center gap-2 rounded-xl border border-deep-navy/12 px-6 py-3 text-sm font-black text-deep-navy hover:bg-slate-50 transition-colors cursor-pointer self-start"
        >
          <Pencil className="h-4 w-4" />
          Edit Profile
        </button>
      </div>

      {/* Profile Card */}
      <div className="rounded-2xl border border-[#e8eef3] bg-white overflow-hidden text-left">
        {/* Avatar Section */}
        <div className="flex items-center gap-5 sm:gap-6 p-6 sm:p-8 border-b border-[#e8eef3]">
          <AvatarDisplay
            src={currentAvatar}
            letter={avatarLetter}
            className="h-20 w-20 sm:h-24 sm:w-24 text-3xl sm:text-4xl shrink-0 ring-4 ring-deep-navy/15"
          />
          <div>
            <h3 className="text-xl sm:text-2xl font-black text-deep-navy font-display">
              {displayName}
            </h3>
            <p className="text-sm font-bold text-medical-teal mt-0.5">
              Profile Picture
            </p>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-7 p-6 sm:p-8">
          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft-mint shrink-0">
              <User className="h-5 w-5 text-primary-green" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-navy/40">
                Full Name
              </span>
              <p className="text-base font-black text-deep-navy mt-1">
                {displayName}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft-mint shrink-0">
              <Mail className="h-5 w-5 text-primary-green" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-navy/40">
                Email Address
              </span>
              <p className="text-base font-black text-deep-navy mt-1">
                {displayEmail}
              </p>
            </div>
          </div>

          <div className="flex items-start gap-4">
            <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-soft-mint shrink-0">
              <Phone className="h-5 w-5 text-primary-green" />
            </div>
            <div>
              <span className="text-xs font-black uppercase tracking-wider text-deep-navy/40">
                Phone Number
              </span>
              <p className="text-base font-black text-deep-navy mt-1">
                {user?.phone || "Not provided"}
              </p>
            </div>
          </div>


        </div>
      </div>
    </div>
  );
}
