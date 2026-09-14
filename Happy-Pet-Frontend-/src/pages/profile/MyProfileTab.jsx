import { useRef } from "react";
import {
  User,
  Mail,
  Phone,
  Calendar,
  Edit2,
  CheckCircle2,
  Upload,
  Trash2,
} from "lucide-react";

export default function MyProfileTab({
  currentUser,
  isEditing,
  setIsEditing,
  formData,
  setFormData,
  updateUser,
  uploadAvatar,
  removeAvatar,
  toast,
}) {
  const pendingAvatarUpload = useRef(null);
  const latestUploadedAvatar = useRef(null);
  const avatarRemoved = useRef(false);

  const handleAvatarChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const allowedTypes = ["image/jpeg", "image/png", "image/webp"];
      if (!allowedTypes.includes(file.type)) {
        toast.error("Please upload a JPG, PNG, or WEBP image.");
        e.target.value = "";
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error("Image size must be less than 5MB.");
        e.target.value = "";
        return;
      }
      try {
        const uploadPromise = uploadAvatar(file);
        pendingAvatarUpload.current = uploadPromise;
        const updatedUser = await uploadPromise;
        latestUploadedAvatar.current = updatedUser?.avatar || null;
        avatarRemoved.current = false;
        setFormData((prev) => ({
          ...prev,
          avatar: updatedUser?.avatar || prev.avatar,
        }));
        toast.success("Profile photo updated successfully.");
      } catch (error) {
        toast.error(
          error.response?.data?.message ||
            "Profile photo could not be uploaded. Please try again.",
        );
      } finally {
        pendingAvatarUpload.current = null;
        e.target.value = "";
      }
    }
  };

  const handleAvatarRemove = () => {
    avatarRemoved.current = true;
    latestUploadedAvatar.current = null;
    setFormData((prev) => ({
      ...prev,
      avatar: null,
    }));
    toast.success("Image removed. Remember to save changes! 🗑️");
  };

  return (
    <div className="animate-in fade-in duration-300 flex-grow flex flex-col justify-between">
      <div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-brand-purple/5 pb-5 mb-8">
          <div className="text-left">
            <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
              My Profile
            </h2>
            <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
              Manage your personal settings and contact info
            </p>
          </div>

          {isEditing ? (
            <div className="flex gap-2">
              <button
                type="button"
                onClick={async () => {
                  const nameVal = String(formData.name || "").trim();
                  const emailVal = String(formData.email || "").trim();
                  const phoneDigits = String(formData.phone || "").replace(/\D/g, "");

                  if (!nameVal) {
                    toast.error("Full name is required.");
                    return;
                  }
                  if (nameVal.length < 2 || nameVal.length > 50) {
                    toast.error("Full name must be between 2 and 50 characters.");
                    return;
                  }

                  if (!emailVal) {
                    toast.error("Email address is required.");
                    return;
                  }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
                    toast.error("Please enter a valid email address.");
                    return;
                  }
                  if (emailVal.length > 100) {
                    toast.error("Email address must not exceed 100 characters.");
                    return;
                  }

                  if (formData.phone && phoneDigits.length !== 10) {
                    toast.error("Phone number must be exactly 10 digits.");
                    return;
                  }

                  try {
                    let payload = {
                      name: nameVal,
                      email: emailVal,
                      phone: formData.phone,
                      dob: formData.dob,
                    };
                    if (pendingAvatarUpload.current) {
                      await pendingAvatarUpload.current;
                    }
                    if (avatarRemoved.current) {
                      await removeAvatar();
                      latestUploadedAvatar.current = null;
                      avatarRemoved.current = false;
                    }
                    await updateUser(payload);
                    toast.success("Profile saved successfully!");
                  } catch (error) {
                    toast.error(
                      error.response?.data?.message ||
                        "Profile could not be saved.",
                    );
                    return;
                  }
                  setIsEditing(false);
                  return;
                  /*
                  toast.success("Profile saved successfully! ✨");
                  */
                }}
                className="px-5 py-2.5 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-full text-xs transition-all shadow-sm cursor-pointer"
              >
                Save
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditing(false);
                }}
                className="px-5 py-2.5 border border-gray-200 text-brand-purple font-bold rounded-full text-xs bg-white hover:bg-gray-50 transition-all cursor-pointer"
              >
                Cancel
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => setIsEditing(true)}
              className="self-start sm:self-center inline-flex items-center gap-1.5 px-5 py-2.5 border border-gray-200 text-xs font-bold rounded-full hover:bg-gray-50 transition-all text-brand-purple bg-white cursor-pointer"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span>Edit Profile</span>
            </button>
          )}
        </div>

        {/* Profile Picture Section */}
        <div className="border border-gray-200 rounded-[20px] p-6 sm:p-8 mb-6 text-left bg-white flex flex-col sm:flex-row items-center gap-6">
          <div className="relative group">
            {formData.avatar ? (
              <img
                src={formData.avatar}
                alt="Profile Avatar"
                className="w-24 h-24 rounded-full object-cover border-2 border-brand-purple/20 shadow-md"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-[#EAE5F8] text-[#5C3EBA] font-extrabold flex items-center justify-center text-3xl shadow-md border-2 border-[#EAE5F8]">
                {formData.name ? formData.name[0].toUpperCase() : "P"}
              </div>
            )}

            {/* Camera Overlay when editing */}
            {isEditing && (
              <label
                htmlFor="avatar-upload-overlay"
                className="absolute inset-0 bg-black/40 hover:bg-black/50 text-white rounded-full flex flex-col items-center justify-center gap-1 cursor-pointer transition-all opacity-0 group-hover:opacity-100"
              >
                <Upload className="w-5 h-5" />
                <span className="text-[10px] font-bold">Change</span>
              </label>
            )}
            <input
              type="file"
              id="avatar-upload-overlay"
              accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
          </div>

          <div className="flex-grow text-center sm:text-left">
            <h3 className="text-sm font-extrabold text-brand-purple">
              Profile Picture
            </h3>
            <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
              Add a personal touch to your account. PNG, JPG or GIF. Max 2MB.
            </p>
            {isEditing && (
              <div className="flex flex-wrap justify-center sm:justify-start gap-2.5 mt-3.5">
                <label
                  htmlFor="avatar-upload-btn"
                  className="px-4 py-2 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-full text-xs transition-all shadow-sm cursor-pointer inline-flex items-center gap-1.5 animate-in fade-in duration-200"
                >
                  <Upload className="w-3.5 h-3.5" />
                  <span>
                    {formData.avatar ? "Change Photo" : "Upload Photo"}
                  </span>
                </label>
                <input
                  type="file"
                  id="avatar-upload-btn"
                  accept=".jpg,.jpeg,.png,.webp,image/jpeg,image/png,image/webp"
                  onChange={handleAvatarChange}
                  className="hidden"
                />
                {formData.avatar && (
                  <button
                    type="button"
                    onClick={handleAvatarRemove}
                    className="px-4 py-2 border border-red-200 text-red-500 font-bold rounded-full text-xs bg-white hover:bg-red-50 transition-all cursor-pointer inline-flex items-center gap-1.5 animate-in fade-in duration-200"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Remove</span>
                  </button>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Combined bordered grid container */}
        <div className="border border-gray-200 rounded-[20px] p-6 sm:p-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-8 mb-8 text-left bg-white">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EAE5F8]/40 flex items-center justify-center text-[#5C3EBA] flex-shrink-0">
              <User className="w-4.5 h-4.5" />
            </div>
            <div className="flex-grow">
              <p className="text-[10px] font-extrabold text-brand-purple/55 uppercase tracking-wider">
                Full Name
              </p>
              {isEditing ? (
                <input
                  type="text"
                  minLength={2}
                  maxLength={50}
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="w-full mt-1.5 px-3 py-2 bg-[#FCF9F6] border border-brand-purple/10 focus:border-brand-purple/45 rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all"
                />
              ) : (
                <p className="text-sm font-bold text-brand-purple mt-0.5">
                  {currentUser.name}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EAE5F8]/40 flex items-center justify-center text-[#5C3EBA] flex-shrink-0">
              <Mail className="w-4.5 h-4.5" />
            </div>
            <div className="flex-grow overflow-hidden">
              <p className="text-[10px] font-extrabold text-brand-purple/55 uppercase tracking-wider">
                Email Address
              </p>
              {isEditing ? (
                <input
                  type="email"
                  maxLength={100}
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="w-full mt-1.5 px-3 py-2 bg-[#FCF9F6] border border-brand-purple/10 focus:border-brand-purple/45 rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all"
                />
              ) : (
                <p className="text-sm font-bold text-brand-purple mt-0.5 truncate">
                  {currentUser.email}
                </p>
              )}
            </div>
          </div>

          <div className="flex items-center gap-4">
            <div className="w-10 h-10 rounded-full bg-[#EAE5F8]/40 flex items-center justify-center text-[#5C3EBA] flex-shrink-0">
              <Phone className="w-4.5 h-4.5" />
            </div>
            <div className="flex-grow">
              <p className="text-[10px] font-extrabold text-brand-purple/55 uppercase tracking-wider">
                Phone Number
              </p>
              {isEditing ? (
                <input
                  type="tel"
                  maxLength={10}
                  value={formData.phone || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, phone: e.target.value.replace(/\D/g, "").slice(0, 10) })
                  }
                  className="w-full mt-1.5 px-3 py-2 bg-[#FCF9F6] border border-brand-purple/10 focus:border-brand-purple/45 rounded-xl text-brand-purple text-xs font-semibold outline-none transition-all"
                />
              ) : (
                <p className="text-sm font-bold text-brand-purple mt-0.5">
                  {currentUser.phone || "+1 (555) 123-4567"}
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
