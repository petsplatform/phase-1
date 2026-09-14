import { useEffect, useState } from "react";
import { AlertCircle } from "lucide-react";
import toast from "react-hot-toast";
import { settingsApi } from "../../api/settingsApi";
import { inquiryApi } from "../../api/inquiryApi";
import { useAuth } from "../../store/authentication/authContext";

export default function SupportTab() {
  const { currentUser } = useAuth();
  const [settings, setSettings] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [form, setForm] = useState({
    subject: "",
    message: "",
  });

  useEffect(() => {
    let active = true;

    settingsApi
      .getSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch((error) => {
        console.error("Failed to load support settings:", error);
      });

    return () => {
      active = false;
    };
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.subject.trim() || !form.message.trim()) {
      toast.error("Please enter a subject and message.");
      return;
    }

    try {
      setIsSubmitting(true);
      await inquiryApi.submit({
        fullName: currentUser?.name || "Customer",
        email: currentUser?.email,
        phone: currentUser?.phone || "",
        subject: form.subject,
        message: form.message,
      });
      setForm({ subject: "", message: "" });
      toast.success("Support request submitted successfully.");
    } catch (error) {
      toast.error(
        error.response?.data?.message ||
          "Support request could not be submitted.",
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="animate-in fade-in duration-300 text-left flex-grow flex flex-col justify-between">
      <div>
        <div className="border-b border-brand-purple/5 pb-5 mb-6">
          <h2 className="text-2xl font-display font-extrabold text-brand-purple tracking-tight">
            Support
          </h2>
          <p className="text-xs text-brand-brown/60 mt-1 font-semibold">
            Get help with your prescriptions, orders, or account questions
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="border border-gray-200 p-5 rounded-[20px] bg-white font-semibold">
            <h4 className="font-extrabold text-brand-purple text-sm">
              Support Email
            </h4>
            <p className="text-xs text-brand-brown/70 mt-2 font-medium">
              Contact the store team for order or account support.
            </p>
            <p className="font-extrabold text-brand-purple text-sm mt-3 break-all">
              {settings?.supportEmail || "support@happypetrx.com"}
            </p>
          </div>

          <div className="border border-gray-200 p-5 rounded-[20px] bg-white font-semibold">
            <h4 className="font-extrabold text-brand-purple text-sm">
              Support Phone
            </h4>
            <p className="text-xs text-brand-brown/70 mt-2 font-medium">
              Use the phone number configured from your admin settings.
            </p>
            <p className="font-extrabold text-brand-purple text-sm mt-3">
              {settings?.supportPhone || "+1 (800) 555-1000"}
            </p>
          </div>
        </div>

        <div className="border border-brand-purple/10 p-5 rounded-2xl flex items-start gap-3 bg-white">
          <AlertCircle className="w-5 h-5 text-brand-purple flex-shrink-0 mt-0.5" />
          <div>
            <h4 className="font-extrabold text-brand-purple text-sm">
              Emergency Info
            </h4>
            <p className="text-xs text-brand-brown/75 leading-relaxed font-semibold mt-1">
              If your pet is experiencing a severe medical emergency, contact
              your local emergency veterinarian clinic immediately.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
