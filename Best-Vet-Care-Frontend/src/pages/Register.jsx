import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { HeartIcon, PackageIcon, TruckIcon } from "../components/common/HeaderIcons";
import dogImage from "../assets/logo/dog.png";
import { useAuth } from "../context/AuthContext";
import SocialAuthButtons from "../components/auth/SocialAuthButtons";

const features = [
  { title: "Quality Products", text: "Best quality products for your pets", icon: PackageIcon },
  { title: "Fast Delivery", text: "Quick and reliable delivery at your door", icon: TruckIcon },
  { title: "Happy Pets", text: "Because your pets deserve the best care", icon: HeartIcon },
];

const EyeIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M2.8 12s3.4-6 9.2-6 9.2 6 9.2 6-3.4 6-9.2 6-9.2-6-9.2-6Z" stroke="currentColor" strokeWidth="2" />
    <path d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z" stroke="currentColor" strokeWidth="2" />
  </svg>
);

const EyeOffIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="m3 3 18 18" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
    <path d="M10.6 10.7A3 3 0 0 0 13.3 13.4M7.3 7.5C4.4 9.2 2.8 12 2.8 12s3.4 6 9.2 6c1.6 0 3-.4 4.2-1M20.3 14.4c.6-.7.9-1.3.9-1.3S17.8 6 12 6c-.7 0-1.4.1-2 .2" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
  </svg>
);

const PawPattern = () => (
  <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
    <span className="absolute left-[8%] top-[12%] h-8 w-8 rounded-full bg-[#d9aa3d]/15" />
    <span className="absolute right-[18%] top-[20%] h-10 w-10 rounded-full bg-[#17345f]/10" />
    <span className="absolute bottom-[24%] left-[28%] h-10 w-10 rounded-full bg-[#d9aa3d]/15" />
    <span className="absolute bottom-[-80px] right-[-70px] h-48 w-48 rounded-full bg-[#17345f]/10" />
    <span className="absolute bottom-[-55px] left-[-45px] h-40 w-40 rounded-full bg-[#d9aa3d]/15" />
  </div>
);

const AuthFeature = ({ title, text, icon: Icon }) => (
  <div className="flex items-start gap-4">
    <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
      <Icon className="h-5 w-5" />
    </span>
    <span>
      <span className="block text-sm font-extrabold text-[#122a50]">{title}</span>
      <span className="mt-1 block max-w-[180px] text-xs font-medium leading-5 text-[#122a50b2]">{text}</span>
    </span>
  </div>
);

