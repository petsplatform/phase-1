import React, { useContext, useState, useEffect } from "react";
import { User, Mail, Phone, Edit3, Check, X, Loader2, Camera, Trash2 } from "lucide-react";
import AccountLayout from "./AccountLayout";
import { AuthContext } from "../../context/AuthContext";
import { AppContext } from "../../context/AppContext";
import { accountApi } from "../../api/accountApi";

const Field = ({ label, value, icon: Icon }) => (
  <div className="flex flex-col gap-1">
    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">{label}</label>
    <div className="flex items-center gap-3 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl px-4 py-3">
      <Icon className="w-4 h-4 text-[#627D98] shrink-0" />
      <span className="text-sm font-semibold text-[#102A43]">{value || <span className="text-[#9FB3C8] font-normal italic">Not set</span>}</span>
    </div>
  </div>
);

const getInitials = (name = "", email = "") => {
  if (name.trim()) return name.trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();
  return (email[0] || "U").toUpperCase();
};

const MAX_AVATAR_SIZE = 5 * 1024 * 1024;
const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const ProfilePage = () => {
  const { user, updateUser } = useContext(AuthContext);
  const { addToast } = useContext(AppContext);
  const [editing, setEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isLoadingProfile, setIsLoadingProfile] = useState(false);
  const [errors, setErrors] = useState({});
  const [avatarError, setAvatarError] = useState("");
  const [avatarLoadError, setAvatarLoadError] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const [form, setForm] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
  });

  // Fetch initial profile from API on mount
  useEffect(() => {
    let isMounted = true;
    const fetchProfile = async () => {
      setIsLoadingProfile(true);
      try {
        const profileData = await accountApi.getProfile();
        if (isMounted && profileData) {
          const name = profileData.name || `${profileData.firstName || ""} ${profileData.lastName || ""}`.trim() || user?.name || "";
          const email = profileData.email || user?.email || "";
          const phone = profileData.phone || user?.phone || "";
          
          setForm({ name, email, phone });
          updateUser({ name, email, phone, avatar: profileData.avatar || null });
        }
      } catch (err) {
        addToast({ title: "Session Notice", message: "Please sign in again to manage your profile.", type: "error" });
      } finally {
        if (isMounted) setIsLoadingProfile(false);
      }
    };
    fetchProfile();
    return () => { isMounted = false; };
  }, []);

  const validateProfile = () => {
    const nextErrors = {};
    const nameVal = form.name.trim();
    if (!nameVal) {
      nextErrors.name = "Full name is required.";
    } else if (nameVal.length < 2 || nameVal.length > 50) {
      nextErrors.name = "Full name must be between 2 and 50 characters.";
    }

    const emailVal = form.email.trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!EMAIL_PATTERN.test(emailVal)) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (form.phone && form.phone.trim()) {
      const phoneDigits = form.phone.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        nextErrors.phone = "Phone number must be exactly 10 digits.";
      }
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateProfile()) {
      addToast({ title: "Validation Error", message: "Please correct the highlighted fields.", type: "error" });
      return;
    }

    setIsSaving(true);
    const updatedData = {
      name: form.name.trim(),
      email: form.email.trim(),
      phone: form.phone.trim(),
    };

    try {
      // Call update profile API endpoint
      const apiResponse = await accountApi.updateProfile(updatedData);
      
      const mergedUser = {
        ...updatedData,
        ...(apiResponse || {}),
      };

      updateUser(mergedUser);
      addToast({ title: "Profile Updated", message: "Your profile details have been saved to your account.", type: "cart" });
      setEditing(false);
    } catch (err) {
      addToast({ title: "Profile Update Failed", message: err?.message || "Unable to save profile. Please try again.", type: "error" });
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
    setErrors({});
    setEditing(false);
  };

  const handleAvatarChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    setAvatarError("");
    setAvatarLoadError(false);
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setAvatarError("Upload a JPG, PNG, or WebP image.");
      return;
    }

    if (file.size > MAX_AVATAR_SIZE) {
      setAvatarError("Avatar image must be 5MB or smaller.");
      return;
    }

    setIsUploadingAvatar(true);
    setUploadProgress(0);
    try {
      const profileData = await accountApi.uploadAvatar(file, (progressEvent) => {
        if (!progressEvent.total) return;
        setUploadProgress(Math.round((progressEvent.loaded * 100) / progressEvent.total));
      });
      updateUser({ avatar: profileData.avatar || null });
      setAvatarLoadError(false);
      addToast({ title: "Avatar Updated", message: "Your profile photo has been saved.", type: "cart" });
    } catch (err) {
      setAvatarError(err?.message || "Avatar upload failed. Please try again.");
      addToast({ title: "Avatar Upload Failed", message: "Could not upload your profile photo.", type: "error" });
    } finally {
      setIsUploadingAvatar(false);
      setUploadProgress(0);
    }
  };

  const handleRemoveAvatar = async () => {
    setAvatarError("");
    setIsUploadingAvatar(true);
    try {
      const profileData = await accountApi.removeAvatar();
      updateUser({ avatar: profileData.avatar || null });
      setAvatarLoadError(false);
      addToast({ title: "Avatar Removed", message: "Your profile photo has been removed.", type: "wishlist" });
    } catch (err) {
      setAvatarError(err?.message || "Unable to remove avatar. Please try again.");
      addToast({ title: "Remove Avatar Failed", message: "Could not remove your profile photo.", type: "error" });
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  const initials = getInitials(user?.name, user?.email);
  const avatarUrl = avatarLoadError ? null : user?.avatar;

  return (
    <AccountLayout title="My Profile" subtitle="Manage your personal information and contact details.">
      <div className="bg-white border border-[#D9E8F2] rounded-2xl shadow-sm">

        {/* Top gradient banner — taller so avatar overlap works */}
        <div className="relative h-32 bg-gradient-to-r from-[#0B2D4F] via-[#0874C9] to-[#18A9E5] rounded-t-2xl overflow-hidden">
          {/* Subtle decorative cross pattern */}
          <div className="absolute inset-0 opacity-5 pointer-events-none select-none overflow-hidden">
            <svg viewBox="0 0 400 128" className="w-full h-full" preserveAspectRatio="xMidYMid slice">
              {[...Array(6)].map((_, i) => (
                <g key={i} transform={`translate(${i * 70 + 20}, 30)`} fill="white">
                  <path d="M10 4h4v4h4v4h-4v4h-4v-4H6v-4h4z"/>
                </g>
              ))}
            </svg>
          </div>

          {/* Edit Profile button — top right of banner */}
          {!editing && (
            <button
              onClick={() => {
                setForm({ name: user?.name || "", email: user?.email || "", phone: user?.phone || "" });
                setEditing(true);
              }}
              disabled={isLoadingProfile}
              className="absolute top-4 right-4 flex items-center gap-2 bg-[#0874C9] hover:bg-[#F28C18] text-white text-xs font-bold px-4 py-2 rounded-xl transition-all duration-300 cursor-pointer shadow-md border border-white/20 disabled:opacity-50"
            >
              {isLoadingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Edit3 className="w-3.5 h-3.5" />}
              Edit Profile
            </button>
          )}
        </div>

        {/* Avatar row — overlapping banner with z-index above banner */}
        <div className="px-6 sm:px-8 relative z-10">
          <div className="flex items-end justify-between gap-4" style={{ marginTop: "-2.75rem" }}>
            {/* Avatar */}
            <div className="flex items-end gap-4">
              <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-[#0874C9] to-[#0B2D4F] border-4 border-white shadow-xl flex items-center justify-center shrink-0 overflow-hidden">
                {avatarUrl ? (
                  <img
                    src={avatarUrl}
                    alt="Profile avatar"
                    className="w-full h-full object-cover"
                    onError={() => {
                      setAvatarLoadError(true);
                      setAvatarError("Avatar image could not be displayed. Showing initials instead.");
                    }}
                  />
                ) : (
                  <span className="text-2xl font-black text-white select-none">{initials}</span>
                )}
              </div>
              <div className="flex flex-col gap-2 pb-1">
                <div className="flex flex-wrap items-center gap-2">
                  <label className={`inline-flex items-center gap-2 bg-white border border-[#D9E8F2] hover:border-[#0874C9] text-[#0874C9] font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer shadow-sm ${isUploadingAvatar ? "opacity-60 pointer-events-none" : ""}`}>
                    {isUploadingAvatar ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                    {avatarUrl ? "Change Avatar" : "Upload Avatar"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      className="sr-only"
                      onChange={handleAvatarChange}
                      disabled={isUploadingAvatar}
                    />
                  </label>
                  {avatarUrl && (
                    <button
                      type="button"
                      onClick={handleRemoveAvatar}
                      disabled={isUploadingAvatar}
                      className="inline-flex items-center gap-2 border border-red-100 text-red-500 hover:bg-red-50 font-bold text-xs px-3 py-2 rounded-xl transition-all cursor-pointer disabled:opacity-60"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> Remove Avatar
                    </button>
                  )}
                </div>
                {isUploadingAvatar && uploadProgress > 0 && (
                  <div className="w-44 h-1.5 bg-[#D9E8F2] rounded-full overflow-hidden">
                    <div className="h-full bg-[#0874C9] transition-all" style={{ width: `${uploadProgress}%` }} />
                  </div>
                )}
                {avatarError && <p className="text-[11px] font-semibold text-red-500">{avatarError}</p>}
              </div>
            </div>
          </div>

          {/* Name row below avatar */}
          <div className="mt-3 mb-5">
            <h3 className="text-base font-black text-[#102A43]">{user?.name || "Account User"}</h3>
            <p className="text-xs text-[#627D98] font-medium mt-0.5">{user?.email}</p>
          </div>

          {editing ? (
            <div className="flex flex-col gap-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {[
                  { label: "Full Name", key: "name", icon: User, type: "text", placeholder: "Dr. Jane Doe" },
                  { label: "Email Address", key: "email", icon: Mail, type: "email", placeholder: "jane@vetclinic.com" },
                  { label: "Phone Number", key: "phone", icon: Phone, type: "tel", placeholder: "+1 (555) 000-0000" },
                ].map(({ label, key, icon: Icon, type, placeholder }) => (
                  <div key={key} className="flex flex-col gap-1.5">
                    <label className="text-[10px] font-black uppercase tracking-widest text-[#9FB3C8]">{label}</label>
                    <div className="flex items-center gap-3 bg-[#F7FAFC] border border-[#D9E8F2] focus-within:border-[#0874C9] focus-within:ring-2 focus-within:ring-[#0874C9]/20 rounded-xl px-4 py-3 transition-all">
                      <Icon className="w-4 h-4 text-[#627D98] shrink-0" />
                      <input
                        type={type}
                        value={form[key]}
                        onChange={e => {
                          setForm(f => ({ ...f, [key]: e.target.value }));
                          setErrors(prev => ({ ...prev, [key]: "" }));
                        }}
                        placeholder={placeholder}
                        disabled={isSaving}
                        className="flex-1 bg-transparent text-sm font-semibold text-[#102A43] outline-none placeholder:text-[#9FB3C8] placeholder:font-normal disabled:opacity-60"
                      />
                    </div>
                    {errors[key] && <p className="text-[11px] font-semibold text-red-500">{errors[key]}</p>}
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2">
                <button
                  onClick={handleSave}
                  disabled={isSaving}
                  className="flex items-center gap-2 bg-[#0874C9] hover:bg-[#0B2D4F] text-white font-bold text-sm px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer shadow-sm disabled:opacity-50"
                >
                  {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  {isSaving ? "Saving..." : "Save Changes"}
                </button>
                <button
                  onClick={handleCancel}
                  disabled={isSaving}
                  className="flex items-center gap-2 border border-[#D9E8F2] text-[#627D98] hover:text-[#102A43] hover:border-[#9FB3C8] font-bold text-sm px-6 py-3 rounded-xl transition-all duration-300 cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" /> Cancel
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Full Name" value={user?.name} icon={User} />
              <Field label="Email Address" value={user?.email} icon={Mail} />
              <Field label="Phone Number" value={user?.phone} icon={Phone} />
            </div>
          )}
          <div className="pb-6" />
        </div>
      </div>
    </AccountLayout>
  );
};

export default ProfilePage;
