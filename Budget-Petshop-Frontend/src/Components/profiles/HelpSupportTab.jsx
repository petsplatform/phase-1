import { Phone, Mail, MapPin, HelpCircle, Clock } from "lucide-react";
import { Link } from "react-router-dom";

export default function HelpSupportTab() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="border-b border-outline pb-5">
        <h2 className="text-2xl font-bold text-on-background">
          Help & Support
        </h2>
        <p className="text-sm text-charcoal-text mt-1.5">
          Have a question or need assistance? We are here to help you and your
          furry friends. Reach out to our dedicated support channels.
        </p>
      </div>

      {/* Quick Contact Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Phone Support */}
        <div className="border border-outline bg-white hover:bg-surface-tint/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between items-start text-left">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <Phone size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-background">
                Phone Support
              </h3>
              <p className="text-xs text-charcoal-text mt-1">
                Talk to our friendly support team for immediate assistance.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-outline">
              <p className="text-sm font-bold text-on-background flex items-center gap-2">
                <span className="text-secondary font-bold">18007387467</span>
              </p>
            </div>
          </div>
        </div>

        {/* Card 2: Email Inquiries */}
        <div className="border border-outline bg-white hover:bg-surface-tint/5 rounded-3xl p-6 shadow-sm hover:shadow-md transition-all duration-300 flex flex-col justify-between items-start text-left">
          <div className="space-y-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary/10 text-secondary">
              <Mail size={22} />
            </div>
            <div>
              <h3 className="text-base font-bold text-on-background">
                Email Support
              </h3>
              <p className="text-xs text-charcoal-text mt-1">
                Drop us a line and our pet experts will solve your query.
              </p>
            </div>
            <div className="space-y-2 pt-2 border-t border-outline">
              <p className="text-sm font-bold text-on-background">
                support@budgetpetshop.com
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Security and Quality Promise footer */}
      <div className="bg-surface-tint/10 rounded-2xl p-5 border border-outline/60 flex items-center gap-4 text-left">
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-emerald-50 text-emerald-600 shrink-0">
          <svg
            className="w-5 h-5"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2.5}
              d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"
            />
          </svg>
        </div>
        <div>
          <h4 className="text-xs font-bold text-on-background uppercase tracking-wider">
            Your Satisfaction is Our Priority
          </h4>
          <p className="text-[11px] text-charcoal-text mt-0.5">
            We strive to respond to all inquiries as quickly as possible. For
            urgent delivery issues, please call us.
          </p>
        </div>
      </div>
    </div>
  );
}
