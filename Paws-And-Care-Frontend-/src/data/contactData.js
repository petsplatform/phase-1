import { LifeBuoy, Truck, Heart, Mail, Phone } from 'lucide-react';

export const contactOptions = [
  {
    id: 'support',
    title: 'Customer Support',
    description: 'Get help with account registration, billing queries, pet profiles, or general service inquiries.',
    actionText: 'Email Support',
    actionLink: 'mailto:support@pawsandcare.com',
    icon: LifeBuoy,
    responseTime: 'Response within 2 hours',
    color: 'teal'
  },
  {
    id: 'delivery',
    title: 'Order & Delivery Help',
    description: 'Track orders, modify shipping addresses, report delivery issues, or request returns and refunds.',
    actionText: 'Track Order',
    actionLink: '/account/orders',
    icon: Truck,
    responseTime: 'Response within 1 hour',
    color: 'coral'
  },
  {
    id: 'guidance',
    title: 'Product Guidance',
    description: 'Connect with our vet-approved product specialists for food selections, supplement dosage, or toy safety.',
    actionText: 'Ask a Specialist',
    actionLink: 'mailto:vet-guidance@pawsandcare.com',
    icon: Heart,
    responseTime: 'Response within 4 hours',
    color: 'golden'
  }
];

export const contactInfo = {
  email: 'support@pawsandcare.com',
  phone: '+1 (800) 123-4567',
  address: '742 Evergreen Terrace, Springfield, OR 97477',
  availability: '24/7 order tracking support',
  hours: [
    { days: 'Monday–Saturday', time: '9:00 AM–7:00 PM' },
    { days: 'Sunday', time: 'Closed' }
  ],
  socials: [
    { name: 'Facebook', url: 'https://facebook.com/pawsandcare', iconName: 'Facebook' },
    { name: 'Instagram', url: 'https://instagram.com/pawsandcare', iconName: 'Instagram' },
    { name: 'Twitter', url: 'https://twitter.com/pawsandcare', iconName: 'Twitter' }
  ]
};

export const quickFaqs = [
  {
    id: 1,
    question: 'How do I cancel or modify my subscription/auto-ship?',
    answer: 'Log in, go to your Account Dashboard, and select "Manage Subscriptions". You can delay, modify, or cancel up to 24 hours before your next renewal.'
  },
  {
    id: 2,
    question: 'What is your return policy for open pet food packages?',
    answer: 'We offer a 30-day "Paws-and-Care Guarantee". If your pet doesn\'t love the food or experiences dietary issues, contact us for a full refund or swap.'
  },
  {
    id: 3,
    question: 'How long does standard delivery take?',
    answer: 'Standard shipping takes 2-4 business days. Orders over $49 ship free! Express 1-2 day delivery is available at checkout.'
  }
];

export const helpCategories = [
  { value: 'product', label: 'Product Question' },
  { value: 'order', label: 'Order Status' },
  { value: 'shipping', label: 'Shipping & Delivery' },
  { value: 'return', label: 'Return or Refund' },
  { value: 'payment', label: 'Payment Issue' },
  { value: 'account', label: 'Account Support' },
  { value: 'other', label: 'Other' }
];
