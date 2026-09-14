import {
  Building,
  CreditCard,
  Home,
  Mail,
  MapPin,
  Phone,
  User,
} from "lucide-react";

const states = ["California", "Florida", "New York", "Ontario", "Texas"];

const fields = [
  { name: "fullName", label: "Full Name", placeholder: "Enter your full name", icon: User, autoComplete: "name" },
  { name: "phone", label: "Phone Number", placeholder: "Enter your phone number", icon: Phone, autoComplete: "tel" },
  { name: "address", label: "Street Address", placeholder: "House number and street name", icon: Home, wide: true, autoComplete: "street-address" },
  { name: "city", label: "City", placeholder: "Enter your city", icon: Building, autoComplete: "address-level2" },
];

export default function ShippingInformation({ register, errors }) {
  return (
    <section className="rounded-[20px] border border-borderSoft bg-white p-5 shadow-contact sm:p-7">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h2 className="flex items-center gap-3 font-display text-[24px] font-extrabold text-textMain">
            <MapPin className="text-secondaryDark" size={24} />
            Shipping Information
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-muted">Enter your shipping address</p>
        </div>
        <label className="inline-flex items-center gap-2 text-[13px] font-semibold text-textMain">
          <input type="checkbox" {...register("shipDifferent")} className="size-4 rounded border-borderSoft accent-secondaryDark" />
          Ship to a different address
        </label>
      </div>

      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        {fields.map(({ name, label, placeholder, icon: Icon, wide, autoComplete }) => (
          <Field
            key={name}
            name={name}
            label={label}
            placeholder={placeholder}
            Icon={Icon}
            register={register}
            error={errors[name]?.message}
            wide={wide}
            autoComplete={autoComplete}
          />
        ))}

        <SelectField name="state" label="State" Icon={CreditCard} register={register} error={errors.state?.message} options={states} />
        <Field name="postalCode" label="Postal Code" placeholder="Enter postal code" Icon={Mail} register={register} error={errors.postalCode?.message} autoComplete="postal-code" />
      </div>
    </section>
  );
}

function Field({ name, label, placeholder, Icon, register, error, wide, autoComplete }) {
  return (
    <label className={wide ? "block sm:col-span-2" : "block"}>
      <span className="mb-2 block text-[13px] font-semibold text-textMain">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <input
          {...register(name)}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          className="h-12 w-full rounded-xl border border-borderSoft bg-white px-11 text-[14px] font-semibold text-textMain outline-none placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage"
        />
      </span>
      {error && <span className="mt-1 block text-[12px] font-bold text-error">{error}</span>}
    </label>
  );
}

function SelectField({ name, label, Icon, register, error, options }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[13px] font-semibold text-textMain">{label}</span>
      <span className="relative block">
        <Icon className="absolute left-4 top-1/2 -translate-y-1/2 text-muted" size={18} />
        <select
          {...register(name)}
          aria-invalid={Boolean(error)}
          className="h-12 w-full rounded-xl border border-borderSoft bg-white px-11 text-[14px] font-semibold text-textMain outline-none focus:border-secondary focus:ring-2 focus:ring-sage"
        >
          <option value="">Select {label.toLowerCase()}</option>
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </span>
      {error && <span className="mt-1 block text-[12px] font-bold text-error">{error}</span>}
    </label>
  );
}
