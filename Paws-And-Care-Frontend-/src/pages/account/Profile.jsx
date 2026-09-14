import { useState, useEffect } from "react";
import AccountSidebar from "../../components/account/AccountSidebar";
import { useAuth } from "../../context/AuthContext";
import { ShieldCheck, Check, Loader2 } from "lucide-react";

const AVATAR_TYPES = ["image/jpeg", "image/png", "image/webp"];
const AVATAR_MAX_SIZE = 5 * 1024 * 1024;

export default function Profile() {
  const { user, updateProfile, uploadAvatar, removeAvatar } = useAuth();

  const activeUser = user || {
    firstName: "Guest",
    lastName: "Pet Parent",
    email: "guest@pawsandcare.com",
    mobile: "9876543210",
  };

  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    mobile: "",
    avatar: "",
  });
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarRemoved, setAvatarRemoved] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (activeUser) {
      setFormData({
        firstName: activeUser.firstName || "",
        lastName: activeUser.lastName || "",
        email: activeUser.email || "",
        mobile: activeUser.mobile || "",
        avatar: activeUser.avatar || "",
      });
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    setSuccess(false);
    setError("");
    if (!file) return;

    if (!AVATAR_TYPES.includes(file.type)) {
      setError("Upload a JPEG, PNG, or WEBP image.");
      e.target.value = "";
      return;
    }
    if (file.size > AVATAR_MAX_SIZE) {
      setError("Image file size must be 5 MB or smaller.");
      e.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setFormData((prev) => ({
        ...prev,
        avatar: reader.result,
      }));
    };
    setAvatarFile(file);
    setAvatarRemoved(false);
    reader.readAsDataURL(file);
  };

  const handleRemoveAvatar = () => {
    setSuccess(false);
    setError("");
    setAvatarFile(null);
    setAvatarRemoved(true);
    setFormData((prev) => ({
      ...prev,
      avatar: "",
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSuccess(false);
    setError("");

    const fn = (formData.firstName || "").trim();
    const ln = (formData.lastName || "").trim();
    const em = (formData.email || "").trim();
    const mobDigits = (formData.mobile || "").replace(/\D/g, "");

    if (fn.length < 2 || fn.length > 50) {
      setError("First name must be between 2 and 50 characters.");
      return;
    }
    if (ln.length < 2 || ln.length > 50) {
      setError("Last name must be between 2 and 50 characters.");
      return;
    }
    if (!em || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(em) || em.length > 100) {
      setError("Please enter a valid email address (max 100 characters).");
      return;
    }
    if (mobDigits.length !== 10) {
      setError("Mobile phone number must be exactly 10 digits.");
      return;
    }

    setIsSaving(true);
    try {
      await updateProfile(formData);
      if (avatarRemoved) {
        await removeAvatar();
        setAvatarRemoved(false);
      } else if (avatarFile) {
        await uploadAvatar(avatarFile);
        setAvatarFile(null);
      }
      setSuccess(true);
      setTimeout(() => setSuccess(false), 2500);
    } catch (saveError) {
      setError(
        saveError?.message || "Profile could not be updated. Please try again.",
      );
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="bg-brand-bg min-h-screen pb-16 font-sans">
      <div className="max-w-[1440px] mx-auto px-4 sm:px-6 lg:px-12 pt-8 text-left">
        <div className="flex flex-col lg:flex-row gap-8 items-start">
          <AccountSidebar />

          <div className="flex-1 space-y-6">
            <div className="border-b border-brand-border/40 pb-3">
              <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text">
                Profile Settings
              </h1>
              <p className="font-sans text-xs sm:text-sm text-brand-muted mt-1">
                Manage your verification details, names, and contact parameters.
              </p>
            </div>

            <div className="bg-brand-surface border border-brand-border/60 p-6 sm:p-8 rounded-[2rem] shadow-sm max-w-2xl">
              <form onSubmit={handleSubmit} noValidate className="space-y-6">
                {success && (
                  <div className="bg-brand-teal/10 border border-brand-teal/20 text-brand-teal rounded-2xl p-4 flex gap-2 text-xs font-heading font-bold">
                    <Check size={16} />
                    <span>
                      Your profile details have been updated successfully!
                    </span>
                  </div>
                )}

                {error && (
                  <div className="bg-brand-coral/10 border border-brand-coral/20 text-brand-coral rounded-2xl p-4 text-xs font-heading font-bold">
                    {error}
                  </div>
                )}

                {/* Profile Picture Upload Section */}
                <div className="flex flex-col sm:flex-row items-center gap-6 pb-6 border-b border-brand-border/40">
                  <div className="relative w-20 h-20 sm:w-24 sm:h-24 shrink-0">
                    <div className="w-full h-full rounded-full border-2 border-brand-teal/20 overflow-hidden bg-brand-bg/30 flex items-center justify-center shadow-xs">
                      {formData.avatar ? (
                        <img
                          src={formData.avatar}
                          alt="Avatar Preview"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="w-full h-full bg-brand-teal text-white flex items-center justify-center font-heading font-black text-3xl uppercase">
                          {formData.firstName
                            ? formData.firstName.charAt(0)
                            : "U"}
                        </div>
                      )}
                    </div>
                  </div>

                  <div className="flex-1 flex flex-col items-center sm:items-start gap-2.5 text-center sm:text-left">
                    <div>
                      <span className="block text-xs font-heading font-black text-brand-text uppercase tracking-wide">
                        Profile Photo
                      </span>
                      <p className="text-[11px] text-brand-muted mt-0.5 max-w-sm">
                        Upload a square JPG, PNG, or WebP photo of yourself. Max
                        file size: 5MB.
                      </p>
                    </div>

                    <div className="flex items-center gap-2">
                      <label className="px-4 py-2 bg-brand-teal hover:bg-brand-deep-teal text-white text-xs font-heading font-black rounded-xl cursor-pointer transition-all shadow-xs active:scale-95 inline-flex items-center gap-1.5 select-none">
                        <span>Upload Photo</span>
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp"
                          className="hidden"
                          disabled={isSaving}
                          onChange={handleAvatarChange}
                        />
                      </label>

                      {formData.avatar && (
                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          disabled={isSaving}
                          className="px-4 py-2 bg-brand-coral/10 hover:bg-brand-coral/20 text-brand-coral text-xs font-heading font-black rounded-xl transition-all active:scale-95 cursor-pointer"
                        >
                          Remove Photo
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="firstName"
                      className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide"
                    >
                      First Name
                    </label>
                    <input
                      type="text"
                      id="firstName"
                      value={formData.firstName}
                      onChange={(e) =>
                        setFormData({ ...formData, firstName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="lastName"
                      className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide"
                    >
                      Last Name
                    </label>
                    <input
                      type="text"
                      id="lastName"
                      value={formData.lastName}
                      onChange={(e) =>
                        setFormData({ ...formData, lastName: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="email"
                      className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide"
                    >
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData({ ...formData, email: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white text-sm transition-all"
                    />
                  </div>

                  <div className="space-y-1.5 text-left">
                    <label
                      htmlFor="mobile"
                      className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide"
                    >
                      Mobile Number
                    </label>
                    <input
                      type="tel"
                      id="mobile"
                      value={formData.mobile}
                      onChange={(e) =>
                        setFormData({ ...formData, mobile: e.target.value })
                      }
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white text-sm transition-all"
                    />
                  </div>
                </div>

                <div className="bg-brand-bg/50 p-4 rounded-xl border border-brand-border/40 flex items-center gap-2.5 text-[10px] text-brand-muted text-left">
                  <ShieldCheck size={16} className="text-brand-teal shrink-0" />
                  <span>
                    Verified contact info is required to receive shipping alerts
                    and login dynamically via OTP code.
                  </span>
                </div>

                <div className="pt-4 border-t border-brand-border/40 text-left">
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="inline-flex items-center gap-2 px-6 py-3 bg-brand-teal hover:bg-brand-deep-teal disabled:bg-brand-muted/60 disabled:cursor-not-allowed text-white rounded-full font-heading font-black text-sm transition-all shadow-md active:scale-95 cursor-pointer"
                  >
                    {isSaving && <Loader2 size={16} className="animate-spin" />}
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
