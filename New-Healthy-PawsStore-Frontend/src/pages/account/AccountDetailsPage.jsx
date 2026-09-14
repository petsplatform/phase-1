import { useEffect, useState } from "react";
import AccountDetailsForm from "../../components/account/AccountDetailsForm";
import ProfilePhotoUpload from "../../components/account/ProfilePhotoUpload";
import { useToast } from "../../context/ToastContext";
import { updateStoredAuthUser } from "../../services/authService";
import { getCustomerProfile, updateCustomerProfile, uploadCustomerAvatar } from "../../services/accountService";

export default function AccountDetailsPage() {
  const [profile, setProfile] = useState(null);
  const [savingProfile, setSavingProfile] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [formError, setFormError] = useState("");
  const { showToast } = useToast();

  useEffect(() => {
    getCustomerProfile()
      .then(setProfile)
      .catch((error) => showToast(error.message || "Could not load profile.", "error"));
  }, [showToast]);

  const applyProfile = (nextProfile) => {
    setProfile(nextProfile);
    updateStoredAuthUser(nextProfile);
  };

  const handleSaveProfile = async (values) => {
    setSavingProfile(true);
    setFormError("");

    try {
      const nextProfile = await updateCustomerProfile(values);
      applyProfile(nextProfile);
      showToast("Profile updated successfully.", "success");
    } catch (error) {
      const message = error.message || "Could not update profile.";
      setFormError(message);
      showToast(message, "error");
    } finally {
      setSavingProfile(false);
    }
  };

  const handleUploadAvatar = async (file) => {
    setUploadingAvatar(true);

    try {
      const nextProfile = await uploadCustomerAvatar(file);
      applyProfile(nextProfile);
      showToast("Profile photo updated.", "success");
    } catch (error) {
      showToast(error.message || "Could not upload profile photo.", "error");
    } finally {
      setUploadingAvatar(false);
    }
  };

  if (!profile) return <div className="h-[320px] animate-pulse rounded-2xl bg-sageLight" />;

  return (
    <section>
      <h1 className="font-display text-[34px] font-extrabold text-textMain">Account Details</h1>
      <p className="mt-1 text-[14px] font-semibold text-muted">Update your personal information</p>
      <div className="mt-6 grid gap-7 xl:grid-cols-[1fr_320px]">
        <AccountDetailsForm profile={profile} saving={savingProfile} error={formError} onSubmit={handleSaveProfile} />
        <ProfilePhotoUpload profile={profile} uploading={uploadingAvatar} onUpload={handleUploadAvatar} />
      </div>
    </section>
  );
}
