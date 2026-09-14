import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Save } from "lucide-react";
import { useForm } from "react-hook-form";
import { accountDetailsSchema } from "../../schemas/accountDetailsSchema";

export default function AccountDetailsForm({ profile, saving = false, error = "", onSubmit }) {
  const { register, handleSubmit, reset, formState: { errors } } = useForm({
    resolver: zodResolver(accountDetailsSchema),
    defaultValues: profile,
  });

  useEffect(() => {
    reset(profile);
  }, [profile, reset]);

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="rounded-[16px] bg-white p-1">
      <div className="grid gap-4 md:grid-cols-2">
        <Field name="fullName" label="Full Name" register={register} error={errors.fullName?.message} />
        <Field name="email" label="Email Address" register={register} error={errors.email?.message} />
        <Field name="phone" label="Phone Number" register={register} error={errors.phone?.message} />
      </div>
      {error && <p className="mt-4 rounded-lg bg-sageLight px-4 py-3 text-[13px] font-extrabold text-error">{error}</p>}
      <button
        type="submit"
        disabled={saving}
        className="mt-6 inline-flex h-11 min-w-[180px] items-center justify-center gap-2 rounded-lg bg-secondaryDark px-5 text-[13px] font-extrabold text-white transition hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-60"
      >
        <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
      </button>
    </form>
  );
}

function Field({ name, label, register, error, type = "text", value, readOnly }) {
  return (
    <label>
      <span className="mb-2 block text-[13px] font-semibold text-textMain">{label}</span>
      <input {...(register ? register(name) : {})} type={type} value={value} readOnly={readOnly} className="h-11 w-full rounded-lg border border-borderSoft px-4 text-[13px] font-semibold outline-none" />
      {error && <span className="mt-1 block text-[12px] font-bold text-error">{error}</span>}
    </label>
  );
}
