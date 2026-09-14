import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Mail,
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Sparkles,
  Inbox,
  ShieldCheck,
} from "lucide-react";
import { useAuth } from "../../store/authentication/authContext";
import toast from "react-hot-toast";

export default function ForgotPassword() {
  const { forgotPassword } = useAuth();
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const normalizedEmail = email.trim().toLowerCase();
    if (!normalizedEmail) {
      toast.error("Please enter your email address.");
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(normalizedEmail) || normalizedEmail.length > 100) {
      toast.error("Please enter a valid email address (max 100 characters).");
      return;
    }

    try {
      setIsSubmitting(true);
      await forgotPassword(email);
      setIsSubmitted(true);
      toast.success("Verification request sent. Check your email inbox.", {
        icon: "✉️",
      });
    } catch (err) {
      toast.error(err.response?.data?.message || err.message || "Failed to initiate password reset.");
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
                  Secure Recovery
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Reset your password securely via our automated validation
                  system.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center text-brand-peach flex-shrink-0 shadow-inner">
                <Sparkles className="w-5.5 h-5.5 animate-pulse" />
              </div>
              <div>
                <h3 className="font-bold text-sm text-brand-cream">
                  Need Quick Assistance?
                </h3>
                <p className="text-xs text-brand-cream/70 mt-1 leading-relaxed">
                  Our customer support team is available 24/7 to help you
                  recover credentials.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/10">
          <p className="text-xs italic text-brand-cream/80 leading-relaxed">
            "Recovering my password was very straightforward and I didn't lose
            my active pet health histories."
          </p>
          <p className="text-[10px] font-bold text-brand-peach mt-2 tracking-wide uppercase">
            — David T. (Owner of Buster)
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

          {!isSubmitted ? (
            <div className="animate-in fade-in zoom-in-95 duration-300">
              {/* Header */}
              <div className="text-center md:text-left mb-8">
                <h2 className="text-3xl font-display font-extrabold text-brand-purple tracking-tight">
                  Forgot Password?
                </h2>
                <p className="text-sm font-medium text-brand-brown/70 mt-2">
                  No worries! Enter your email and we'll send a secure
                  verification request.
                </p>
              </div>

              {/* Form */}
              <form onSubmit={handleSubmit} noValidate className="space-y-5 text-left">
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
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="name@example.com"
                      className="w-full pl-10 pr-4 py-3 bg-white border border-brand-purple/10 hover:border-brand-purple/20 focus:border-brand-purple/60 rounded-2xl text-brand-purple text-sm placeholder-brand-purple/30 outline-none transition-all duration-200 shadow-sm"
                    />
                  </div>
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
                      <span>Send Verification</span>
                      <ArrowRight className="w-4 h-4 transition-transform duration-200 group-hover:translate-x-0.5" />
                    </>
                  )}
                </button>
              </form>

              {/* Back to Login Link */}
              <div className="text-center md:text-left mt-8 pt-4">
                <Link
                  to="/login"
                  className="inline-flex items-center gap-1.5 text-xs font-bold text-brand-purple/80 hover:text-brand-purple transition-colors group"
                >
                  <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                  <span>Back to Login</span>
                </Link>
              </div>
            </div>
          ) : (
            <div className="animate-in fade-in zoom-in-95 duration-300 text-center md:text-left">
              {/* Success Icon */}
              <div className="flex justify-center md:justify-start mb-6 relative">
                <div className="w-16 h-16 rounded-2xl bg-brand-purple text-brand-cream flex items-center justify-center shadow-lg relative">
                  <Inbox className="w-8 h-8 text-brand-peach animate-pulse" />
                  <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-emerald-500 border-2 border-white flex items-center justify-center">
                    <CheckCircle2 className="w-3.5 h-3.5 text-white" />
                  </div>
                </div>
              </div>

              {/* Success Header */}
              <div className="mb-6">
                <h2 className="text-3xl font-display font-extrabold text-brand-purple tracking-tight">
                  Verification Sent
                </h2>
                <p className="text-sm font-medium text-brand-brown/70 mt-2 leading-relaxed">
                  We've sent a secure verification request for{" "}
                  <strong className="text-brand-purple">{email}</strong>.
                </p>
              </div>

              {/* Demo Testing Box */}
              <div className="bg-brand-cream/60 border border-brand-purple/5 p-5 rounded-2xl text-left text-xs mb-6 shadow-inner">
                <div className="flex items-center gap-1.5 text-[10px] font-extrabold text-brand-purple uppercase tracking-wider mb-2">
                  <Sparkles className="w-3.5 h-3.5 text-brand-peach" />
                  <span>Simulated Reset Link</span>
                </div>
                <p className="text-brand-brown/85 font-medium leading-relaxed mb-4">
                  For design and route validation, you can bypass email checking
                  and set your new password directly below:
                </p>
                <Link
                  to={`/set-password?email=${encodeURIComponent(email)}`}
                  className="w-full inline-flex items-center justify-center gap-1.5 py-3 px-4 bg-brand-peach text-brand-purple font-bold rounded-xl hover:bg-brand-peach/95 transition-all duration-200 shadow-sm"
                >
                  <span>Reset Password Now</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </Link>
              </div>

              {/* Back to Login Button */}
              <Link
                to="/login"
                className="inline-flex items-center justify-center gap-1.5 text-xs font-bold text-brand-purple hover:underline group"
              >
                <ArrowLeft className="w-3.5 h-3.5 transition-transform duration-200 group-hover:-translate-x-0.5" />
                <span>Back to Login</span>
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
