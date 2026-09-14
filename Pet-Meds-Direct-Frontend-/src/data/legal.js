export const termsData = {
  title: "Terms & Conditions",
  lastUpdated: "July 15, 2026",
  introduction: "Welcome to PetMeds Direct. These Terms & Conditions govern your access to and use of our website, mobile application, and licensed online pharmacy services. By accessing or using our platform, you agree to be bound by these terms. If you do not agree, please do not use our services.",
  sections: [
    {
      id: "acceptance",
      title: "1. Acceptance of Terms",
      content: [
        "By accessing this website, registering an account, or placing an order, you agree to comply with and be legally bound by these Terms & Conditions, our Privacy Policy, and our Shipping Policy.",
        "We reserve the right to update, change, or replace any part of these terms at any time. It is your responsibility to check this page periodically for changes. Your continued use of the website following the posting of changes constitutes acceptance of those changes."
      ]
    },
    {
      id: "prescriptions",
      title: "2. Prescription Medication Policy",
      content: [
        "PetMeds Direct is a fully licensed veterinary pharmacy. By federal and state laws, we can only dispense prescription medications under a valid prescription written by a licensed veterinarian who has a valid veterinarian-client-patient relationship (VCPR).",
        "During checkout, you must provide accurate veterinarian contact details or upload a copy of the prescription. We will contact your veterinarian to verify the prescription details. Orders will remain in a 'Pending Verification' state until verified by our pharmacy team.",
        "Prescription orders cannot be shipped until verification is complete. If we cannot verify the prescription within 5 business days, your order may be cancelled. Due to pharmacy safety regulations, prescription medications cannot be returned or refunded once they have shipped."
      ]
    },
    {
      id: "accounts",
      title: "3. User Accounts & Registration",
      content: [
        "To purchase certain products or subscribe to our Auto-Ship program, you must register an account. You agree to provide true, accurate, and complete information, including pet health profiles and veterinarian details.",
        "You are responsible for maintaining the confidentiality of your account credentials and password. PetMeds Direct is not liable for any loss or damage arising from your failure to protect your login information.",
        "We reserve the right to suspend or terminate accounts that provide false information, violate pharmacy laws, or engage in fraudulent activities."
      ]
    },
    {
      id: "autoship",
      title: "4. Auto-Ship & Save Subscription",
      content: [
        "Our Auto-Ship subscription program automatically processes orders at your chosen frequency (e.g., every 4, 8, or 12 weeks) with a discount applied (15% on first order, 5% on recurring orders).",
        "You can modify, pause, or cancel your Auto-Ship subscription at any time up to 24 hours before your next scheduled order date through your account dashboard. Changes made less than 24 hours before a shipment may not apply to that shipment."
      ]
    },
    {
      id: "disclaimer",
      title: "5. Disclaimer of Veterinary Advice",
      content: [
        "All content, articles, product descriptions, and answers from our 24/7 support chat are for informational and educational purposes only. They do not constitute professional veterinary medical advice, diagnosis, or treatment.",
        "Always consult your primary veterinarian with any questions regarding your pet's medical condition or health concerns. Do not disregard professional veterinary advice or delay seeking it because of information read on PetMeds Direct."
      ]
    },
    {
      id: "liability",
      title: "6. Limitations of Liability",
      content: [
        "PetMeds Direct and its officers, directors, employees, and veterinary pharmacists shall not be liable for any direct, indirect, incidental, special, or consequential damages resulting from the use or inability to use our platform or products sold.",
        "In no event shall our total liability to you for all damages, losses, and causes of action exceed the amount paid by you, if any, for accessing our platform or purchasing products."
      ]
    },
    {
      id: "governing-law",
      title: "7. Governing Law",
      content: [
        "These Terms & Conditions and any separate agreements whereby we provide you services shall be governed by and construed in accordance with the laws of the jurisdiction in which our pharmacy headquarters is located, without regard to conflicts of law principles."
      ]
    }
  ]
};

