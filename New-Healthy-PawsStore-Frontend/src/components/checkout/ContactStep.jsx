import { CheckCircle2, CircleUserRound, ShieldAlert } from "lucide-react";
import { getStoredAuthUser } from "../../services/authService";

export default function ContactStep({
  register,
  errors,
  verified,
  editing,
  loading,
  error,
  values,
  onContinue,
  onChange,
}) {
  const storedUser = getStoredAuthUser();
  const contactName = values.fullName || storedUser?.name || "";
  const contactEmail = values.email || storedUser?.email || "";
  const contactPhone = values.phone || storedUser?.phone || "";

  if (verified && !editing) {
    return (
      <section id="contact-section" className="rounded-[20px] border border-borderSoft bg-white shadow-contact">
        <div className="p-4 sm:p-6">
          <div className="flex items-center justify-between gap-2 border-b border-borderSoft/60 pb-3">
            <div className="flex items-center gap-2 min-w-0">
              <CheckCircle2 className="size-5 shrink-0 text-orange" />
              <h2 className="font-display text-[18px] font-extrabold text-textMain sm:text-[20px]">Contact Details</h2>
            </div>
            <button
              type="button"
              onClick={onChange}
              className="shrink-0 text-[13px] font-extrabold text-orange transition hover:text-primaryDark sm:text-[14px]"
            >
              Change
            </button>
          </div>
          <div className="mt-3 min-w-0 sm:pl-7">
            {contactName && (
              <p className="truncate text-[13px] font-extrabold text-textMain">{contactName}</p>
            )}
            <p className="mt-0.5 truncate text-[12px] font-semibold text-muted">
              {[contactEmail, contactPhone].filter(Boolean).join(" • ")}
            </p>
          </div>
        </div>
      </section>
    );
  }

  const isBlockedError = Boolean(storedUser) && typeof error === "string" && error.toLowerCase().includes("blocked");

  return (
    <section id="contact-section" className="rounded-[20px] border border-borderSoft bg-white shadow-contact">
      <div className="flex items-center gap-2 border-b border-borderSoft px-5 py-4 sm:px-7">
        <CircleUserRound className="size-5 text-orange" />
        <h2 className="font-display text-[20px] font-extrabold text-textMain">Contact</h2>
      </div>

      <div className="p-5 sm:p-7">
        <p className="mb-5 rounded-xl bg-sageLight px-4 py-3 text-[14px] font-semibold leading-relaxed text-textMain">
          Add your details to continue. If this email is already registered, we will log you in; otherwise we will create your account.
        </p>

        {error && (
          isBlockedError ? (
            <div className="mb-4 rounded-2xl border border-red-200 bg-red-50 p-4 text-left">
              <div className="flex items-start gap-3">
                <div className="rounded-xl bg-red-100 p-1.5 text-red-600 shrink-0 mt-0.5">
                  <ShieldAlert size={18} className="stroke-[2.5]" />
                </div>
                <div>
                  <h4 className="font-heading font-black text-sm text-red-900">Account Blocked</h4>
                  <p className="text-xs font-sans font-bold text-red-700 mt-0.5">{error}</p>
                  <p className="text-[10px] font-sans text-red-600 mt-1">Please contact customer support to resolve this issue.</p>
                </div>
              </div>
            </div>
          ) : (
            <p className="mb-4 rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">{error}</p>
          )
        )}

        <div className="grid gap-4">
          <Field name="fullName" label="Full Name" placeholder="Enter your full name" register={register} error={errors.fullName?.message} />
          <Field name="email" label="Email Address" type="email" placeholder="Enter your email" register={register} error={errors.email?.message} />
          <Field name="phone" label="Mobile Number" type="tel" placeholder="Enter your mobile number" register={register} error={errors.phone?.message} />
        </div>

        <button
          type="button"
          onClick={onContinue}
          disabled={loading}
          className="mt-5 h-12 w-full rounded-xl bg-secondaryDark text-[15px] font-extrabold text-white shadow-card transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
        >
          {loading ? "Continuing..." : "Continue to Checkout"}
        </button>
      </div>
    </section>
  );
}

function Field({ name, label, type = "text", placeholder, register, error }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[14px] font-extrabold text-textMain">{label}</span>
      <input
        {...register(name)}
        type={type}
        placeholder={placeholder}
        aria-invalid={Boolean(error)}
        className="h-12 w-full rounded-xl border border-borderSoft bg-white px-4 text-[14px] font-semibold text-textMain outline-none placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage"
      />
      {error && <span className="mt-1 block text-[12px] font-bold text-error">{error}</span>}
    </label>
  );
}