const Register = () => {
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", password: "", confirm: "" });
  const [errors, setErrors] = useState({});
  const [serverError, setServerError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { register } = useAuth();

  useEffect(() => {
    document.title = "Register | Best Vet Care";
  }, []);

  const update = (field) => (e) => {
    const value = field === "phone" ? e.target.value.replace(/\D/g, "").slice(0, 10) : e.target.value;
    setForm((f) => ({ ...f, [field]: value }));
    if (errors[field]) {
      setErrors((current) => {
        const next = { ...current };
        delete next[field];
        return next;
      });
    }
  };

  const validate = () => {
    const nextErrors = {};

    const nameVal = form.name.trim();
    if (!nameVal) {
      nextErrors.name = "Full name is required.";
    } else if (nameVal.length < 2) {
      nextErrors.name = "Full name must be at least 2 characters.";
    } else if (nameVal.length > 50) {
      nextErrors.name = "Full name must not exceed 50 characters.";
    }

    const emailVal = form.email.trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    const phoneDigits = form.phone.replace(/\D/g, "");
    if (!phoneDigits) {
      nextErrors.phone = "Phone number is required.";
    } else if (phoneDigits.length !== 10) {
      nextErrors.phone = "Phone number must be exactly 10 digits.";
    }

    if (!form.password) {
      nextErrors.password = "Password is required.";
    } else if (form.password.length < 6) {
      nextErrors.password = "Password must be at least 6 characters.";
    } else if (form.password.length > 50) {
      nextErrors.password = "Password must not exceed 50 characters.";
    }

    if (!form.confirm) {
      nextErrors.confirm = "Confirm password is required.";
    } else if (form.password !== form.confirm) {
      nextErrors.confirm = "Passwords do not match.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setServerError("");
    if (!validate()) return;

    setLoading(true);
    try {
      await register({ name: form.name, email: form.email, phone: form.phone, password: form.password });
      navigate("/");
    } catch (err) {
      setServerError(err.response?.data?.message || err.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleSocialError = (message) => {
    setErrors({});
    setServerError(message || "");
  };

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      <Header />
      <main className="relative overflow-hidden px-4 py-10 sm:px-5 lg:px-[22px]">
        <PawPattern />
        <section className="relative mx-auto grid max-w-[1240px] items-center gap-10 lg:grid-cols-[1fr_520px]">
          <div className="order-2 lg:order-1 text-left">
            <p className="text-[34px] font-extrabold leading-tight text-[#122a50] sm:text-[44px]">
              Create Your <span className="block text-[#d9aa3d]">Account</span>
            </p>
            <p className="mt-4 max-w-md text-base font-medium leading-7 text-[#122a50b2]">
              Join Best-Vet-Care and give your pets the best they deserve.
            </p>
            <div className="mt-10 space-y-6">
              {features.map((feature) => (
                <AuthFeature key={feature.title} {...feature} />
              ))}
            </div>
            <img src={dogImage} alt="Happy dog and cat" className="mt-10 hidden max-h-[320px] w-auto object-contain md:block" />
          </div>

          <section className="order-1 rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_20px_70px_rgba(18,42,80,0.12)] sm:p-8 lg:order-2">
            <div className="text-center">
              <h1 className="text-2xl font-extrabold text-[#122a50]">Create Your Account</h1>
              <p className="mt-2 text-sm font-medium text-[#122a50b2]">Fill in the details below to get started</p>
            </div>

            {serverError && (
              <p className="mt-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{serverError}</p>
            )}

            <form className="mt-8 space-y-5" onSubmit={handleSubmit} noValidate>
              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Full Name *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Min 2, Max 50 chars</span>
                </div>
                <input
                  type="text"
                  value={form.name}
                  maxLength={50}
                  onChange={update("name")}
                  placeholder="Enter your full name"
                  className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                    errors.name ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                />
                {errors.name && <p className="mt-1 text-xs font-semibold text-red-600">{errors.name}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Email Address *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Valid email</span>
                </div>
                <input
                  type="email"
                  value={form.email}
                  maxLength={100}
                  onChange={update("email")}
                  placeholder="Enter your email"
                  className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                    errors.email ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                />
                {errors.email && <p className="mt-1 text-xs font-semibold text-red-600">{errors.email}</p>}
              </label>

              <label className="block text-left">
                <div className="mb-1 flex items-center justify-between">
                  <span className="text-sm font-extrabold text-[#122a50]">Phone Number *</span>
                  <span className="text-[10px] font-semibold text-[#122a50]/50">Exact 10 digits</span>
                </div>
                <input
                  type="tel"
                  value={form.phone}
                  maxLength={10}
                  onChange={update("phone")}
                  placeholder="Enter 10 digit phone number"
                  className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                    errors.phone ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                  }`}
                />
                {errors.phone && <p className="mt-1 text-xs font-semibold text-red-600">{errors.phone}</p>}
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#122a50]">Password *</span>
                    <span className="text-[10px] font-semibold text-[#122a50]/50">Min 6 chars</span>
                  </div>
                  <span className="relative block">
                    <input
                      type={showPassword ? "text" : "password"}
                      value={form.password}
                      maxLength={50}
                      onChange={update("password")}
                      placeholder="Password"
                      className={`h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                        errors.password ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#122a5070] transition-colors hover:text-[#d9aa3d]" onClick={() => setShowPassword((v) => !v)} aria-label={showPassword ? "Hide" : "Show"}>
                      {showPassword ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </span>
                  {errors.password && <p className="mt-1 text-xs font-semibold text-red-600">{errors.password}</p>}
                </label>

                <label className="block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#122a50]">Confirm *</span>
                    <span className="text-[10px] font-semibold text-[#122a50]/50">Must match</span>
                  </div>
                  <span className="relative block">
                    <input
                      type={showConfirm ? "text" : "password"}
                      value={form.confirm}
                      maxLength={50}
                      onChange={update("confirm")}
                      placeholder="Confirm Password"
                      className={`h-12 w-full rounded-lg border bg-white px-4 pr-12 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] ${
                        errors.confirm ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                    <button type="button" className="absolute right-4 top-1/2 -translate-y-1/2 text-[#122a5070] transition-colors hover:text-[#d9aa3d]" onClick={() => setShowConfirm((v) => !v)} aria-label={showConfirm ? "Hide" : "Show"}>
                      {showConfirm ? <EyeOffIcon /> : <EyeIcon />}
                    </button>
                  </span>
                  {errors.confirm && <p className="mt-1 text-xs font-semibold text-red-600">{errors.confirm}</p>}
                </label>
              </div>

              <label className="flex items-start gap-2 text-sm font-semibold leading-6 text-[#122a50] text-left">
                <input type="checkbox" required className="mt-1 h-4 w-4 rounded border-[#17345f1a] accent-[#d9aa3d]" />
                <span>
                  I agree to the{" "}
                  <Link to="/terms-conditions" className="font-extrabold text-[#d9aa3d] hover:text-[#17345f]">Terms & Conditions</Link>
                  {" "}and{" "}
                  <Link to="/privacy-policy" className="font-extrabold text-[#d9aa3d] hover:text-[#17345f]">Privacy Policy</Link>
                </span>
              </label>

              <button
                type="submit"
                disabled={loading}
                className="h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] disabled:opacity-60 cursor-pointer"
              >
                {loading ? "Creating Account..." : "Create Account"}
              </button>
            </form>

            <div className="mt-6">
              <SocialAuthButtons mode="signup" disabled={loading} onError={handleSocialError} />
            </div>

            <p className="mt-6 text-center text-sm font-semibold text-[#122a50]">
              Already have an account?{" "}
              <Link to="/login" className="font-extrabold text-[#d9aa3d] hover:text-[#17345f]">Login</Link>
            </p>
          </section>
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default Register;
