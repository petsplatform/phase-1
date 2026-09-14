import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import {
  ArrowRight,
  Eye,
  EyeOff,
  Loader2,
  Lock,
  Mail,
  PawPrint,
  ShieldCheck,
  Store,
} from "lucide-react";
import { useLocation, useNavigate } from "react-router-dom";
import { adminApi, getAdminToken, setAdminSession } from "../../lib/api";
import { showToast } from "../../lib/toast";

const heroPets =
  "https://images.unsplash.com/photo-1516734212186-a967f81ad0d7?auto=format&fit=crop&w=1100&q=85";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [remember, setRemember] = useState(true);
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = location.state?.from
    ? `${location.state.from.pathname}${location.state.from.search || ""}`
    : "/dashboard";

  useEffect(() => {
    document.title = "Login | Admin Portal";
    if (getAdminToken()) {
      navigate("/dashboard", { replace: true });
    }
    if (localStorage.getItem("admin_session_expired") === "true") {
      localStorage.removeItem("admin_session_expired");
      showToast({ type: "error", title: "Session Expired", message: "Session expired. Please login again." });
    }
  }, [navigate]);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const session = await adminApi.login({ email: email.trim(), password });
      setAdminSession(session, remember);
      setLoading(false);
      navigate(redirectTo, { replace: true });
    } catch (err) {
      const message = err.message || "Invalid email or password";
      setError(message);
      showToast({ type: "error", title: "Error", message });
      setLoading(false);
    }
  };

  return (
    <div className="relative flex min-h-screen w-full items-center justify-center overflow-hidden bg-[#f4f6f8] p-4 font-sans sm:p-6">
      <div className="absolute inset-x-0 top-0 h-1/2 bg-gradient-to-b from-[#e8edf3] to-transparent" />
      <div className="absolute -left-36 -top-40 h-[380px] w-[380px] rounded-full bg-[#cbd5e1]/45 blur-3xl" />
      <div className="absolute -bottom-40 -right-28 h-[420px] w-[420px] rounded-full bg-[#dbeafe]/55 blur-3xl" />

      <motion.div
        initial={{ opacity: 0, y: 28 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: "easeOut" }}
        className="z-10 grid w-full max-w-[1120px] overflow-hidden rounded-[24px] border border-[#d8dee7] bg-white shadow-[0_28px_80px_rgba(15,23,42,0.14)] lg:grid-cols-[0.95fr_1.05fr]"
      >
        <aside className="relative hidden min-h-[680px] overflow-hidden bg-[#111827] lg:block">
          <div className="absolute inset-0 bg-[linear-gradient(135deg,rgba(255,255,255,0.08)_0,rgba(255,255,255,0.08)_1px,transparent_1px,transparent_44px)]" />
          <div className="absolute -left-24 top-20 h-64 w-64 rounded-full bg-[#334155] blur-3xl" />
          <div className="absolute -right-16 bottom-24 h-72 w-72 rounded-full bg-[#1d4ed8]/25 blur-3xl" />

          <div className="relative flex h-full flex-col justify-between p-9 text-white">
            <div>
              <div className="mb-8 flex items-center gap-3">
                <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white text-[#111827]">
                  <PawPrint size={23} />
                </div>
                <div>
                  <p className="text-sm font-black tracking-[0.18em]">
                    ADMIN PORTAL
                  </p>
                  <p className="text-xs font-semibold text-slate-300">
                    Multi-store pet commerce
                  </p>
                </div>
              </div>

              <h2 className="max-w-[430px] text-[38px] font-bold leading-[1.08] tracking-tight">
                Operational control for every pet store.
              </h2>
              <p className="mt-4 max-w-[390px] text-[15px] font-medium leading-7 text-slate-300">
                Manage catalog, categories, banners, customers and orders from
                one secure workspace.
              </p>
            </div>

            <div>
              <div className="mb-5 overflow-hidden rounded-[22px] border border-white/10 bg-white/10 p-3 shadow-2xl backdrop-blur">
                <img
                  src={heroPets}
                  alt="Pet commerce workspace"
                  className="h-[250px] w-full rounded-[16px] object-cover"
                />
              </div>
            </div>
          </div>
        </aside>

        <main className="relative flex min-h-[680px] items-center justify-center bg-white px-6 py-10 sm:px-10">
          <div className="absolute right-8 top-8 hidden items-center gap-2 rounded-full border border-[#e5e7eb] bg-[#f8fafc] px-3 py-2 text-xs font-bold uppercase tracking-[0.14em] text-[#475569] sm:flex">
            <ShieldCheck size={15} />
            Secure access
          </div>

          <div className="w-full max-w-[460px]">
            <div className="mb-10 flex flex-col items-start">
              <motion.div
                initial={{ scale: 0.86 }}
                animate={{ scale: 1 }}
                transition={{ delay: 0.18, type: "spring", stiffness: 200 }}
                className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#111827] text-white shadow-[0_16px_30px_rgba(15,23,42,0.18)]"
              >
                <Store size={28} />
              </motion.div>
              <p className="text-[12px] font-extrabold uppercase tracking-[0.22em] text-[#64748b]">
                Pets Store Admin Portal
              </p>
              <h1 className="mt-3 text-[34px] font-medium leading-tight tracking-tight text-[#111827] sm:text-[40px]">
                Sign in to your workspace
              </h1>
              <p className="mt-3 max-w-[390px] text-[15px] font-medium leading-6 text-[#64748b]">
                A clean, secure admin experience for day-to-day pet store
                operations.
              </p>
            </div>

            <form onSubmit={handleLogin} className="space-y-6">
              <div className="space-y-2.5">
                <label className="ml-1 text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#334155]">
                  Email Address
                </label>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#94a3b8] transition-colors group-focus-within:text-[#111827]">
                    <Mail size={18} />
                  </div>
                  <input
                    required
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your email"
                    autoComplete="email"
                    className="h-[56px] w-full rounded-[12px] border border-[#d7dde6] bg-white pl-12 pr-4 text-[15px] font-semibold text-[#111827] outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#111827] focus:ring-4 focus:ring-[#11182712]"
                  />
                </div>
              </div>

              <div className="space-y-2.5">
                <div className="ml-1 flex items-center justify-between">
                  <label className="text-[12px] font-extrabold uppercase tracking-[0.16em] text-[#334155]">
                    Password
                  </label>
                </div>
                <div className="group relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-[#111827]">
                    <Lock size={18} />
                  </div>
                  <input
                    required
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Password"
                    autoComplete="current-password"
                    className="h-[56px] w-full rounded-[12px] border border-[#d7dde6] bg-white pl-12 pr-12 text-[15px] font-semibold text-[#111827] outline-none transition-all placeholder:text-[#94a3b8] focus:border-[#111827] focus:ring-4 focus:ring-[#11182712]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 flex items-center pr-4 text-[#94a3b8] transition-colors hover:text-[#111827]"
                  >
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              {error && (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                  {error}
                </div>
              )}

              <button
                disabled={loading}
                type="submit"
                className="group mt-2 flex h-[58px] w-full items-center justify-center gap-3 rounded-[12px] bg-[#111827] text-[15px] font-extrabold text-white shadow-[0_16px_28px_rgba(15,23,42,0.18)] transition-all hover:bg-[#1f2937] active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
              >
                {loading ? (
                  <Loader2 size={20} className="animate-spin" />
                ) : (
                  <>
                    <span>Sign In</span>
                    <motion.div
                      animate={{ x: [0, 4, 0] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      <ArrowRight size={19} strokeWidth={2.6} />
                    </motion.div>
                  </>
                )}
              </button>
            </form>
          </div>
        </main>
      </motion.div>
    </div>
  );
}
