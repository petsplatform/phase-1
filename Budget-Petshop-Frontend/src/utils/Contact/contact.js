import { Phone, Mail, MapPin, Bone } from "lucide-react";

export const CONTACT_METHODS = [
  {
    id: "support",
    title: "Customer Support",
    description: "We are here to help with your orders, account, or shipping.",
    value: "+1 (800) 555-1000",
    actionLabel: "Call Support",
    actionType: "tel",
    actionValue: "tel:+18005557387",
    icon: Phone,
  },
  {
    id: "email",
    title: "General Inquiries",
    description: "For general questions, collaborations, or suggestions.",
    value: "hello@budgetpetshop.com",
    actionLabel: "Email Us",
    actionType: "email",
    actionValue: "mailto:hello@budgetpetshop.com",
    icon: Mail,
  },
  {
    id: "office",
    title: "Flagship Store",
    description: "Visit our flagship physical pet store and pharmacy.",
    value: "742 Evergreen Terrace, Springfield",
    actionLabel: "Get Directions",
    actionType: "map",
    actionValue:
      "https://maps.google.com/?q=742+Evergreen+Terrace,+Springfield",
    icon: MapPin,
  },
];
