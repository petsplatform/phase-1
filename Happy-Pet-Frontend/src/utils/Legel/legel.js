import {
  ShieldCheck,
  Eye,
  Lock,
  Share2,
  UserCheck,
  FileText,
  Package,
  Truck,
  ThermometerSnowflake,
} from "lucide-react";

export const sections = [
  {
    title: "1. Information We Collect",
    icon: Eye,
    content:
      "We collect personal information to provide you with the best veterinary pharmacy experience. This includes account information (name, email, phone number), pet information (name, species, breed, medical history), prescription files and veterinarian details (clinic name, vet's name, phone, license information), and billing/shipping information. Payment data is processed securely through encrypted third-party payment gateways.",
  },
  {
    title: "2. How We Use Your Information",
    icon: UserCheck,
    content:
      "Your data is used strictly to verify and fulfill prescription orders, coordinate with your veterinarian for approvals, process payments, deliver medications, and personalize recommendations for your pet's wellness. We may also send order tracking updates, autoship reminders, and veterinary advice alerts if subscribed.",
  },
  {
    title: "3. Prescription & Health Data Security",
    icon: Lock,
    content:
      "Prescription records and pet health information are treated with the highest degree of confidentiality. Although pet health records are not strictly governed by human HIPAA laws, we treat veterinary data with the same standard of rigorous care. Access is restricted to licensed pharmacists, authorized veterinary advisors, and direct support staff involved in fulfillment.",
  },
  {
    title: "4. Sharing & Third-Party Disclosure",
    icon: Share2,
    content:
      "Happy PetRx does NOT sell, rent, or trade your personal or pet health information to third-party advertisers. We share information only with: (1) your designated veterinarian or veterinary clinic to authorize or clarify prescriptions, (2) shipping carriers (like FedEx or UPS) to deliver your orders, and (3) payment processors to handle secure transactions.",
  },
  {
    title: "5. Cookies & Tracking Technologies",
    icon: FileText,
    content:
      "We use cookies and similar tracking tools to keep you logged in, save your shopping cart progress, remember your autoship preferences, and compile aggregated traffic statistics to optimize website performance. You can adjust your browser settings to refuse cookies, though some features of our site may not function properly as a result.",
  },
  {
    title: "6. Your Rights & Control",
    icon: ShieldCheck,
    content:
      "You have full control over your personal data. You can access, correct, or delete your account information at any time through your profile settings. You can pause or cancel autoship schedules, choose to opt-out of promotional communications, or contact our privacy team directly to request complete account deletion.",
  },
];

export const ShippingSteps = [
  {
    num: "01",
    title: "Order & Script Upload",
    desc: "Checkout with your items. If ordering prescriptions, provide vet clinic details or upload a digital script scan.",
    icon: Package,
  },
  {
    num: "02",
    title: "Veterinary Approval",
    desc: "Our pharmacy team verifies scripts directly with your vet clinic. Processing typically takes 24 to 48 hours.",
    icon: ShieldCheck,
  },
  {
    num: "03",
    title: "Pharmacy Dispensation",
    desc: "Licensed pharmacists fill, check, and package your items. Cold-chain formulas are packed in insulated coolers.",
    icon: ThermometerSnowflake,
  },
  {
    num: "04",
    title: "Express Delivery",
    desc: "Orders depart via express transit. You receive a live tracking link to monitor delivery directly to your door.",
    icon: Truck,
  },
];

export const termssections = [
  {
    id: "accounts",
    num: "01",
    title: "User Accounts and Eligibility",
    content:
      "To purchase pet supplies or create an account, you must be at least 18 years old or browsing under parent/guardian supervision. You are responsible for keeping your account details and password confidential, and you agree to accept responsibility for all activities that occur under your account.",
  },
  {
    id: "pricing",
    num: "02",
    title: "Pricing, Products, and Stock",
    content:
      "All prices are shown in USD and are subject to change without notice. We reserve the right to correct any pricing or product info errors. Availability of pet medications and wellness supplies is not guaranteed, and we reserve the right to limit quantities or cancel orders.",
  },
  {
    id: "purchases",
    num: "03",
    title: "Purchases and Payment Terms",
    content:
      "By completing a checkout, you agree to pay all charges incurred for your transaction, including shipping and applicable taxes. Autoship orders are billed automatically per your chosen frequency (e.g. every 4 weeks) to your authorized payment method.",
  },
  {
    id: "returns",
    num: "04",
    title: "Returns, Cancellations, and Refunds",
    content:
      "We provide a 30-day return policy for standard, unused pet supplies. By pharmacy safety regulations, prescription pet medications are strictly non-returnable and non-refundable once shipped. You may cancel non-processed orders or change autoship plans in your dashboard.",
  },
  {
    id: "ip-rights",
    num: "05",
    title: "Intellectual Property Rights",
    content:
      "All content on our platform, including logos, designs, text, graphics, and product photos, is the intellectual property of Happy PetRx and protected by copyright laws. You may not copy, reproduce, or distribute any material without express written consent.",
  },
  {
    id: "liability",
    num: "06",
    title: "Limitation of Liability",
    content:
      "Happy PetRx is not liable for any indirect, incidental, or consequential damages arising from the use of our services or products. Veterinary advice provided on our platform is informational only and should not replace in-clinic professional vet consults.",
  },
];
