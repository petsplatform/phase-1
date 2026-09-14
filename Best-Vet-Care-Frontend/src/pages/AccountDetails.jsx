import { useEffect, useState } from "react";
import AccountLayout from "../components/account/AccountLayout";
import { accountApi } from "../api/accountApi";
import { authApi } from "../api/authApi";
import { useToast } from "../context/ToastContext";
import ConfirmModal from "../components/common/ConfirmModal";

const API_ORIGIN = (import.meta.env.VITE_API_URL || "http://localhost:5000/api").replace(/\/api\/?$/, "");

const resolveAvatarUrl = (avatar) => {
  if (!avatar) return "";
  if (/^https?:\/\//i.test(avatar)) return avatar;
  return `${API_ORIGIN}${avatar.startsWith("/") ? "" : "/"}${avatar}`;
};

const getProfileInitial = (form) => {
  const source = form.firstName || form.email || "U";
  return source.trim().charAt(0).toUpperCase() || "U";
};

const MAX_AVATAR_SIZE_BYTES = 5 * 1024 * 1024;
const ALLOWED_AVATAR_TYPES = new Set(["image/jpeg", "image/png", "image/webp"]);

const validateAvatarFile = (file) => {
  if (!file) return "Please select an image file";
  if (!ALLOWED_AVATAR_TYPES.has(file.type)) {
    return "Please upload a JPG, PNG, or WEBP image";
  }
  if (file.size > MAX_AVATAR_SIZE_BYTES) {
    return "Profile photo must be 5MB or smaller";
  }
  return "";
};

const FIELD_CONFIGS = [
  { name: "firstName", label: "First name *", hint: "Min 2, Max 50 chars", type: "text", maxLength: 50 },
  { name: "lastName", label: "Last name *", hint: "Min 2, Max 50 chars", type: "text", maxLength: 50 },
  { name: "email", label: "Email *", hint: "Valid email", type: "email", maxLength: 100 },
  { name: "phone", label: "Phone", hint: "Exact 10 digits", type: "tel", maxLength: 10 },
];

const AccountDetails = () => {
  const { showToast } = useToast();
  const [form, setForm] = useState({ firstName: "", lastName: "", email: "", phone: "", avatar: "" });
  const [errors, setErrors] = useState({});
  const [vetVerification, setVetVerification] = useState(null);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [confirmRemoveAvatar, setConfirmRemoveAvatar] = useState(false);
  const [passwordStatus, setPasswordStatus] = useState({ hasPassword: false });
  const [passwordForm, setPasswordForm] = useState({ currentPassword: "", newPassword: "", confirmPassword: "" });
  const [passwordError, setPasswordError] = useState("");
  const [savingPassword, setSavingPassword] = useState(false);
  const [showSecurityPassword, setShowSecurityPassword] = useState(false);

  useEffect(() => {
    accountApi
      .getProfile()
      .then((profile) => {
        setForm({
          firstName: profile.firstName || "",
          lastName: profile.lastName || "",
          email: profile.email || "",
          phone: profile.phone || "",
          avatar: profile.avatar || "",
        });
        setVetVerification(profile.vetVerification || null);
        setPasswordStatus({ hasPassword: Boolean(profile.hasPassword) });
      })
      .catch((error) => showToast(error.response?.data?.message || "Could not load profile", "error"));
    authApi.getPasswordStatus()
      .then(setPasswordStatus)
      .catch(() => {});
  }, [showToast]);

  const updateField = (event) => {
    const { name, value } = event.target;
    const nextValue = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setForm((current) => ({ ...current, [name]: nextValue }));
    if (errors[name]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[name];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};

    const fn = String(form.firstName || "").trim();
    if (!fn) {
      nextErrors.firstName = "First name is required.";
    } else if (fn.length < 2) {
      nextErrors.firstName = "First name must be at least 2 characters.";
    } else if (fn.length > 50) {
      nextErrors.firstName = "First name must not exceed 50 characters.";
    }

    const ln = String(form.lastName || "").trim();
    if (!ln) {
      nextErrors.lastName = "Last name is required.";
    } else if (ln.length < 2) {
      nextErrors.lastName = "Last name must be at least 2 characters.";
    } else if (ln.length > 50) {
      nextErrors.lastName = "Last name must not exceed 50 characters.";
    }

    const emailVal = String(form.email || "").trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    const phoneDigits = String(form.phone || "").replace(/\D/g, "");
    if (phoneDigits && phoneDigits.length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const applyProfile = (profile) => {
    setForm({
      firstName: profile.firstName || "",
      lastName: profile.lastName || "",
      email: profile.email || "",
      phone: profile.phone || "",
      avatar: profile.avatar || "",
    });
    authApi.storeCustomer(profile);
    setVetVerification(profile.vetVerification || vetVerification);
  };

  const updateAvatar = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const validationMessage = validateAvatarFile(file);
    if (validationMessage) {
      showToast(validationMessage, "error");
      event.target.value = "";
      return;
    }

    setUploadingAvatar(true);
    try {
      const profile = await accountApi.uploadAvatar(file);
      applyProfile(profile);
      showToast("Profile photo updated");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not update profile photo", "error");
    } finally {
      setUploadingAvatar(false);
      event.target.value = "";
    }
  };

  const removeAvatar = async () => {
    setUploadingAvatar(true);
    try {
      const profile = await accountApi.updateProfile({ avatar: null });
      applyProfile(profile);
      setConfirmRemoveAvatar(false);
      showToast("Profile photo removed");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not remove profile photo", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  const saveProfile = async (event) => {
    event.preventDefault();

    if (!validate()) {
      showToast("Please fix errors before saving", "warning");
      return;
    }

    setSaving(true);
    try {
      const profile = await accountApi.updateProfile({
        ...form,
        phone: form.phone.trim(),
      });
      applyProfile(profile);
      setErrors({});
      showToast("Account details updated");
    } catch (error) {
      showToast(error.response?.data?.message || "Could not update account details", "error");
    } finally {
      setSaving(false);
    }
  };

  const updatePasswordField = (event) => {
    const { name, value } = event.target;
    setPasswordForm((current) => ({ ...current, [name]: value }));
    if (passwordError) setPasswordError("");
  };

  const validatePasswordForm = () => {
    if (passwordStatus.hasPassword && !passwordForm.currentPassword) {
      setPasswordError("Current password is required.");
      return false;
    }
    if (passwordForm.newPassword.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      return false;
    }
    if (!/[a-z]/.test(passwordForm.newPassword) || !/[A-Z]/.test(passwordForm.newPassword) || !/\d/.test(passwordForm.newPassword)) {
      setPasswordError("Password must include uppercase, lowercase, and number characters.");
      return false;
    }
    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setPasswordError("Passwords do not match.");
      return false;
    }
    setPasswordError("");
    return true;
  };

  const savePassword = async (event) => {
    event.preventDefault();
    if (!validatePasswordForm()) return;
    setSavingPassword(true);
    try {
      const data = passwordStatus.hasPassword
        ? await authApi.changePassword({
            currentPassword: passwordForm.currentPassword,
            newPassword: passwordForm.newPassword,
            confirmPassword: passwordForm.confirmPassword,
          })
        : await authApi.setPassword({
            password: passwordForm.newPassword,
            confirmPassword: passwordForm.confirmPassword,
          });
      setPasswordStatus(data);
      setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
      showToast(passwordStatus.hasPassword ? "Password changed successfully" : "Password created successfully");
    } catch (error) {
      setPasswordError(error.response?.data?.message || error.message || "Could not save password");
    } finally {
      setSavingPassword(false);
    }
  };

  return (
    <AccountLayout title="Login & Security" description="Keep your profile, contact information, password, and account access up to date.">
      <form onSubmit={saveProfile} noValidate className="max-w-3xl rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
        <div className="mb-6 rounded-xl border border-[#17345f1a] bg-white p-4 text-left">
          <p className="text-xs font-extrabold uppercase text-[#122a50b2]">Vet Verification Status</p>
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <p className="text-sm font-bold text-[#122a50]">Status: {vetVerification?.status || "Not Submitted"}</p>
            <p className="text-sm font-bold text-[#122a50]">Verified Date: {vetVerification?.verifiedAt ? new Date(vetVerification.verifiedAt).toLocaleDateString() : "N/A"}</p>
            <p className="text-sm font-bold text-[#122a50]">License Expiry: {vetVerification?.licenseExpiry ? new Date(vetVerification.licenseExpiry).toLocaleDateString() : "N/A"}</p>
          </div>
        </div>

        <div className="mb-6 flex flex-col gap-4 rounded-xl bg-[#fffaf0] p-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-center gap-4 text-left">
            {form.avatar ? (
              <img
                src={resolveAvatarUrl(form.avatar)}
                alt={`${form.firstName || "Customer"} profile`}
                className="h-20 w-20 rounded-full border-4 border-white object-cover shadow-sm"
              />
            ) : (
              <span className="flex h-20 w-20 items-center justify-center rounded-full border-4 border-white bg-[#17345f] text-3xl font-extrabold text-white shadow-sm">
                {getProfileInitial(form)}
              </span>
            )}
            <div>
              <p className="text-sm font-extrabold text-[#122a50]">Profile picture</p>
              <p className="mt-1 text-xs font-semibold leading-5 text-[#122a50b2]">Upload a clear photo for your account.</p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            <label className="inline-flex cursor-pointer items-center justify-center rounded-lg bg-[#17345f] px-4 py-2.5 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]">
              {uploadingAvatar ? "Uploading..." : form.avatar ? "Change Photo" : "Upload Photo"}
              <input type="file" accept="image/*" onChange={updateAvatar} disabled={uploadingAvatar} className="sr-only" />
            </label>
            {form.avatar && (
              <button
                type="button"
                onClick={() => setConfirmRemoveAvatar(true)}
                disabled={uploadingAvatar}
                className="rounded-lg border border-red-200 px-4 py-2.5 text-sm font-extrabold text-red-600 transition-colors hover:bg-red-50 disabled:opacity-60 cursor-pointer"
              >
                Remove
              </button>
            )}
          </div>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          {FIELD_CONFIGS.map(({ name, label, hint, type, maxLength }) => (
            <label key={name} className="block text-left">
              <div className="mb-1 flex items-center justify-between">
                <span className="text-xs font-extrabold uppercase text-[#122a50b2]">{label}</span>
                {hint && <span className="text-[10px] font-semibold text-[#122a50]/50">{hint}</span>}
              </div>
              <input
                name={name}
                value={form[name]}
                onChange={updateField}
                type={type}
                inputMode={name === "phone" ? "numeric" : undefined}
                maxLength={maxLength}
                className={`mt-1 h-12 w-full rounded-lg border px-3 text-sm font-semibold text-[#122a50] outline-none ${
                  errors[name] ? "border-red-300 bg-red-50" : "border-[#17345f1a] focus:border-[#d9aa3d]"
                }`}
              />
              {errors[name] && <p className="mt-1 text-xs font-semibold text-red-600">{errors[name]}</p>}
            </label>
          ))}
        </div>
        <button
          type="submit"
          disabled={saving}
          className="mt-6 rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d] disabled:opacity-60 cursor-pointer"
        >
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </form>
      <form onSubmit={savePassword} noValidate className="mt-6 max-w-3xl rounded-2xl border border-[#17345f1a] bg-white p-5 text-left shadow-sm">
        <p className="text-lg font-extrabold text-[#122a50]">Security</p>
        <p className="mt-1 text-sm font-semibold text-[#122a50b2]">
          {passwordStatus.hasPassword
            ? "Change your password or continue using OTP login any time."
            : "You don't have a password yet. Set one to login faster next time."}
        </p>
        <button
          type="button"
          onClick={() => setShowSecurityPassword((current) => !current)}
          className="mt-3 text-xs font-extrabold text-[#d9aa3d] hover:text-[#17345f]"
        >
          {showSecurityPassword ? "Hide passwords" : "Show passwords"}
        </button>
        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          {passwordStatus.hasPassword && (
            <label className="block">
              <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Current Password</span>
              <input
                name="currentPassword"
                type={showSecurityPassword ? "text" : "password"}
                value={passwordForm.currentPassword}
                onChange={updatePasswordField}
                className="mt-1 h-12 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
              />
            </label>
          )}
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-[#122a50b2]">New Password</span>
            <input
              name="newPassword"
              type={showSecurityPassword ? "text" : "password"}
              value={passwordForm.newPassword}
              onChange={updatePasswordField}
              className="mt-1 h-12 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
            />
          </label>
          <label className="block">
            <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Confirm Password</span>
            <input
              name="confirmPassword"
              type={showSecurityPassword ? "text" : "password"}
              value={passwordForm.confirmPassword}
              onChange={updatePasswordField}
              className="mt-1 h-12 w-full rounded-lg border border-[#17345f1a] px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
            />
          </label>
        </div>
        {passwordError && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{passwordError}</p>}
        <button
          type="submit"
          disabled={savingPassword}
          className="mt-5 rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d] disabled:opacity-60 cursor-pointer"
        >
          {savingPassword ? "Saving..." : passwordStatus.hasPassword ? "Change Password" : "Set Password"}
        </button>
      </form>
      <ConfirmModal
        open={confirmRemoveAvatar}
        title="Remove profile photo?"
        message="Do you want to remove your profile photo?"
        confirmLabel="OK"
        loading={uploadingAvatar}
        onCancel={() => setConfirmRemoveAvatar(false)}
        onConfirm={removeAvatar}
      />
    </AccountLayout>
  );
};

export default AccountDetails;
