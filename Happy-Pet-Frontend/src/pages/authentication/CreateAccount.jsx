import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Mail,
  Lock,
  User,
  Eye,
  EyeOff,
  ArrowRight,
  ShieldAlert,
  ShieldCheck,
  Sparkles,
  Heart,
  ArrowLeft,
} from "lucide-react";
import { useAuth } from "../../store/authentication/authContext";
import toast from "react-hot-toast";
import { isUserBlockedError } from "../../api/axios";

export default function CreateAccount() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [acceptTerms, setAcceptTerms] = useState(false);
  const [blockedReason, setBlockedReason] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

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

  const handleSubmit = async (e) => {
    e.preventDefault();

    const nameVal = name.trim();
    const emailVal = email.trim();

    if (!nameVal || !emailVal || !password.trim()) {
      toast.error("Please fill in all required fields.");
      return;
    }

    if (nameVal.length < 2 || nameVal.length > 50) {
      toast.error("Full name must be between 2 and 50 characters.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal) || emailVal.length > 100) {
      toast.error("Please enter a valid email address (max 100 characters).");
      return;
    }

    if (password.length < 8 || password.length > 50) {
      toast.error("Password must be between 8 and 50 characters long.");
      return;
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.");
      return;
    }

    if (!acceptTerms) {
      toast.error("You must accept the terms and conditions.");
      return;
    }

    setBlockedReason("");
    try {
      setIsSubmitting(true);
      await register(name, email, password);
      toast.success(
        "Account created successfully! Welcome to Happy PetRx! 🎉",
        {
          icon: "🐾",
        },
      );
      navigate("/");
    } catch (err) {
      const isBlocked = isUserBlockedError(err);
      const msg = err.response?.data?.message || err.message || "Failed to create account.";
      if (isBlocked) {
        setBlockedReason(msg);
        toast.error(msg);
      } else {
        toast.error(msg);
      }
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

          <div className="space-y-6 mt-6">
            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                <Sparkles className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-cream">
                  Free Account Benefits
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Set up individual pet profiles, track prescription histories,
                  and save custom dosage settings.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                <ShieldCheck className="w-5.5 h-5.5" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-cream">
                  100% Safe Refills
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Get automated reminders before you run out, with simple
                  one-click pharmacist approval requests.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                <Heart className="w-5.5 h-5.5 fill-brand-peach/10" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-cream">
                  Exclusive Deals
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Access member-only deals on premium vet diet brands, parasite
                  preventatives, and toys.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs italic text-brand-cream/80 leading-relaxed">
            "Signing up took less than a minute. Now I can manage medications
            for all 3 of my cats in one clean dashboard!"
          </p>
          <p className="text-[10px] font-bold text-brand-peach mt-2 tracking-wide uppercase">
            — Mark D. (Owner of Cleo, Otis, and Pip)
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

          {/* Header */}
          <div className="text-center md:text-left mb-8">
            <h2 className="text-3xl font-display font-extrabold text-brand-purple tracking-tight">
              Create Account
            </h2>
            <p className="text-sm font-medium text-brand-brown/70 mt-2">
              Sign up today to begin your premium pet care experience.
            </p>
          </div>

          {blockedReason && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-left shadow-sm">
              <div className="flex items-start gap-3">
                <div className="mt-0.5 rounded-full bg-red-100 p-1.5 text-red-600 flex-shrink-0">
                  <ShieldAlert className="h-5 w-5" />
                </div>
                <div>
                  <h4 className="text-sm font-bold text-red-800">Account Blocked</h4>
                  <p className="mt-1 text-xs font-semibold text-red-700">{blockedReason}</p>
                  <p className="mt-1 text-[11px] font-medium text-red-600">
                    Please contact{" "}
                    <Link
                      to="/contact"
                      className="underline font-bold text-red-700 hover:text-red-900 transition-colors"
                    >
                      customer support
                    </Link>{" "}
                    to resolve this issue.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} noValidate className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
                Full Name
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                  <User className="w-4.5 h-4.5" />
                </span>
                <input
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
                Email Address
              </label>
              <div className="relative">
                <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                  <Mail className="w-4.5 h-4.5" />
                </span>
                <input
                  type="email"
                  required
                  maxLength={100}
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    if (blockedReason) setBlockedReason("");
                  }}
                  placeholder="name@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-brand-purple uppercase tracking-wider mb-2">
                  Password
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 pl-3.5 flex items-center text-brand-purple/40 pointer-events-none">
                    <Lock className="w-4.5 h-4.5" />
                  </span>
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    minLength={8}
                    maxLength={50}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
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
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                  />
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
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
            </div>

            {/* Password Strength Meter */}
            {password && (
              <div className="animate-in fade-in duration-200 mt-2">
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

            {/* Accept Terms */}
            <div className="flex items-start gap-2.5 pt-2">
              <input
                type="checkbox"
                id="acceptTerms"
                checked={acceptTerms}
                onChange={(e) => setAcceptTerms(e.target.checked)}
                className="mt-1 w-4.5 h-4.5 rounded text-brand-purple focus:ring-brand-purple/20 border-brand-purple/10 cursor-pointer accent-brand-purple"
              />
              <label
                htmlFor="acceptTerms"
                className="text-xs font-semibold text-brand-brown/80 leading-relaxed cursor-pointer"
              >
                I agree to the{" "}
                <a
                  href="#terms"
                  className="text-brand-purple hover:underline font-bold"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <a
                  href="#privacy"
                  className="text-brand-purple hover:underline font-bold"
                >
                  Privacy Policy
                </a>
                .
              </label>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 py-3 px-4 bg-brand-purple hover:bg-brand-purple/90 text-brand-cream font-bold rounded-2xl transition-all duration-200 shadow-md group disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              {isSubmitting ? (
                <div className="w-5.5 h-5.5 border-3 border-brand-cream border-t-transparent rounded-full animate-spin"></div>
              ) : (
                <>
                  <span>Create Account</span>
                  <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                </>
              )}
            </button>
          </form>

          {/* Footer Login Link */}
          <div className="text-center mt-8 pt-6 border-t border-brand-purple/5 text-xs text-brand-brown/70 font-medium">
            Already have an account?{" "}
            <Link
              to="/login"
              className="font-bold text-brand-purple hover:underline"
            >
              Log in
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