export const shippingData = {
  title: "Shipping & Delivery Policy",
  lastUpdated: "July 15, 2026",
  intro: "At PetMeds Direct, we understand that getting your pet's medications and essentials quickly is vital. We work diligently to process and ship all orders with maximum speed, care, and safety.",
  highlights: [
    {
      title: "Free Shipping",
      description: "Get free standard shipping on all orders over $49. No code needed."
    },
    {
      title: "Cold Chain Care",
      description: "Temperature-sensitive items (like insulin) are shipped in insulated packaging with ice packs."
    },
    {
      title: "Vet Verification Support",
      description: "We process shipments immediately once your vet prescription is verified."
    }
  ],
  methods: [
    {
      id: 1,
      name: "Standard Ground Shipping",
      timeframe: "2 - 4 Business Days",
      cost: "FREE (Orders over $49) / $5.99 (Orders under $49)",
      details: "Delivered via UPS, FedEx, or USPS depending on location. Perfect for dry foods, supplements, toys, and standard meds."
    },
    {
      id: 2,
      name: "Expedited Shipping",
      timeframe: "1 - 2 Business Days",
      cost: "$12.99 Flat Rate",
      details: "Priority processing and express courier routing. Highly recommended if your pet's medication is running low."
    },
    {
      id: 3,
      name: "Cold-Chain Temperature Controlled",
      timeframe: "Overnight Delivery",
      cost: "FREE (Insulin Orders) / $19.99 (Special requests)",
      details: "Insulated coolers with medical-grade gel ice packs. Shipped Mondays through Thursdays only, ensuring packages do not sit in a warehouse over the weekend."
    }
  ],
  processing: {
    title: "Order Processing Timelines",
    steps: [
      {
        title: "Order Submission",
        description: "Once you submit your order, we send a confirmation email. Non-prescription items are sent directly to the packing queue."
      },
      {
        title: "Prescription Verification",
        description: "For Rx items, our pharmacy contacts your vet. This process typically takes 24-48 hours depending on vet response speed."
      },
      {
        title: "Safe Dispensing",
        description: "Our licensed veterinary pharmacists double-check the dose, brand, and packaging to guarantee 100% accuracy."
      },
      {
        title: "Express Dispatch",
        description: "Packages are sealed securely and handed over to the courier. You will receive a tracking link via email and SMS."
      }
    ]
  },
  restrictions: [
    "We ship only to valid physical addresses and PO Boxes within the United States. We currently do not ship internationally.",
    "Cold-chain items cannot be shipped to PO Boxes due to immediate refrigeration requirements.",
    "Hazardous items (such as pressurized sprays) must travel via ground shipping and are ineligible for expedited air transport."
  ]
};

export const privacyData = {
  title: "Privacy Policy",
  lastUpdated: "July 15, 2026",
  intro: "Your privacy, and the privacy of your pet's health information, is extremely important to us. This policy outlines how PetMeds Direct collects, uses, protects, and handles your personal information when you use our platform.",
  tabs: [
    {
      id: "collection",
      label: "What We Collect",
      icon: "User",
      title: "Information We Collect",
      description: "We collect information necessary to verify prescriptions, process orders, and provide a personalized experience for you and your pets.",
      items: [
        {
          heading: "Personal Identification Info",
          detail: "Name, billing and shipping address, email address, phone number, and account credentials."
        },
        {
          heading: "Pet Profiles",
          detail: "Name, breed, age, weight, health conditions, known drug allergies, and current medications."
        },
        {
          heading: "Prescription Details & Vet Info",
          detail: "Veterinarian name, clinic phone/fax, hospital address, and digital copies of prescriptions."
        },
        {
          heading: "Payment Details",
          detail: "All payment transactions are encrypted. We do not store full credit card numbers on our servers; they are processed securely by PCI-compliant payment gateways."
        }
      ]
    },
    {
      id: "usage",
      label: "How We Use It",
      icon: "Shield",
      title: "How We Use Your Information",
      description: "Your data allows us to dispense medications safely and keep your orders arriving on time.",
      items: [
        {
          heading: "Fulfilling Orders & Dispensing",
          detail: "We use pet profiles and veterinarian details to verify prescriptions and dispense correct dosages safely."
        },
        {
          heading: "Managing Auto-Ship Subscriptions",
          detail: "To trigger automated billing, order packing, and shipping at your requested frequency."
        },
        {
          heading: "Customer Support & Vet Advice Chat",
          detail: "To provide relevant context when you consult our pharmacists or support team."
        },
        {
          heading: "Service Updates & Health Reminders",
          detail: "Sending critical alerts regarding refill timings, prescription expiration, or drug recall announcements."
        }
      ]
    },
    {
      id: "sharing",
      label: "Sharing & Protection",
      icon: "Share2",
      title: "Data Sharing & Safeguards",
      description: "We value your trust. We do not sell your personal or veterinary data to third parties.",
      items: [
        {
          heading: "Veterinary Communication",
          detail: "We share prescription details with your designated veterinarian solely to verify medication validity."
        },
        {
          heading: "Shipping Providers",
          detail: "Sharing your name and delivery address with carriers (UPS, FedEx, USPS) to deliver your parcels."
        },
        {
          heading: "Strict System Encryption",
          detail: "We utilize industry-standard SSL/TLS encryption for all data in transit. Databases are hosted in secure VPC environments with restricted access."
        }
      ]
    },
    {
      id: "rights",
      label: "Your Rights",
      icon: "FileText",
      title: "Control Over Your Data",
      description: "You have full control over the personal information and pet profiles stored with us.",
      items: [
        {
          heading: "Review & Edit Profile",
          detail: "You can update your personal contact info and pet medical records at any time via your Account settings."
        },
        {
          heading: "Auto-Ship Control",
          detail: "You can pause or terminate subscriptions and remove payment methods at your discretion."
        },
        {
          heading: "Right to Deletion (GDPR / CCPA)",
          detail: "You can request full deletion of your account and files by contacting our privacy compliance team at privacy@petmedsdirect.com (subject to pharmacy record retention laws)."
        }
      ]
    }
  ]
};
