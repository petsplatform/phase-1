import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  CheckCircle2,
  Check,
  X,
} from "lucide-react";
import logo from "../../assets/Logo/footer-logo.png";
import petLoginImg from "../../assets/Authentication/loginbg.png";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Validation and completion states
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitSuccess, setSubmitSuccess] = useState(false);

  // Password requirements checks
  const hasMinLength = password.length >= 6;
  const hasNumber = /\d/.test(password);
  const hasUpperCase = /[A-Z]/.test(password);
  const hasLowerCase = /[a-z]/.test(password);

  const validateForm = () => {
    const newErrors = {};

    if (!password) {
      newErrors.password = "Password is required";
    } else if (!hasMinLength || !hasNumber || !hasUpperCase || !hasLowerCase) {
      newErrors.password = "Password must meet all security requirements";
    }

    if (!confirmPassword) {
      newErrors.confirmPassword = "Please confirm your new password";
    } else if (password !== confirmPassword) {
      newErrors.confirmPassword = "Passwords do not match";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!validateForm()) return;

    setIsSubmitting(true);

    // Simulate password resetting API call
    setTimeout(() => {
      setIsSubmitting(false);
      setSubmitSuccess(true);
    }, 1500);
  };

  return (
    <div className="flex min-h-screen bg-background font-sans lg:h-screen lg:overflow-hidden">
      {/* Back button (Top Left) */}
      <Link
        to="/login"
        className="absolute top-6 left-6 z-10 flex items-center gap-2 rounded-full border border-outline bg-white/80 px-4 py-2 text-xs font-bold uppercase tracking-wider text-charcoal-text backdrop-blur-md transition hover:border-secondary hover:text-secondary hover:shadow-sm"
      >
        <ArrowLeft size={14} />
        <span>Back to Login</span>
      </Link>

      {/* Split Screen Layout */}
      <div className="flex w-full lg:h-full">
        {/* Left Side: Illustration Pane */}
        <div className="relative hidden w-1/2 lg:block lg:h-full">
          <img
            src={petLoginImg}
            alt="Cute puppy and kitten"
            className="h-full w-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-secondary/80 via-secondary/20 to-transparent" />

          <div className="absolute bottom-12 left-12 right-12 rounded-3xl border border-white/20 bg-white/10 p-8 backdrop-blur-lg shadow-2xl">
            <div className="flex items-center gap-2 text-white">
              <Sparkles size={20} className="text-accent animate-pulse" />
              <span className="text-xs font-bold uppercase tracking-widest text-accent">
                Security First
              </span>
            </div>
            <h2 className="mt-4 text-3xl font-bold leading-tight text-white font-display">
              Protect Your <br />
              Account
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-white/90">
              We recommend using a strong password that you don't use on other
              websites. Keep your personal information and pet's medical
              histories/orders secure.
            </p>
          </div>
        </div>

        {/* Right Side: Form Pane */}
        <div className="flex w-full items-center justify-center p-8 sm:p-12 lg:w-1/2 lg:h-full lg:overflow-y-auto">
          <div className="w-full max-w-md">
            {/* Header */}
            <div className="flex flex-col items-center text-center mb-8">
              <Link to="/">
                <img
                  src={logo}
                  alt="Budget PetShop Logo"
                  className="h-24 w-auto object-contain mb-4 transition transform hover:scale-105"
                />
              </Link>
              <h1 className="text-2xl font-bold text-on-background font-display tracking-tight">
                Set New Password
              </h1>
              <p className="text-sm text-charcoal-text mt-1.5">
                Create a strong, secure password for your account.
              </p>
            </div>

            {/* Success State */}
            {submitSuccess ? (
              <div className="rounded-3xl bg-white border border-outline p-8 text-center shadow-xl animate-fade-in-up">
                <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-surface-tint text-secondary mb-4">
                  <CheckCircle2 size={32} />
                </div>
                <h3 className="text-lg font-bold text-on-background font-display">
                  Password Reset Complete
                </h3>
                <p className="text-sm text-charcoal-text mt-3 leading-relaxed">
                  Your password has been successfully updated. You can now use
                  your new password to sign in.
                </p>
                <div className="mt-8 pt-2">
                  <Link
                    to="/login"
                    className="flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 px-6 text-sm font-semibold text-white shadow-md transition hover:bg-secondary/95 active:scale-[0.99]"
                  >
                    <span>Proceed to Login</span>
                    <ArrowRight size={16} />
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleSubmit} className="space-y-5">
                {/* New Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter new password"
                      value={password}
                      onChange={(e) => {
                        setPassword(e.target.value);
                        if (errors.password)
                          setErrors((prev) => ({ ...prev, password: "" }));
                      }}
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-12 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${
                        errors.password
                          ? "border-accent ring-2 ring-accent/10 focus:border-accent"
                          : "border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-charcoal-text/60 hover:text-on-background"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                  {errors.password && (
                    <p className="mt-1.5 text-xs text-accent font-medium">
                      {errors.password}
                    </p>
                  )}
                </div>

                {/* Password Requirements Panel */}
                <div className="rounded-2xl border border-outline bg-surface-soft p-4 space-y-2">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-charcoal-text block mb-1">
                    Requirements Check:
                  </span>

                  {/* Min length */}
                  <div className="flex items-center gap-2 text-xs">
                    {hasMinLength ? (
                      <Check size={14} className="text-secondary font-bold" />
                    ) : (
                      <X size={14} className="text-charcoal-text/40" />
                    )}
                    <span
                      className={
                        hasMinLength
                          ? "text-secondary font-medium"
                          : "text-charcoal-text/60"
                      }
                    >
                      At least 6 characters
                    </span>
                  </div>

                  {/* Has Number */}
                  <div className="flex items-center gap-2 text-xs">
                    {hasNumber ? (
                      <Check size={14} className="text-secondary font-bold" />
                    ) : (
                      <X size={14} className="text-charcoal-text/40" />
                    )}
                    <span
                      className={
                        hasNumber
                          ? "text-secondary font-medium"
                          : "text-charcoal-text/60"
                      }
                    >
                      Contains at least one number
                    </span>
                  </div>

                  {/* Has Upper Case */}
                  <div className="flex items-center gap-2 text-xs">
                    {hasUpperCase ? (
                      <Check size={14} className="text-secondary font-bold" />
                    ) : (
                      <X size={14} className="text-charcoal-text/40" />
                    )}
                    <span
                      className={
                        hasUpperCase
                          ? "text-secondary font-medium"
                          : "text-charcoal-text/60"
                      }
                    >
                      Contains one uppercase letter
                    </span>
                  </div>

                  {/* Has Lower Case */}
                  <div className="flex items-center gap-2 text-xs">
                    {hasLowerCase ? (
                      <Check size={14} className="text-secondary font-bold" />
                    ) : (
                      <X size={14} className="text-charcoal-text/40" />
                    )}
                    <span
                      className={
                        hasLowerCase
                          ? "text-secondary font-medium"
                          : "text-charcoal-text/60"
                      }
                    >
                      Contains one lowercase letter
                    </span>
                  </div>
                </div>

                {/* Confirm Password */}
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-charcoal-text mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 flex items-center pl-4 text-charcoal-text/60">
                      <Lock size={18} />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Repeat your password"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        if (errors.confirmPassword)
                          setErrors((prev) => ({
                            ...prev,
                            confirmPassword: "",
                          }));
                      }}
                      className={`w-full rounded-2xl border bg-white py-3.5 pl-11 pr-12 text-sm text-on-background outline-none transition duration-200 placeholder:text-charcoal-text/40 ${
                        errors.confirmPassword
                          ? "border-accent ring-2 ring-accent/10 focus:border-accent"
                          : "border-outline-strong focus:border-secondary focus:ring-4 focus:ring-secondary/10"
                      }`}
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 flex items-center pr-4 text-charcoal-text/60 hover:text-on-background"
                    >
                      {showConfirmPassword ? (
                        <EyeOff size={18} />
                      ) : (
                        <Eye size={18} />
                      )}
                    </button>
                  </div>
                  {errors.confirmPassword && (
                    <p className="mt-1.5 text-xs text-accent font-medium">
                      {errors.confirmPassword}
                    </p>
                  )}
                </div>

                {/* Submit button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="relative flex w-full items-center justify-center gap-2 rounded-full bg-secondary py-3.5 px-6 text-sm font-semibold text-white shadow-md transition-all duration-200 hover:bg-secondary/95 active:scale-[0.99] disabled:opacity-75 disabled:pointer-events-none cursor-pointer mt-2"
                >
                  {isSubmitting ? (
                    <div className="flex items-center gap-2">
                      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      <span>Saving password...</span>
                    </div>
                  ) : (
                    <>
                      <span>Set Password</span>
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
