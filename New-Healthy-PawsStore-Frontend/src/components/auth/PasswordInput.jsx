import { Eye, EyeOff, Lock } from "lucide-react";
import { useState } from "react";

export default function PasswordInput({
  id,
  value,
  onChange,
  error,
  describedBy,
}) {
  const [visible, setVisible] = useState(false);

  return (
    <label className="block">
      <span className="sr-only">Password</span>
      <span className="relative block">
        <Lock
          className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 text-textMain"
          size={20}
        />
        <input
          id={id}
          name="password"
          type={visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder="Password"
          autoComplete="current-password"
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          className={`h-[54px] w-full rounded-xl border bg-white px-14 pr-14 text-[15px] font-semibold text-textMain outline-none transition placeholder:text-muted focus:ring-2 focus:ring-sage ${
            error ? "border-error" : "border-borderSoft focus:border-secondary"
          }`}
        />
        <button
          type="button"
          aria-label={visible ? "Hide password" : "Show password"}
          onClick={() => setVisible((current) => !current)}
          className="absolute right-4 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-full text-textMain transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          {visible ? <EyeOff size={19} /> : <Eye size={19} />}
        </button>
      </span>
    </label>
  );
}
