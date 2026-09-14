import {
  BulletList,
  DocumentIcon,
  PolicyCard,
  PolicyShell,
  ShieldIcon,
} from "../components/PolicyPageLayout";
import { CartIcon, HeartIcon, SearchIcon } from "../components/common/HeaderIcons";

const sections = [
  {
    title: "Information We Collect",
    icon: <DocumentIcon className="h-5 w-5" />,
    intro: "We collect information you provide directly to us, such as when you create an account, place an order, or contact us.",
    items: [
      "Personal information including name, email, phone number, and address",
      "Order information and purchase history",
      "Payment information processed through secure providers",
      "Device and usage information",
    ],
  },
  {
    title: "How We Use Your Information",
    icon: <SearchIcon className="h-5 w-5" />,
    intro: "We use the information we collect to improve your shopping and support experience.",
    items: [
      "Process your orders and payments",
      "Provide customer support",
      "Send updates and promotional offers",
      "Improve our products, website, and services",
    ],
  },
  {
    title: "Information Sharing",
    icon: <HeartIcon className="h-5 w-5" />,
    intro: "We do not sell your personal information. We may share your data only when needed for trusted service operations.",
    items: [
      "Trusted service providers",
      "Payment processors",
      "Legal authorities when required by law",
    ],
  },
  {
    title: "Data Security",
    icon: <ShieldIcon className="h-5 w-5" />,
    intro: "We use reasonable industry-standard security measures to protect your data.",
  },
  {
    title: "Your Rights",
    icon: <CartIcon className="h-5 w-5" />,
    intro: "You can access, update, or request deletion of your personal information by contacting us.",
  },
  {
    title: "Cookies",
    icon: <DocumentIcon className="h-5 w-5" />,
    intro: "We use cookies to enhance your browsing experience and analyze site traffic.",
  },
];

const PrivacyPolicy = () => (
  <PolicyShell
    title="Privacy Policy"
    breadcrumb="Privacy Policy"
    subtitle="Your privacy is important to us. Learn how we collect, use, and protect your personal information."
    icon={ShieldIcon}
  >
    <p className="mt-6 text-sm font-semibold leading-7 text-[#122a50b2]">
      At Best-Vet-Care, we value your trust and are committed to protecting your
      personal information. This Privacy Policy explains how we collect, use,
      disclose, and safeguard your data when you visit our website or make a
      purchase.
    </p>

    <section className="mt-6 space-y-4">
      {sections.map((section, index) => (
        <PolicyCard
          key={section.title}
          number={index + 1}
          title={section.title}
          icon={section.icon}
        >
          <p>{section.intro}</p>
          {section.items && <BulletList items={section.items} />}
        </PolicyCard>
      ))}
    </section>

    <p className="mt-5 text-sm font-semibold text-[#122a50b2]">
      If you have any questions about this Privacy Policy, please contact us at{" "}
      <span className="font-extrabold text-[#122a50]">support@bestvetcare.com</span>.
    </p>
  </PolicyShell>
);

export default PrivacyPolicy;
