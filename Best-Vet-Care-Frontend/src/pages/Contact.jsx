import { useState } from "react";
import { Link } from "react-router-dom";
import { inquiryApi } from "../api/inquiryApi";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import {
  ChevronDownIcon,
  PhoneIcon,
  SearchIcon,
} from "../components/common/HeaderIcons";
import dogImage from "../assets/logo/dog1.png";
import { useToast } from "../context/ToastContext";

const MailIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path d="M4 6h16v12H4V6Z" stroke="currentColor" strokeWidth="2" />
    <path
      d="m4 7 8 6 8-6"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const SendIcon = ({ className = "h-5 w-5" }) => (
  <svg className={className} viewBox="0 0 24 24" fill="none" aria-hidden="true">
    <path
      d="m22 2-7 20-4-9-9-4 20-7Z"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
    />
  </svg>
);

const contactCards = [
  {
    title: "Call Us",
    primary: "+1 (555) 123-4567",
    secondary: "Mon - Sat: 9AM - 8PM",
    icon: PhoneIcon,
  },
  {
    title: "Email Us",
    primary: "support@bestvetcare.com",
    secondary: "We reply within 24 hours",
    icon: MailIcon,
  },
];

const faqs = [
  {
    id: "delivery-time",
    question: "How long does delivery take?",
    answer:
      "Most orders arrive within 2-5 business days depending on your location.",
  },
  {
    id: "return-policy",
    question: "What is your return policy?",
    answer:
      "You can return unopened products within 7 days for a hassle-free refund.",
  },
  {
    id: "free-shipping",
    question: "Do you offer free shipping?",
    answer:
      "Free-shipping eligibility depends on the active shipping rules configured for the store. View the Shipping Charges page for the current rules.",
  },
  {
    id: "track-order",
    question: "How can I track my order?",
    answer:
      "After your order is shipped, a tracking number will be available in My Account > My Orders. You may also use the Track Order page with your order number and registered email address. Tracking availability depends on the shipping provider.",
  },
  {
    id: "payment-methods",
    question: "What payment methods do you accept?",
    answer:
      "Checkout currently accepts secure online payment through the payment form.",
  },
];

const publicFaqs = faqs.reduce((items, faq) => {
  const question = faq.question?.trim();
  const answer = faq.answer?.trim();
  const key = question?.toLowerCase();
  if (!question || !answer || items.some((item) => item.key === key))
    return items;
  return [...items, { ...faq, question, answer, key }];
}, []);

const subjects = [
  "Order Support",
  "Product Question",
  "Returns & Refunds",
  "Shipping Help",
  "Other",
];

const initialForm = {
  fullName: "",
  email: "",
  phone: "",
  subject: "",
  message: "",
};

const FieldError = ({ children }) =>
  children ? (
    <p className="mt-1 text-xs font-semibold text-[#EF4444]">{children}</p>
  ) : null;

