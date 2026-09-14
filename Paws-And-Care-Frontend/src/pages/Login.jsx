import React, { useState, useEffect, useRef } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Sparkles, ArrowLeft, Send, ShieldCheck, ChevronRight, Lock, ShieldAlert } from 'lucide-react';
import { CUSTOMER_BLOCKED_REASON_KEY, AUTH_CHANGE_EVENT } from '../api/axios';
import logoImg from '../assets/logo_refined.png';

// Pet care benefits list
const BENEFITS = [
  { title: 'Secure OTP Login', desc: 'No passwords to remember. Log in instantly with verified verification codes.' },
  { title: 'Preserve Saved Spoilers', desc: 'Keep your pet shopping carts, active wishlists, and delivery addresses synced.' },
  { title: 'Special Rewards Club', desc: 'Unlock access to coupon vouchers like PAWS10 for premium pet snacks.' }
];

export default function Login({ addToast }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { requestLoginOtp, verifyLoginOtp } = useAuth() || {};

  // Step state: 1 = Email Input, 2 = OTP Input
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [emailError, setEmailError] = useState('');
  const [blockedReason, setBlockedReason] = useState('');
  const [loading, setLoading] = useState(false);

  // OTP Verification state
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [otpError, setOtpError] = useState('');
  const [timer, setTimer] = useState(30);
  const [canResend, setCanResend] = useState(false);
  const [otpToken, setOtpToken] = useState('');

  // Read blocked reason from localStorage on mount and listen for real-time auth-change events
  useEffect(() => {
    const reason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
    if (reason) setBlockedReason(reason);

    const handleAuthChange = () => {
      const updatedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      if (updatedReason) {
        setBlockedReason(updatedReason);
        setEmailError('');
        setStep(1);
      }
    };
    window.addEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, handleAuthChange);
  }, []);

  // References for OTP input elements
  const inputRefs = useRef([]);

  // Check if we need to redirect back to a protected path on success
  const redirectTarget = location.state?.from?.pathname || '/';

  // OTP timer countdown
  useEffect(() => {
    let interval = null;
    if (step === 2 && timer > 0) {
      interval = setInterval(() => {
        setTimer((t) => t - 1);
      }, 1000);
    } else if (timer === 0) {
      setCanResend(true);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // Step 1: Request OTP Submission
  const handleEmailSubmit = async (e) => {
    e.preventDefault();
    setEmailError('');
    setBlockedReason('');

    if (!email || !email.trim()) {
      setEmailError('Email address is required');
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setEmailError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    try {
      const data = await requestLoginOtp({ email });
      setOtpToken(data.otpToken);
      setLoading(false);
      setStep(2);
      setTimer(30);
      setCanResend(false);
      if (addToast) {
        addToast('OTP sent successfully. Please check your email.', 'success', 'Verification Code');
      }
    } catch (error) {
      setLoading(false);
      // Check if blocked (axios interceptor may have already stored the reason)
      const storedReason = localStorage.getItem(CUSTOMER_BLOCKED_REASON_KEY);
      const isBlocked =
        error?.response?.status === 403 ||
        Boolean(error?.response?.data?.isBlocked) ||
        Boolean(storedReason);
      if (isBlocked) {
        const reason =
          storedReason ||
          error?.response?.data?.message ||
          error?.message ||
          'Your account has been blocked. Please contact support.';
        setBlockedReason(reason);
        setEmailError('');
      } else {
        setEmailError(error.message || 'Unable to send OTP.');
      }
    }
  };

  // Step 2: Validate OTP Submission
  const handleOtpVerify = async (e) => {
    if (e) e.preventDefault();
    setOtpError('');

    const fullOtp = otp.join('');
    if (fullOtp.length < 6) {
      setOtpError('Please enter the complete 6-digit code');
      return;
    }

    try {
      await verifyLoginOtp({ otpToken, code: fullOtp });
      if (addToast) {
        addToast('Welcome back to PawsAndCare!', 'success', 'Success');
      }
      navigate(redirectTarget, { replace: true });
    } catch (error) {
      setOtpError(error.message || 'Invalid verification code.');
    }
  };

  // OTP inputs handling
  const handleOtpChange = (index, value) => {
    // Only accept numeric entries
    const cleanValue = value.replace(/\D/g, '');
    if (!cleanValue) {
      const newOtp = [...otp];
      newOtp[index] = '';
      setOtp(newOtp);
      return;
    }

    const newOtp = [...otp];
    // Take the last character in case double inputs happen
    newOtp[index] = cleanValue.slice(-1);
    setOtp(newOtp);

    // Auto-focus next input
    if (index < 5 && cleanValue) {
      inputRefs.current[index + 1].focus();
    }
  };

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        // Backspace empty field focuses previous field
        const newOtp = [...otp];
        newOtp[index - 1] = '';
        setOtp(newOtp);
        inputRefs.current[index - 1].focus();
      } else {
        const newOtp = [...otp];
        newOtp[index] = '';
        setOtp(newOtp);
      }
    }
  };

  const handlePaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, 6);
    if (pasteData.length === 6) {
      const newOtp = pasteData.split('');
      setOtp(newOtp);
      inputRefs.current[5].focus();
      
      // Auto trigger verification on complete paste code
      setTimeout(async () => {
        setOtpError('');
        try {
          await verifyLoginOtp({ otpToken, code: pasteData });
          if (addToast) {
            addToast('Welcome back to PawsAndCare!', 'success', 'Success');
          }
          navigate(redirectTarget, { replace: true });
        } catch (error) {
          setOtpError(error.message || 'Invalid verification code.');
        }
      }, 300);
    }
  };

  const handleResendOtp = async () => {
    if (!canResend) return;
    try {
      const data = await requestLoginOtp({ email });
      setOtpToken(data.otpToken);
      setOtp(['', '', '', '', '', '']);
      setOtpError('');
      setTimer(30);
      setCanResend(false);
      if (addToast) {
        addToast('OTP sent successfully. Please check your email.', 'success', 'Verification Code');
      }
    } catch (error) {
      setOtpError(error.message || 'Unable to resend OTP.');
    }
  };

  // Mask email address display
  const maskEmail = (emailStr) => {
    if (!emailStr) return '';
    const parts = emailStr.split('@');
    return `${parts[0].slice(0, 3)}***@${parts[1]}`;
  };

  return (
    <div className="bg-brand-bg py-12 sm:py-20 font-sans text-left flex items-center justify-center min-h-[calc(100vh-280px)]">
      <div className="max-w-5xl w-full mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-3xl shadow-xl border border-brand-border overflow-hidden grid grid-cols-1 lg:grid-cols-12">
          
          {/* 1. Left Side: Benefits & Premium Card styling (lg: split view) */}
          <div className="hidden lg:flex lg:col-span-5 bg-brand-surface border-r border-brand-border/60 flex-col justify-between p-12 relative overflow-hidden bg-gradient-to-br from-brand-surface via-brand-surface to-brand-peach/15">
            {/* Background decorative blob */}
            <div className="absolute top-0 left-0 w-80 h-80 bg-brand-teal/5 rounded-full blur-3xl pointer-events-none -translate-x-1/3 -translate-y-1/3" />

            {/* Core welcoming value cards */}
            <div className="space-y-8 relative z-10 my-auto">
              <div className="space-y-3">
                <span className="inline-flex items-center gap-1.5 bg-brand-teal/10 text-brand-teal text-[10px] font-heading font-black px-3 py-1 rounded-full uppercase tracking-wider">
                  <Sparkles size={11} className="fill-current" />
                  <span>Premium Pet Care E-Commerce</span>
                </span>
                <h1 className="font-heading font-black text-2xl sm:text-3xl text-brand-text leading-tight">
                  One Secure Account for All Pet Needs.
                </h1>
                <p className="font-sans text-xs sm:text-sm text-brand-muted leading-relaxed">
                  Log in to manage order checkouts, save pet profiles, and review health metrics.
                </p>
              </div>

              <div className="space-y-5">
                {BENEFITS.map((benefit, idx) => (
                  <div key={idx} className="flex gap-3">
                    <div className="w-6 h-6 rounded-full bg-brand-teal text-white flex items-center justify-center shrink-0 text-xs font-heading font-black">
                      ✓
                    </div>
                    <div className="space-y-1">
                      <h3 className="font-heading font-black text-sm text-brand-text leading-none">{benefit.title}</h3>
                      <p className="font-sans text-xs text-brand-muted leading-relaxed">{benefit.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Bottom mini-footer indicator */}
            <div className="relative z-10 text-[10px] text-brand-muted font-sans border-t border-brand-border/40 pt-4 mt-8">
              <span>Trusted by over 50,000+ happy pet parents.</span>
            </div>
          </div>

          {/* 2. Right Side: Minimal secure login form */}
          <div className="lg:col-span-7 flex flex-col justify-center px-6 sm:px-12 py-12 sm:py-16 bg-white relative">
            <div className="max-w-md w-full mx-auto space-y-8">
              
              {/* Form Header Welcome */}
              <div>
                <h2 className="font-heading font-black text-2xl sm:text-3xl text-brand-text leading-tight mb-1.5">
                  {step === 1 ? 'Welcome Back' : 'Confirm Identity'}
                </h2>
                <p className="font-sans text-xs sm:text-sm text-brand-muted">
                  {step === 1 
                    ? 'Enter your email address to receive a secure login verification code.' 
                    : (
                      <>
                        We sent a 6-digit OTP code to <strong className="text-brand-text">{maskEmail(email)}</strong>.
                      </>
                    )
                  }
                </p>
              </div>

              {/* STEP 1: EMAIL ENTRY FORM */}
              {step === 1 && (
                <form onSubmit={handleEmailSubmit} className="space-y-5">

                  {/* Blocked Account Alert */}
                  {blockedReason && (
                    <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                      <div className="flex items-start gap-3">
                        <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                          <ShieldAlert size={18} className="stroke-[2.5]" />
                        </div>
                        <div>
                          <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
                          <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{blockedReason}</p>
                          <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="space-y-2">
                    <label htmlFor="loginEmail" className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                      Email Address
                    </label>
                    <input
                      type="email"
                      id="loginEmail"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        if (blockedReason) setBlockedReason('');
                      }}
                      placeholder="e.g. hello@pawsandcare.com"
                      className="w-full px-4 py-2.5 rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white text-sm transition-all placeholder-brand-muted"
                    />
                    {emailError && <p className="text-[10px] text-brand-coral font-bold pl-1 leading-none">{emailError}</p>}
                  </div>

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full inline-flex items-center justify-center gap-2 h-11 bg-brand-teal hover:bg-brand-deep-teal text-white rounded-xl font-heading font-black text-sm transition-all shadow-xs hover:shadow active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
                  >
                    {loading ? (
                      <span>Sending OTP...</span>
                    ) : (
                      <>
                        <span>Send Verification Code</span>
                        <Send size={13} />
                      </>
                    )}
                  </button>
                </form>
              )}

              {/* STEP 2: 6-DIGIT OTP FIELDS FORM */}
              {step === 2 && (
                <form onSubmit={handleOtpVerify} className="space-y-6">
                  
                  {/* OTP Boxes Grid */}
                  <div className="space-y-2">
                    <label className="block text-xs font-heading font-bold text-brand-text uppercase tracking-wide">
                      Enter 6-Digit OTP Code
                    </label>
                    <div className="flex gap-2 justify-between">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={(el) => (inputRefs.current[idx] = el)}
                          type="text"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          onPaste={handlePaste}
                          className="w-12 h-12 text-center font-heading font-black text-lg sm:text-xl rounded-xl border border-brand-border bg-brand-bg/10 focus:outline-none focus:border-brand-teal focus:bg-white transition-all min-w-0"
                        />
                      ))}
                    </div>
                    {otpError && <p className="text-[10px] text-brand-coral font-bold pl-1 leading-none">{otpError}</p>}
                  </div>

                  {/* Verify actions */}
                  <button
                    type="submit"
                    className="w-full inline-flex items-center justify-center gap-1.5 h-11 bg-brand-coral hover:bg-brand-coral-dark text-white rounded-xl font-heading font-black text-sm transition-all shadow-xs hover:shadow active:scale-95 cursor-pointer"
                  >
                    <span>Verify & Log In</span>
                    <ChevronRight size={15} />
                  </button>

                  {/* Verification support options */}
                  <div className="flex justify-between items-center text-xs flex-wrap gap-2 pt-2 border-t border-brand-border/40">
                    <button
                      type="button"
                      onClick={() => setStep(1)}
                      className="font-heading font-bold text-brand-teal hover:underline"
                    >
                      Change Email
                    </button>

                    <button
                      type="button"
                      onClick={handleResendOtp}
                      disabled={!canResend}
                      className={`font-heading font-bold ${
                        canResend ? 'text-brand-text hover:underline cursor-pointer' : 'text-brand-muted cursor-not-allowed'
                      }`}
                    >
                      {canResend ? 'Resend OTP' : `Resend in ${timer}s`}
                    </button>
                  </div>
                </form>
              )}

              {/* Secure indicator note */}
              <div className="bg-brand-bg/30 p-4 rounded-xl border border-brand-border/40 flex items-start gap-2.5 text-[10px] text-brand-muted">
                <ShieldCheck size={16} className="text-brand-teal shrink-0 mt-0.5" />
                <p className="font-sans leading-relaxed text-left">
                  Secure OTP credentials protect your shopper profile. By proceeding, you agree to PawsAndCare privacy policies.
                </p>
              </div>

            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
