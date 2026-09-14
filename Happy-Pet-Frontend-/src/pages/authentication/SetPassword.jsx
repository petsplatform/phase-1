import React, { useState, useEffect } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import {
  Lock,
  Eye,
  EyeOff,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  ShieldCheck,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../store/authentication/authContext";
import toast from "react-hot-toast";

export default function SetPassword() {
  const { setPassword } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const emailParam = searchParams.get("email") || "";

  const [password, setPasswordState] = useState("");
  const [confirmPassword, setConfirmPasswordState] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [countdown, setCountdown] = useState(3);

  // Password strength logic
  const checkPasswordStrength = () => {
    if (!password)
      return { score: 0, text: "Enter password", color: "bg-gray-200" };
    let score = 0;
    if (password.length >= 8) score++;
    if (/[A-Z]/.test(password)) score++;
    if (/[0-9]/.test(password)) score++;
    if (/[^A-Za-z0-9]/.test(password)) score++;

    switch (score) {
      case 1:
        return { score, text: "Weak", color: "bg-red-400" };
      case 2:
        return { score, text: "Moderate", color: "bg-orange-400" };
      case 3:
        return { score, text: "Good", color: "bg-yellow-400" };
      case 4:
        return { score, text: "Strong", color: "bg-emerald-400" };
      default:
        return { score, text: "Weak", color: "bg-red-400" };
    }
  };

  const strength = checkPasswordStrength();

  // Countdown timer for automatic redirect
  useEffect(() => {
    let timer;
    if (isSuccess && countdown > 0) {
      timer = setTimeout(() => setCountdown(countdown - 1), 1000);
    } else if (isSuccess && countdown === 0) {
      navigate("/login");
    }
    return () => clearTimeout(timer);
  }, [isSuccess, countdown, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password.trim() || !confirmPassword.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (password.length < 8 || password.length > 50) {
      toast.error("Password must be between 8 and 50 characters long.");
      return;
    }

    try {
      setIsSubmitting(true);
      await setPassword(emailParam, password);
      setIsSuccess(true);
      toast.success("Password reset successfully! 🔒", {
        icon: "✨",
      });
    } catch (err) {
      toast.error(err.message || "Failed to reset password.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex flex-col md:flex-row select-none bg-white">
      {/* Left Side: Creative Brand Card (visible on md+) */}
      <div className="hidden md:flex md:w-[38%] bg-gradient-to-br from-brand-purple via-[#3b003b] to-[#250025] p-12 flex-col justify-between text-brand-cream relative overflow-hidden min-h-screen">
        <div className="absolute top-[-10%] right-[-10%] w-72 h-72 bg-brand-peach/15 rounded-full blur-[80px] pointer-events-none animate-pulse duration-[6000ms]"></div>
        <div className="absolute bottom-[-10%] left-[-10%] w-80 h-80 bg-brand-peach/10 rounded-full blur-[90px] pointer-events-none animate-pulse duration-[8000ms]"></div>

        <div>
          {/* Back to Store Button */}
          <Link
            to="/"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full border border-white/10 text-xs font-semibold bg-white hover:bg-white transition-all duration-200 shadow-sm text-brand-purple mb-8 outline-none cursor-pointer"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Back to Store</span>
          </Link>

          <div className="mt-4">
            <Link to="/" className="inline-block group mb-12">
              <span className="font-display font-extrabold text-2xl tracking-tight text-brand-cream group-hover:opacity-90 transition-opacity">
                HappyPet
                <span className="text-brand-peach font-bold font-sans">Rx</span>
              </span>
            </Link>
          </div>

          <div className="space-y-6 mt-8">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-cream">
                  Update Password
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Enter a new password to keep your dashboard secure and valid.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs italic text-brand-cream/80 leading-relaxed">
            "Happy PetRx makes managing Buddy's arthritis medication
            stress-free. Refills arrive right on time!"
          </p>
          <p className="text-[10px] font-bold text-brand-peach mt-2 tracking-wide uppercase">
            — Sarah & Buddy (Golden Retriever)
          </p>
        </div>
      </div>

      {/* Right Side: Form Content */}
      <div className="flex-1 flex flex-col justify-center px-6 sm:px-12 md:px-16 lg:px-24 py-12 relative bg-[#FFF9F5]/40">
        {/* Ambient glow effects behind form */}
        <div className="absolute top-10 right-10 w-96 h-96 bg-brand-purple/[0.02] rounded-full blur-[100px] pointer-events-none"></div>
        <div className="absolute bottom-10 left-10 w-80 h-80 bg-brand-peach/[0.02] rounded-full blur-[80px] pointer-events-none"></div>

        <div className="max-w-md w-full mx-auto relative z-10">
          {/* Mobile Logo and Back Button */}
          <div className="md:hidden flex justify-between items-center mb-10">
            <Link
              to="/"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-brand-purple/10 text-xs font-semibold bg-white hover:bg-white/95 transition-all duration-200 shadow-sm text-brand-purple"
            >
              <ArrowLeft className="w-3 h-3" />
              <span>Back to Store</span>
            </Link>
            <Link to="/">
              <span className="font-display font-extrabold text-lg tracking-tight text-brand-purple">
                HappyPet
                <span className="text-brand-peach font-bold font-sans">Rx</span>
              </span>
            </Link>
          </div>

          {!isSuccess ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="text-center md:text-left mb-8">
                <h2 className="text-3xl font-display font-extrabold text-brand-purple tracking-tight">
                  Set New Password
                </h2>
                <p className="text-sm font-medium text-brand-brown/70 mt-2">
                  Choose a strong and secure password for your account
                  {emailParam ? ` (${emailParam})` : ""}.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} className="space-y-4 text-left">
                <div>
                  <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type={showPassword ? "text" : "password"}
                      required
                      value={password}
                      onChange={(e) => setPasswordState(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword(!showPassword)}
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-purple/40 hover:text-brand-purple transition-colors cursor-pointer"
                    >
                      {showPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                      <Lock className="w-4.5 h-4.5" />
                    </span>
                    <input
                      type={showConfirmPassword ? "text" : "password"}
                      required
                      value={confirmPassword}
                      onChange={(e) => setConfirmPasswordState(e.target.value)}
                      placeholder="••••••••"
                      className="w-full pl-10 pr-10 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                    />
                    <button
                      type="button"
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      className="absolute inset-y-0 right-0 pr-3.5 flex items-center text-brand-purple/40 hover:text-brand-purple transition-colors cursor-pointer"
                    >
                      {showConfirmPassword ? (
                        <EyeOff className="w-4.5 h-4.5" />
                      ) : (
                        <Eye className="w-4.5 h-4.5" />
                      )}
                    </button>
                  </div>
                </div>

                {/* Password Strength Meter */}
                {password && (
                  <div className="animate-in fade-in duration-200">
                    <div className="flex justify-between items-center text-[10px] font-bold uppercase tracking-wider text-brand-purple mb-1">
                      <span>Password Strength:</span>
                      <span className="font-extrabold">{strength.text}</span>
                    </div>
                    <div className="h-1.5 w-full bg-brand-purple/10 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${strength.color}`}
                        style={{ width: `${(strength.score / 4) * 100}%` }}
                      ></div>
                    </div>
                  </div>
                )}

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-2xl transition-all duration-200 shadow-md group disabled:opacity-50 disabled:cursor-not-allowed mt-2 cursor-pointer"
                >
                  {isSubmitting ? (
                    <div className="w-5.5 h-5.5 border-3 border-brand-cream border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <>
                      <span>Update Password</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-center md:text-left">
              {/* Success Icon */}
              <div className="flex justify-center md:justify-start mb-6">
                <div className="w-16 h-16 rounded-2xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-lg relative">
                  <CheckCircle2 className="w-9 h-9 text-emerald-500 animate-bounce duration-[2500ms]" />
                  <div className="absolute -top-1 -right-1 w-4.5 h-4.5 bg-brand-peach rounded-full flex items-center justify-center animate-ping"></div>
                </div>
              </div>

              {/* Success Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-display font-extrabold text-brand-purple tracking-tight flex items-center justify-center md:justify-start gap-2">
                  <span>Success!</span>
                  <Sparkles className="w-5 h-5 text-brand-peach animate-pulse" />
                </h2>
                <p className="text-sm font-medium text-brand-brown/75 mt-2 leading-relaxed">
                  Your password has been changed successfully. You will be
                  redirected to the login page automatically.
                </p>
              </div>

              {/* Countdown Box */}
              <div className="bg-brand-cream border border-brand-purple/5 p-5 rounded-2xl text-center text-xs font-semibold text-brand-purple mb-6 shadow-inner">
                Redirecting in{" "}
                <span className="font-extrabold text-sm text-brand-peach">
                  {countdown}
                </span>{" "}
                seconds...
              </div>

              {/* Manual Link */}
              <Link
                to="/login"
                className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-2xl transition-all duration-200 shadow-md cursor-pointer"
              >
                <span>Go to Login Now</span>
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
