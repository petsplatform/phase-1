import { authApi } from "../../api/authApi";
import { useState } from "react";

const GoogleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
    <path fill="#4285F4" d="M21.6 12.2c0-.7-.1-1.3-.2-1.9H12v3.6h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.2Z" />
    <path fill="#34A853" d="M12 22c2.7 0 5-0.9 6.6-2.5l-3.2-2.5c-.9.6-2 .9-3.4.9-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" />
    <path fill="#FBBC05" d="M6.4 13.8a6 6 0 0 1 0-3.6V7.6H3.1a10 10 0 0 0 0 8.8l3.3-2.6Z" />
    <path fill="#EA4335" d="M12 6.1c1.5 0 2.8.5 3.8 1.5l2.9-2.9A9.7 9.7 0 0 0 12 2a10 10 0 0 0-8.9 5.6l3.3 2.6C7.2 7.9 9.4 6.1 12 6.1Z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="h-5 w-5" fill="currentColor" aria-hidden="true">
    <path d="M16.4 2c.1 1.1-.3 2.2-1 3-.8.9-2 1.6-3.1 1.5-.1-1 .3-2.1 1-2.9.8-.9 2.1-1.5 3.1-1.6Zm3.8 15.4c-.6 1.3-.9 1.8-1.7 3-.9 1.3-2.1 2.8-3.6 2.8-1.4 0-1.7-.9-3.5-.9s-2.2.9-3.5.9c-1.5 0-2.7-1.4-3.6-2.7-2.5-3.6-2.8-7.8-1.2-10.1 1.1-1.6 2.8-2.5 4.4-2.5 1.6 0 2.6.9 3.9.9 1.2 0 2-.9 3.8-.9 1.3 0 2.8.7 3.9 2-3.4 1.9-2.9 6.7.1 7.5Z" />
  </svg>
);

const providers = [
  { id: "google", label: "Google", icon: GoogleIcon, className: "bg-white text-[#122a50] hover:border-[#d9aa3d] hover:bg-[#fff9eb]" },
  { id: "apple", label: "Apple", icon: AppleIcon, className: "bg-[#111827] text-white hover:bg-[#17345f]" },
];

const SocialAuthButtons = ({ mode = "login", disabled = false, onError }) => {
  const [activeProvider, setActiveProvider] = useState("");

  const handleSocialAuth = async (provider) => {
    if (disabled || activeProvider) return;
    setActiveProvider(provider);
    onError?.("");
    try {
      const customer = await authApi.startSocialLogin({ provider, mode });
      if (customer) window.location.assign("/");
    } catch (err) {
      if (import.meta.env.DEV) {
        console.error(`${provider} social login failed`, err);
      }
      onError?.(err.response?.data?.message || err.message || "Social login could not be completed. Please try again.");
    } finally {
      setActiveProvider("");
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3">
        <span className="h-px flex-1 bg-[#17345f1a]" />
        <span className="text-xs font-extrabold uppercase text-[#122a50]/45">or</span>
        <span className="h-px flex-1 bg-[#17345f1a]" />
      </div>
      <div className="grid gap-3 sm:grid-cols-2">
        {providers.map((provider) => {
          const Icon = provider.icon;
          return (
            <button
              key={provider.id}
              type="button"
              disabled={disabled || Boolean(activeProvider)}
              onClick={() => handleSocialAuth(provider.id)}
              className={`flex h-12 items-center justify-center gap-3 rounded-lg border border-[#17345f1a] px-4 text-sm font-extrabold transition-all disabled:opacity-60 ${provider.className}`}
            >
              <Icon />
              <span>{activeProvider === provider.id ? "Signing in..." : `Sign in with ${provider.label}`}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default SocialAuthButtons;
