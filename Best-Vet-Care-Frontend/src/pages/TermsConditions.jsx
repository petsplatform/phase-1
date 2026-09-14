import {
  AccordionItem,
  DocumentIcon,
  PolicyShell,
} from "../components/PolicyPageLayout";

const terms = [
  {
    title: "Use of Our Website",
    text: "You must be at least 18 years old or have permission from a parent or guardian to use our website and make purchases.",
  },
  {
    title: "Products & Pricing",
    text: "We strive to display accurate product descriptions and prices. However, we reserve the right to correct errors and update prices at any time.",
  },
  {
    title: "Orders & Payments",
    text: "All orders are subject to acceptance and availability. Payment must be completed before your order is processed.",
  },
  {
    title: "Shipping & Delivery",
    text: "Delivery timelines are estimates. We are not responsible for delays caused by courier services, weather, or unforeseen circumstances.",
  },
  {
    title: "Returns & Refunds",
    text: "Please refer to our Return Policy for detailed information about returns, exchanges, and refunds.",
  },
  {
    title: "Intellectual Property",
    text: "All content on this website, including text, graphics, logos, and images, is the property of Best-Vet-Care and protected by copyright laws.",
  },
  {
    title: "Limitation of Liability",
    text: "Best-Vet-Care is not liable for indirect, incidental, or consequential damages resulting from use of our website or products.",
  },
  {
    title: "Changes to Terms",
    text: "We may update these Terms & Conditions at any time. Changes will be posted on this page with the latest update date.",
  },
];

const TermsConditions = () => (
  <PolicyShell
    title="Terms & Conditions"
    breadcrumb="Terms & Conditions"
    subtitle="Please read our terms and conditions carefully before using our website and services."
    icon={DocumentIcon}
  >
    <p className="mt-6 text-sm font-semibold leading-7 text-[#122a50b2]">
      By accessing or using the Best-Vet-Care website, you agree to be bound by these
      Terms & Conditions. If you do not agree with any part of these terms,
      please do not use our website.
    </p>

    <section className="mt-6 rounded-2xl border border-[#17345f1a] bg-white p-4 shadow-[0_8px_24px_rgba(18,42,80,0.05)]">
      <div className="space-y-3">
        {terms.map((item, index) => (
          <AccordionItem
            key={item.title}
            index={index + 1}
            title={item.title}
            text={item.text}
          />
        ))}
      </div>
    </section>

    <p className="mt-5 text-sm font-semibold text-[#122a50b2]">
      If you have any questions, please contact us at{" "}
      <span className="font-extrabold text-[#122a50]">support@bestvetcare.com</span>.
    </p>
  </PolicyShell>
);

export default TermsConditions;