const ContactCard = ({ card }) => {
  const Icon = card.icon;

  return (
    <article className="flex min-h-[94px] min-w-0 items-center gap-4 rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-lg">
      <span className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-full bg-[#f8f1df] text-[#d9aa3d]">
        <Icon className="h-6 w-6" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-extrabold text-[#122a50]">
          {card.title}
        </span>
        <span className="mt-1 block text-sm font-extrabold leading-5 text-[#17345f] [overflow-wrap:anywhere]">
          {card.primary}
        </span>
        <span className="mt-1 block text-xs font-semibold text-[#122a50b2]">
          {card.secondary}
        </span>
      </span>
    </article>
  );
};

const Contact = () => {
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState({});
  const [openFaq, setOpenFaq] = useState(0);
  const { showToast } = useToast();

  const updateField = (field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: "" }));
  };

  const validate = () => {
    const nextErrors = {};

    const nameVal = form.fullName.trim();
    if (!nameVal) {
      nextErrors.fullName = "Full name is required.";
    } else if (nameVal.length < 2) {
      nextErrors.fullName = "Full name must be at least 2 characters.";
    } else if (nameVal.length > 50) {
      nextErrors.fullName = "Full name must not exceed 50 characters.";
    }

    const emailVal = form.email.trim();
    if (!emailVal) {
      nextErrors.email = "Email address is required.";
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailVal)) {
      nextErrors.email = "Please enter a valid email address.";
    } else if (emailVal.length > 100) {
      nextErrors.email = "Email address must not exceed 100 characters.";
    }

    const phoneVal = form.phone.trim();
    if (phoneVal) {
      const phoneDigits = phoneVal.replace(/\D/g, "");
      if (phoneDigits.length !== 10) {
        nextErrors.phone = "Phone number must be exactly 10 digits.";
      }
    }

    if (!form.subject) {
      nextErrors.subject = "Subject is required.";
    }

    const msgVal = form.message.trim();
    if (!msgVal) {
      nextErrors.message = "Message is required.";
    } else if (msgVal.length < 10) {
      nextErrors.message = "Message must be at least 10 characters.";
    } else if (msgVal.length > 1000) {
      nextErrors.message = "Message must not exceed 1000 characters.";
    }

    setErrors(nextErrors);
    return Object.keys(nextErrors).length === 0;
  };

  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!validate()) return;

    setSubmitting(true);
    try {
      await inquiryApi.submit(form);
      setForm(initialForm);
      showToast("Thanks! Your message has been sent.");
    } catch {
      showToast("Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <SEO
        title="Contact Us | Best-Vet-Care"
        description="Contact the Best-Vet-Care support team for orders, products, returns, and pet-care help."
        ogTitle="Contact Us | Best-Vet-Care"
        ogDescription="Have questions or need help? Our friendly Best-Vet-Care team is here to assist."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />

        <main className="px-4 pb-6 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1440px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
                Home
              </Link>
              <span>/</span>
              <span className="font-extrabold text-[#122a50]">Contact Us</span>
            </nav>

            <section className="mt-8 grid gap-7 lg:grid-cols-[1fr_340px_1.2fr] lg:items-center">
              <div>
                <h1 className="text-4xl font-extrabold leading-tight tracking-normal text-[#122a50] md:text-5xl">
                  We&apos;d Love to Hear From You!
                </h1>
                <p className="mt-4 max-w-xl text-base font-semibold leading-7 text-[#122a50b2]">
                  Have questions or need help? Our friendly team is here to
                  assist you and your furry friends.
                </p>
              </div>

              <div className="relative flex min-h-[220px] items-end justify-center overflow-hidden rounded-2xl bg-[#f8f1df] px-6 pt-6 lg:bg-transparent">
                <SearchIcon className="absolute left-8 top-10 h-9 w-9 text-[#d9aa3d]/20" />
                <SearchIcon className="absolute right-7 top-16 h-7 w-7 text-[#d9aa3d]/20" />
                <img
                  src={dogImage}
                  alt="Dog and cat"
                  className="relative z-10 h-56 w-full object-contain object-bottom"
                />
              </div>

              <div className="grid min-w-0 gap-4 sm:grid-cols-2">
                {contactCards.map((card) => (
                  <ContactCard key={card.title} card={card} />
                ))}
              </div>
            </section>

            <section className="mt-8 grid gap-6 lg:grid-cols-[minmax(0,1.45fr)_minmax(360px,1fr)]">
              <form
                className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-sm"
                onSubmit={handleSubmit}
                noValidate
              >
                <h2 className="text-2xl font-extrabold text-[#122a50]">
                  Send Us a Message
                </h2>

                <div className="mt-6 grid gap-5 md:grid-cols-2">
                  <label className="block text-left">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#122a50]">
                        Full Name <span className="text-[#EF4444]">*</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[#122a50b2]">
                        Min 2, Max 50 chars
                      </span>
                    </div>
                    <input
                      type="text"
                      value={form.fullName}
                      maxLength={50}
                      onChange={(event) =>
                        updateField("fullName", event.target.value)
                      }
                      placeholder="Enter your full name"
                      className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-colors placeholder:text-[#122a50b2] focus:border-[#d9aa3d] ${
                        errors.fullName ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                    <FieldError>{errors.fullName}</FieldError>
                  </label>

                  <label className="block text-left">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#122a50]">
                        Email Address <span className="text-[#EF4444]">*</span>
                      </span>
                      <span className="text-[10px] font-semibold text-[#122a50b2]">
                        Valid email
                      </span>
                    </div>
                    <input
                      type="email"
                      value={form.email}
                      maxLength={100}
                      onChange={(event) =>
                        updateField("email", event.target.value)
                      }
                      placeholder="Enter your email address"
                      className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-colors placeholder:text-[#122a50b2] focus:border-[#d9aa3d] ${
                        errors.email ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                    <FieldError>{errors.email}</FieldError>
                  </label>

                  <label className="block text-left">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#122a50]">
                        Phone Number
                      </span>
                      <span className="text-[10px] font-semibold text-[#122a50b2]">
                        Exact 10 digits
                      </span>
                    </div>
                    <input
                      type="tel"
                      value={form.phone}
                      maxLength={10}
                      onChange={(event) =>
                        updateField("phone", event.target.value)
                      }
                      placeholder="Enter 10 digit phone number"
                      className={`h-12 w-full rounded-lg border bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-colors placeholder:text-[#122a50b2] focus:border-[#d9aa3d] ${
                        errors.phone ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                      }`}
                    />
                    <FieldError>{errors.phone}</FieldError>
                  </label>

                  <label className="block text-left">
                    <div className="mb-1 flex items-center justify-between">
                      <span className="text-sm font-extrabold text-[#122a50]">
                        Subject <span className="text-[#EF4444]">*</span>
                      </span>
                    </div>
                    <span className="relative block">
                      <select
                        value={form.subject}
                        onChange={(event) =>
                          updateField("subject", event.target.value)
                        }
                        className={`h-12 w-full appearance-none rounded-lg border bg-white px-4 pr-10 text-sm font-semibold text-[#122a50] outline-none transition-colors focus:border-[#d9aa3d] ${
                          errors.subject ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                        }`}
                      >
                        <option value="">Select a subject</option>
                        {subjects.map((subject) => (
                          <option key={subject} value={subject}>
                            {subject}
                          </option>
                        ))}
                      </select>
                      <ChevronDownIcon className="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-[#122a50b2]" />
                    </span>
                    <FieldError>{errors.subject}</FieldError>
                  </label>
                </div>

                <label className="mt-5 block text-left">
                  <div className="mb-1 flex items-center justify-between">
                    <span className="text-sm font-extrabold text-[#122a50]">
                      Message <span className="text-[#EF4444]">*</span>
                    </span>
                    <span className="text-[10px] font-semibold text-[#122a50b2]">
                      Min 10, Max 1000 chars
                    </span>
                  </div>
                  <textarea
                    value={form.message}
                    maxLength={1000}
                    onChange={(event) =>
                      updateField("message", event.target.value)
                    }
                    placeholder="Type your message here..."
                    rows={5}
                    className={`w-full resize-none rounded-lg border bg-white px-4 py-3 text-sm font-semibold text-[#122a50] outline-none transition-colors placeholder:text-[#122a50b2] focus:border-[#d9aa3d] ${
                      errors.message ? "border-red-300 bg-red-50" : "border-[#17345f1a]"
                    }`}
                  />
                  <FieldError>{errors.message}</FieldError>
                </label>

                <button
                  type="submit"
                  disabled={submitting}
                  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#17345f] px-7 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-70 cursor-pointer"
                >
                  <SendIcon className="h-4 w-4" />
                  {submitting ? "Sending..." : "Send Message"}
                </button>
              </form>

              <aside className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-sm text-left">
                <h2 className="text-2xl font-extrabold text-[#122a50]">
                  Frequently Asked Questions
                </h2>
                <div className="mt-5 space-y-3">
                  {publicFaqs.map((faq, index) => {
                    const isOpen = openFaq === index;
                    const panelId = `faq-panel-${faq.id}`;
                    const buttonId = `faq-button-${faq.id}`;
                    return (
                      <div
                        key={faq.id}
                        className="rounded-lg border border-[#17345f1a] bg-white"
                      >
                        <button
                          id={buttonId}
                          type="button"
                          className="flex w-full items-center justify-between gap-4 px-4 py-3 text-left text-sm font-extrabold text-[#122a50] cursor-pointer"
                          onClick={() => setOpenFaq(isOpen ? -1 : index)}
                          aria-expanded={isOpen}
                          aria-controls={panelId}
                        >
                          {faq.question}
                          <ChevronDownIcon
                            className={`h-4 w-4 flex-shrink-0 transition-transform ${isOpen ? "rotate-180" : ""}`}
                          />
                        </button>
                        {isOpen && (
                          <p
                            id={panelId}
                            role="region"
                            aria-labelledby={buttonId}
                            className="px-4 pb-4 text-sm font-semibold leading-6 text-[#122a50b2]"
                          >
                            {faq.answer}
                          </p>
                        )}
                      </div>
                    );
                  })}
                </div>
              </aside>
            </section>
          </div>
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Contact;
