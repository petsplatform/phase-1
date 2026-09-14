import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import { authApi } from "../api/authApi";

const parseCallbackParams = () => {
  const query = new URLSearchParams(window.location.search);
  const hash = new URLSearchParams(window.location.hash.replace(/^#/, ""));
  const read = (key) => query.get(key) || hash.get(key) || "";
  const customerValue = read("customer");

  let customer = null;
  if (customerValue) {
    try {
      customer = JSON.parse(decodeURIComponent(customerValue));
    } catch {
      customer = null;
    }
  }

  return {
    provider: read("provider") || sessionStorage.getItem("petcare_social_provider") || "",
    code: read("code"),
    state: read("state"),
    token: read("token"),
    customer,
    error: read("error") || read("message"),
  };
};

const SocialAuthCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState("");
  const callbackParams = useMemo(parseCallbackParams, []);

  useEffect(() => {
    let cancelled = false;

    const finishSocialLogin = async () => {
      if (callbackParams.error) {
        setError(callbackParams.error);
        return;
      }

      if (!callbackParams.code && !callbackParams.token) {
        setError("Missing social login response. Please try again.");
        return;
      }

      try {
        await authApi.completeSocialLogin(callbackParams);
        if (!cancelled) navigate("/", { replace: true });
      } catch (err) {
        if (!cancelled) {
          setError(err.response?.data?.message || err.message || "Social login failed. Please try again.");
        }
      }
    };

    finishSocialLogin();

    return () => {
      cancelled = true;
    };
  }, [callbackParams, navigate]);

  return (
    <div className="min-h-screen bg-[#fffdf7]">
      <Header />
      <main className="flex min-h-[55vh] items-center justify-center px-4 py-12">
        <section className="w-full max-w-md rounded-2xl border border-[#17345f1a] bg-white p-8 text-center shadow-[0_20px_70px_rgba(18,42,80,0.12)]">
          <h1 className="text-2xl font-extrabold text-[#122a50]">
            {error ? "Social Login Failed" : "Signing You In"}
          </h1>
          <p className="mt-3 text-sm font-semibold leading-6 text-[#122a50b2]">
            {error || "Please wait while we finish connecting your account."}
          </p>
          {error && (
            <Link
              to="/login"
              className="mt-6 inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-6 text-sm font-extrabold text-white transition-colors hover:bg-[#d9aa3d]"
            >
              Back to Login
            </Link>
          )}
        </section>
      </main>
      <Footer />
    </div>
  );
};

export default SocialAuthCallback;
