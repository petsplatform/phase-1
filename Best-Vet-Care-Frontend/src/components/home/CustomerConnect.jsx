import { useEffect, useState } from "react";
import { BadgeDollarSign, MailPlus, MessageSquareText, Send, Smartphone } from "lucide-react";
import { inquiryApi } from "../../api/inquiryApi";
import { newsletterApi } from "../../api/newsletterApi";
import { settingsApi } from "../../api/settingsApi";
import { useToast } from "../../context/ToastContext";

const initialPriceMatch = {
  fullName: "",
  email: "",
  phone: "",
  productName: "",
  competitorUrl: "",
  lowerPrice: "",
  message: "",
};

const initialFeedback = {
  fullName: "",
  email: "",
  feedbackType: "Experience",
  message: "",
};

const feedbackTypes = ["Experience", "Suggestion", "Website", "Product", "Delivery"];

export default function CustomerConnect() {
  const { showToast } = useToast();
  const [settings, setSettings] = useState(null);
  const [activeForm, setActiveForm] = useState("price");
  const [priceMatch, setPriceMatch] = useState(initialPriceMatch);
  const [feedback, setFeedback] = useState(initialFeedback);
  const [subscriberEmail, setSubscriberEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [subscribing, setSubscribing] = useState(false);

  useEffect(() => {
    let active = true;
    settingsApi
      .getSettings()
      .then((data) => {
        if (active) setSettings(data);
      })
      .catch(() => {
        if (active) setSettings(null);
      });
    return () => {
      active = false;
    };
  }, []);

  const hasAppLinks = Boolean(settings?.mobileAppEnabled && (settings?.appStoreUrl || settings?.playStoreUrl));

  const updatePriceMatch = (event) => {
    const { name, value } = event.target;
    setPriceMatch((current) => ({ ...current, [name]: value }));
  };

  const updateFeedback = (event) => {
    const { name, value } = event.target;
    setFeedback((current) => ({ ...current, [name]: value }));
  };

  const submitPriceMatch = async (event) => {
    event.preventDefault();
    if (!priceMatch.fullName.trim() || !priceMatch.email.trim() || !priceMatch.productName.trim() || !priceMatch.message.trim()) {
      showToast("Please add your name, email, product, and price-match details.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await inquiryApi.submit({
        fullName: priceMatch.fullName,
        email: priceMatch.email,
        phone: priceMatch.phone,
        subject: "Price Match Request",
        message: [
          `Product: ${priceMatch.productName}`,
          priceMatch.lowerPrice ? `Lower price found: ${priceMatch.lowerPrice}` : null,
          priceMatch.competitorUrl ? `Competitor URL: ${priceMatch.competitorUrl}` : null,
          "",
          priceMatch.message,
        ].filter(Boolean).join("\n"),
      });
      setPriceMatch(initialPriceMatch);
      showToast("Price match request sent.");
    } catch (error) {
      showToast(error.message || "Could not send price match request.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitFeedback = async (event) => {
    event.preventDefault();
    if (!feedback.fullName.trim() || !feedback.email.trim() || !feedback.message.trim()) {
      showToast("Please add your name, email, and feedback.", "warning");
      return;
    }

    setSubmitting(true);
    try {
      await inquiryApi.submit({
        fullName: feedback.fullName,
        email: feedback.email,
        phone: "",
        subject: `Feedback - ${feedback.feedbackType}`,
        message: feedback.message,
      });
      setFeedback(initialFeedback);
      showToast("Thanks for sharing your feedback.");
    } catch (error) {
      showToast(error.message || "Could not send feedback.", "error");
    } finally {
      setSubmitting(false);
    }
  };

  const submitSubscription = async (event) => {
    event.preventDefault();
    const email = subscriberEmail.trim();
    if (!email) {
      showToast("Please enter your email address.", "warning");
      return;
    }

    setSubscribing(true);
    try {
      const data = await newsletterApi.subscribe({ email, source: "home_customer_connect" });
      setSubscriberEmail("");
      if (data?.confirmationEmail?.delivered) {
        showToast("Subscription confirmed. Please check your email.");
      } else {
        showToast("Subscription saved. Confirmation email status is pending.", "warning");
      }
    } catch (error) {
      showToast(error.response?.data?.message || error.message || "Could not complete subscription.", "error");
    } finally {
      setSubscribing(false);
    }
  };

  return (
    <section className="bg-[#fffdf7] px-4 sm:px-5 lg:px-[22px]">
      <div className="mx-auto max-w-[1440px]">
        <div className="grid gap-6 lg:grid-cols-[minmax(0,0.9fr)_minmax(420px,1.1fr)] lg:items-start">
          <div className="rounded-lg border border-[#17345f1a] bg-white p-6 shadow-sm">
            <p className="text-sm font-extrabold uppercase text-[#d9aa3d]">Customer Care</p>
            <h2 className="mt-2 text-3xl font-extrabold leading-tight text-[#122a50]">
              Share a better price or tell us how we did.
            </h2>
            <p className="mt-3 text-sm font-semibold leading-6 text-[#122a50b2]">
              Found the same product for less? Send the details for review. You can also share suggestions, feedback, or your shopping experience.
            </p>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={() => setActiveForm("price")}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-extrabold transition ${
                  activeForm === "price"
                    ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f]"
                    : "border-[#17345f1a] text-[#122a50] hover:bg-[#fffaf0]"
                }`}
              >
                <BadgeDollarSign className="h-5 w-5" />
                Price Match
              </button>
              <button
                type="button"
                onClick={() => setActiveForm("feedback")}
                className={`flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm font-extrabold transition ${
                  activeForm === "feedback"
                    ? "border-[#d9aa3d] bg-[#f8f1df] text-[#17345f]"
                    : "border-[#17345f1a] text-[#122a50] hover:bg-[#fffaf0]"
                }`}
              >
                <MessageSquareText className="h-5 w-5" />
                Feedback
              </button>
            </div>

            <div className="mt-5 rounded-lg border border-[#17345f1a] bg-[#fffaf0] p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-white text-[#d9aa3d]">
                  <Smartphone className="h-5 w-5" />
                </span>
                <div className="min-w-0">
                  <h3 className="text-base font-extrabold text-[#122a50]">Download Our App</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#122a50b2]">Shop, reorder, and track pet essentials from your phone.</p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    {hasAppLinks ? (
                      <>
                        {settings.appStoreUrl && <AppLink href={settings.appStoreUrl} label="App Store" />}
                        {settings.playStoreUrl && <AppLink href={settings.playStoreUrl} label="Google Play" />}
                      </>
                    ) : (
                      <span className="inline-flex h-10 items-center justify-center rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-extrabold text-[#17345f]">
                        Coming Soon
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <form onSubmit={submitSubscription} className="mt-5 rounded-lg border border-[#17345f1a] bg-white p-4">
              <div className="flex items-start gap-3">
                <span className="inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-[#f8f1df] text-[#d9aa3d]">
                  <MailPlus className="h-5 w-5" />
                </span>
                <div className="min-w-0 flex-1">
                  <h3 className="text-base font-extrabold text-[#122a50]">Subscribe</h3>
                  <p className="mt-1 text-sm font-semibold leading-6 text-[#122a50b2]">Get new pet essentials, care tips, and offers in your inbox.</p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <input
                      type="email"
                      value={subscriberEmail}
                      onChange={(event) => setSubscriberEmail(event.target.value)}
                      placeholder="Email address"
                      className="h-11 min-w-0 flex-1 rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                      disabled={subscribing}
                    />
                    <button
                      type="submit"
                      disabled={subscribing}
                      className="inline-flex h-11 items-center justify-center gap-2 rounded-lg bg-[#17345f] px-4 text-sm font-extrabold text-white hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <MailPlus className="h-4 w-4" />
                      {subscribing ? "Subscribing..." : "Subscribe"}
                    </button>
                  </div>
                </div>
              </div>
            </form>
          </div>

          <div className="rounded-lg border border-[#17345f1a] bg-white p-6 shadow-sm">
            {activeForm === "price" ? (
              <form onSubmit={submitPriceMatch} className="grid gap-4">
                <FormTitle icon={BadgeDollarSign} title="Lower Price / Price Match" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="fullName" label="Full Name *" value={priceMatch.fullName} onChange={updatePriceMatch} />
                  <Field name="email" label="Email *" type="email" value={priceMatch.email} onChange={updatePriceMatch} />
                  <Field name="phone" label="Phone" value={priceMatch.phone} onChange={updatePriceMatch} />
                  <Field name="productName" label="Product Name *" value={priceMatch.productName} onChange={updatePriceMatch} />
                  <Field name="lowerPrice" label="Lower Price Found" value={priceMatch.lowerPrice} onChange={updatePriceMatch} placeholder="$0.00" />
                  <Field name="competitorUrl" label="Competitor Link" type="url" value={priceMatch.competitorUrl} onChange={updatePriceMatch} />
                </div>
                <Field name="message" label="Details *" value={priceMatch.message} onChange={updatePriceMatch} textarea />
                <SubmitButton submitting={submitting} label="Send Price Match Request" />
              </form>
            ) : (
              <form onSubmit={submitFeedback} className="grid gap-4">
                <FormTitle icon={MessageSquareText} title="Feedback" />
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field name="fullName" label="Full Name *" value={feedback.fullName} onChange={updateFeedback} />
                  <Field name="email" label="Email *" type="email" value={feedback.email} onChange={updateFeedback} />
                </div>
                <label className="block">
                  <span className="text-xs font-extrabold uppercase text-[#122a50b2]">Feedback Type</span>
                  <select
                    name="feedbackType"
                    value={feedback.feedbackType}
                    onChange={updateFeedback}
                    className="mt-1 h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]"
                  >
                    {feedbackTypes.map((type) => <option key={type} value={type}>{type}</option>)}
                  </select>
                </label>
                <Field name="message" label="Feedback *" value={feedback.message} onChange={updateFeedback} textarea />
                <SubmitButton submitting={submitting} label="Send Feedback" />
              </form>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}

function AppLink({ href, label }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex h-10 items-center justify-center rounded-lg bg-[#17345f] px-4 text-sm font-extrabold text-white hover:bg-[#d9aa3d]"
    >
      {label}
    </a>
  );
}

function FormTitle({ icon: Icon, title }) {
  return (
    <div className="flex items-center gap-3">
      <span className="inline-flex h-10 w-10 items-center justify-center rounded-lg bg-[#f8f1df] text-[#d9aa3d]">
        <Icon className="h-5 w-5" />
      </span>
      <h3 className="text-xl font-extrabold text-[#122a50]">{title}</h3>
    </div>
  );
}

function Field({ name, label, value, onChange, type = "text", placeholder = "", textarea = false }) {
  const className = "mt-1 w-full rounded-lg border border-[#17345f1a] bg-white px-3 text-sm font-semibold text-[#122a50] outline-none focus:border-[#d9aa3d]";
  return (
    <label className="block">
      <span className="text-xs font-extrabold uppercase text-[#122a50b2]">{label}</span>
      {textarea ? (
        <textarea name={name} value={value} onChange={onChange} placeholder={placeholder} rows={4} className={`${className} py-3`} />
      ) : (
        <input name={name} type={type} value={value} onChange={onChange} placeholder={placeholder} className={`${className} h-12`} />
      )}
    </label>
  );
}

function SubmitButton({ submitting, label }) {
  return (
    <button
      type="submit"
      disabled={submitting}
      className="inline-flex h-12 w-fit items-center justify-center gap-2 rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-60"
    >
      <Send className="h-4 w-4" />
      {submitting ? "Sending..." : label}
    </button>
  );
}
