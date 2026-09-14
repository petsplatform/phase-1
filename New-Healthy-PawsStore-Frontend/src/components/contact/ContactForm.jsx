import { motion, useReducedMotion } from "framer-motion";
import {
  Mail,
  PawPrint,
  PencilLine,
  Phone,
  Send,
  Tag,
  User,
} from "lucide-react";
import { useState } from "react";
import formDog from "../../assets/images/contactimage.png";
import { inquiryApi } from "../../api/inquiryApi";

const initialForm = {
  name: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const fields = [
  { name: "name", label: "Your Name", type: "text", icon: User, maxLength: 50 },
  { name: "email", label: "Your Email", type: "email", icon: Mail, maxLength: 100 },
  { name: "phone", label: "Phone Number", type: "tel", icon: Phone, maxLength: 10 },
  { name: "subject", label: "Subject", type: "text", icon: Tag, maxLength: 100 },
];

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const namePattern = /^[A-Za-z][A-Za-z\s'.-]*$/;

function validateField(name, value) {
  const trimmedValue = value.trim();

  if (name === "name") {
    if (!trimmedValue) return "Name is required.";
    if (trimmedValue.length < 2) return "Name must be at least 2 characters.";
    if (trimmedValue.length > 50) return "Name must not exceed 50 characters.";
    if (!namePattern.test(trimmedValue)) return "Name can only include letters, spaces, apostrophes, dots, and hyphens.";
    if (!/[A-Za-z]/.test(trimmedValue)) return "Name must include letters.";
  }

  if (name === "email") {
    if (!trimmedValue) return "Email is required.";
    if (!emailPattern.test(trimmedValue)) return "Enter a valid email address.";
    if (trimmedValue.length > 100) return "Email must not exceed 100 characters.";
  }

  if (name === "phone") {
    if (!trimmedValue) return "Phone number is required.";
    const digitCount = trimmedValue.replace(/\D/g, "").length;
    if (digitCount !== 10) return "Phone number must be exactly 10 digits.";
  }

  if (name === "subject") {
    if (!trimmedValue) return "Subject is required.";
    if (trimmedValue.length < 2) return "Subject must be at least 2 characters.";
    if (trimmedValue.length > 100) return "Subject must not exceed 100 characters.";
  }

  if (name === "message") {
    if (!trimmedValue) return "Message is required.";
    if (trimmedValue.length < 10) return "Message must be at least 10 characters.";
    if (trimmedValue.length > 1000) return "Message must not exceed 1000 characters.";
  }

  return "";
}

function validate(values) {
  const errors = {};

  for (const fieldName of Object.keys(initialForm)) {
    const error = validateField(fieldName, values[fieldName] || "");
    if (error) errors[fieldName] = error;
  }

  return errors;
}

export default function ContactForm() {
  const [values, setValues] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [status, setStatus] = useState("");
  const [loading, setLoading] = useState(false);
  const reduceMotion = useReducedMotion();

  const handleChange = (event) => {
    const { name, value } = event.target;
    const nextVal = name === "phone" ? value.replace(/\D/g, "").slice(0, 10) : value;
    setValues((current) => ({ ...current, [name]: nextVal }));
    setErrors((current) => ({ ...current, [name]: "" }));
    setStatus("");
  };

  const handleBlur = (event) => {
    const { name, value } = event.target;
    const error = validateField(name, value);
    setErrors((current) => ({ ...current, [name]: error }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const nextErrors = validate(values);
    setErrors(nextErrors);

    if (Object.keys(nextErrors).length) return;

    setLoading(true);
    setStatus("");
    try {
      await inquiryApi.create(values);
      setStatus("Thanks! Our pet care team will get back to you soon.");
      setValues(initialForm);
    } catch (error) {
      setStatus(error.message || "Unable to send your message. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 22 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="relative h-full min-h-[336px] overflow-hidden rounded-[18px] border border-borderSoft bg-white px-[18px] py-[22px] shadow-contact sm:px-[26px] lg:px-[30px]"
      aria-labelledby="contact-form-title"
    >
      <h2
        id="contact-form-title"
        className="flex items-center gap-3 font-display text-[22px] font-extrabold leading-none text-textMain"
      >
        <PawPrint size={18} className="text-secondary" fill="currentColor" />
        Send Us a Message
      </h2>
      <p className="mt-[14px] max-w-[500px] text-[12px] font-semibold leading-tight text-muted">
        Fill out the form below and our team will get back to you as soon as
        possible.
      </p>

      <form
        onSubmit={handleSubmit}
        noValidate
        className="relative z-10 mt-[22px] grid max-w-[438px] gap-[13px]"
      >
        <div className="grid gap-x-[20px] gap-y-[13px] sm:grid-cols-2">
          {fields.map(({ name, label, type, icon: Icon, maxLength }) => (
            <label key={name} className="block">
              <span className="sr-only">{label}</span>
              <span className="relative block">
                <Icon
                  size={15}
                  className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted/80"
                />
                <input
                  name={name}
                  type={type}
                  value={values[name]}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder={label}
                  aria-invalid={Boolean(errors[name])}
                  maxLength={maxLength}
                  required={name !== "phone"}
                  className="h-[39px] w-full rounded-lg border border-borderSoft bg-white px-[39px] text-[12px] font-semibold text-textMain outline-none transition placeholder:text-muted/80 focus:border-secondary focus:ring-2 focus:ring-sage"
                />
              </span>
              {errors[name] && (
                <span className="mt-1 block text-[12px] font-bold text-orange">
                  {errors[name]}
                </span>
              )}
            </label>
          ))}
        </div>

        <label className="block">
          <span className="sr-only">How can we help you?</span>
          <span className="relative block">
            <PencilLine
              size={15}
              className="pointer-events-none absolute left-4 top-3.5 text-muted/80"
            />
            <textarea
              name="message"
              value={values.message}
              onChange={handleChange}
              onBlur={handleBlur}
              placeholder="How can we help you?"
              aria-invalid={Boolean(errors.message)}
              maxLength={1000}
              required
              className="min-h-[86px] w-full resize-y rounded-lg border border-borderSoft bg-white px-[39px] py-3.5 text-[12px] font-semibold text-textMain outline-none transition placeholder:text-muted/80 focus:border-secondary focus:ring-2 focus:ring-sage"
            />
          </span>
          {errors.message && (
            <span className="mt-1 block text-[12px] font-bold text-orange">
              {errors.message}
            </span>
          )}
        </label>

        {status && (
          <p className="rounded-lg bg-iconBg px-4 py-3 text-[13px] font-extrabold text-secondaryDark">
            {status}
          </p>
        )}

        <button
          type="submit"
          disabled={loading}
          className="mt-[2px] inline-flex h-[40px] w-full items-center justify-center gap-2 rounded-lg bg-secondaryDark px-5 text-[13px] font-extrabold text-white transition hover:scale-[1.02] hover:bg-primaryDark disabled:cursor-not-allowed disabled:opacity-70 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Send size={15} fill="currentColor" />
          {loading ? "Sending..." : "Send Message"}
        </button>
      </form>

      <div className="pointer-events-none absolute bottom-[13px] right-[6px] hidden h-[248px] w-[126px] lg:block">
        <img
          src={formDog}
          alt="Happy puppy wearing a HealthyPaws-style green bandana"
          className="h-full w-full object-contain object-bottom"
          loading="lazy"
        />
      </div>
    </motion.section>
  );
}
