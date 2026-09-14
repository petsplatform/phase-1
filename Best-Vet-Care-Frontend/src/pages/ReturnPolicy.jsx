import {
  CheckListCard,
  featureIcons,
  FeatureCard,
  NeedHelpCard,
  NumberedSteps,
  PolicyShell,
  ReturnBoxIcon,
} from "../components/PolicyPageLayout";

const features = [
  {
    title: "30 Days Return Window",
    text: "Return Window",
    icon: featureIcons.window,
  },
  {
    title: "Easy Returns",
    text: "Hassle Free",
    icon: featureIcons.return,
  },
  {
    title: "Free Return",
    text: "On Defective Items",
    icon: featureIcons.paw,
  },
  {
    title: "100% Secure Refund Process",
    text: "Refund Process",
    icon: featureIcons.shield,
  },
];

const eligibility = [
  "Items must be returned within 30 days of delivery.",
  "Products must be unused, unopened, and in original packaging.",
  "Proof of purchase such as order number or receipt is required.",
  "Some items such as pet food, treats, and medicines are non-returnable for health reasons.",
];

const returnSteps = [
  "Contact our support team at support@bestvetcare.com or call +1 (555) 123-4567.",
  "Share your order details and reason for return.",
  "Our team will guide you through the return process.",
  "Ship the item back to us using the return label provided.",
  "Once we receive the item, we will process your refund within 5-7 business days.",
];

const ReturnPolicy = () => (
  <PolicyShell
    title="Return Policy"
    breadcrumb="Return Policy"
    subtitle="We want you and your pet to be happy. Learn about our easy return process."
    icon={ReturnBoxIcon}
  >
    <p className="mt-6 text-sm font-semibold leading-7 text-[#122a50b2]">
      We accept returns and exchanges within the time period specified below.
      Please read our policy carefully before making a return.
    </p>

    <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {features.map((feature) => (
        <FeatureCard key={feature.title} {...feature} />
      ))}
    </section>

    <section className="mt-6 space-y-4">
      <CheckListCard title="Return Eligibility" items={eligibility} />
      <NumberedSteps title="How to Return" items={returnSteps} />
      <CheckListCard
        title="Refunds"
        items={[
          "Refunds will be issued to the original payment method used during purchase.",
          "Shipping charges are non-refundable unless the return is due to our error.",
        ]}
      />
      <NeedHelpCard />
    </section>
  </PolicyShell>
);

export default ReturnPolicy;
