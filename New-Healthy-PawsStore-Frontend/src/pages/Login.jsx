import AuthTrustBar from "../components/auth/AuthTrustBar";
import LoginBenefitsPanel from "../components/auth/LoginBenefitsPanel";
import LoginForm from "../components/auth/LoginForm";
import Header from "../components/layout/Header";

export default function Login() {
  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main className="px-4 py-6 sm:px-5 lg:px-[56px]">
        <div className="mx-auto grid max-w-[1400px] overflow-hidden rounded-[22px] border border-borderSoft bg-white shadow-[0_10px_28px_var(--color-shadow)] lg:min-h-[640px] lg:grid-cols-[46fr_54fr]">
          <LoginForm />
          <LoginBenefitsPanel />
        </div>
        <AuthTrustBar />
      </main>
    </div>
  );
}
