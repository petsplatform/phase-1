import { Link } from "react-router-dom";
import {
  CheckCircle2,
  ClipboardCheck,
  CreditCard,
  Headphones,
  ReceiptText,
  ShieldCheck,
  Tag,
} from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import {
  CartIcon,
  ChevronDownIcon,
  PackageIcon,
  SearchIcon,
  TruckIcon,
} from "../components/common/HeaderIcons";

const orderSteps = [
  {
    number: "01",
    title: "Select a Product",
    icon: SearchIcon,
    text: "Browse pet medicines, food, grooming products, supplements, and other pet-care essentials. Open a product to view details, price, stock, and available options.",
    link: { label: "Browse Products", to: "/products" },
  },
  {
    number: "02",
    title: "Add to Cart",
    icon: CartIcon,
    text: "Choose the required product option when one is available, set the quantity, then click Add to Cart. You can also use Buy Now from a product page to move straight into checkout.",
    link: { label: "View Cart", to: "/cart" },
  },
  {
    number: "03",
    title: "Apply Coupon",
    icon: Tag,
    text: "If you have an eligible coupon code, enter it in the Discount code or gift card field inside the checkout order summary. Available active coupons can also be applied there.",
  },
  {
    number: "04",
    title: "Choose Delivery",
    icon: TruckIcon,
    text: "After your contact details are confirmed, select a saved delivery address or add a new one. Standard shipping is used, and the shipping charge is calculated automatically from the order subtotal.",
  },
  {
    number: "05",
    title: "Review Checkout",
    icon: ClipboardCheck,
    text: "Check your products, quantities, delivery address, coupon discount, shipping charge, tax, and final payable total. Upload prescription documents for any products that require them.",
  },
  {
    number: "06",
    title: "Make Payment",
    icon: CreditCard,
    text: "Choose Pay Online and complete the secure payment form. The payment amount is checked again before your order is created.",
  },
  {
    number: "07",
    title: "Order Confirmation",
    icon: CheckCircle2,
    text: "After the order is placed, Best Vet Care shows a confirmation page with your order number, date, total, and payment method. If email delivery succeeds, the confirmation is sent to your account email.",
    link: { label: "Track Order", to: "/track-order" },
  },
];

const faqItems = [
  {
    question: "Where do I enter a coupon?",
    answer: "Coupons are entered at checkout in the order summary. If active coupons are available, you can apply one directly from the list.",
  },
  {
    question: "How is shipping selected?",
    answer: "Checkout uses Standard shipping. The charge is resolved automatically from admin-configured shipping rules and appears before payment.",
  },
  {
    question: "What happens if a product requires a prescription?",
    answer: "Checkout asks you to upload an image or PDF prescription for each prescription-required product before payment can continue.",
  },
  {
    question: "How can I get help with an order?",
    answer: "Use the support chat or the Contact page. You can also track placed orders from your account.",
  },
];

const openSupportChat = () => {
  window.dispatchEvent(
    new CustomEvent("petcare-open-support", {
      detail: {
        subject: "Order Issue",
        source: "HOW_TO_ORDER",
      },
    }),
  );
};

const StepCard = ({ step }) => {
  const Icon = step.icon;

  return (
    <article className="group relative flex h-full flex-col rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-[0_8px_24px_rgba(18,42,80,0.05)] transition-all duration-300 hover:-translate-y-0.5 hover:border-[#d9aa3d]/50 hover:shadow-lg">
      <div className="flex items-start justify-between gap-4">
        <span className="text-sm font-black text-[#d9aa3d]">{step.number}</span>
        <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[#d9aa3d]/30 bg-[#f8f1df] text-[#d9aa3d] transition-colors group-hover:bg-[#17345f] group-hover:text-white">
          <Icon className="h-5 w-5" />
        </span>
      </div>
      <h2 className="mt-4 text-base font-extrabold text-[#122a50]">{step.title}</h2>
      <p className="mt-2 flex-1 text-sm font-semibold leading-6 text-[#122a50b2]">
        {step.text}
      </p>
      {step.link && (
        <Link
          to={step.link.to}
          className="mt-4 inline-flex w-fit text-sm font-extrabold text-[#17345f] transition-colors hover:text-[#d9aa3d]"
        >
          {step.link.label}
        </Link>
      )}
    </article>
  );
};

const HowToOrder = () => (
  <>
    <SEO
      title="How to Place an Order | Best Vet Care"
      description="Learn how to order pet medicines, food, grooming products, supplements and other pet-care essentials from Best Vet Care."
      ogTitle="How to Place an Order | Best Vet Care"
      ogDescription="Follow the Best Vet Care order process from product selection through checkout, payment, and confirmation."
    />
    <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
      <Header />

      <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
        <div className="mx-auto max-w-[1440px]">
          <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
            <Link to="/" className="transition-colors hover:text-[#d9aa3d]">
              Home
            </Link>
            <ChevronDownIcon className="h-3 w-3 -rotate-90" />
            <span className="font-extrabold text-[#122a50]">How to Place an Order</span>
          </nav>

          <section className="mt-5 overflow-hidden rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8 lg:px-10">
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_360px] lg:items-center">
              <div>
                <span className="inline-flex items-center gap-2 rounded-full bg-white px-3 py-1 text-xs font-extrabold text-[#17345f] shadow-sm">
                  <PackageIcon className="h-4 w-4 text-[#d9aa3d]" />
                  Best Vet Care ordering guide
                </span>
                <h1 className="mt-4 text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                  How to Place an Order
                </h1>
                <p className="mt-3 max-w-2xl text-sm font-semibold leading-7 text-[#122a50b2] sm:text-base">
                  Ordering your pet-care essentials from Best Vet Care is quick and simple.
                  Follow these steps to complete your purchase.
                </p>
                <div className="mt-6 flex flex-wrap gap-3">
                  <Link
                    to="/products"
                    className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-colors hover:bg-[#d9aa3d]"
                  >
                    Shop Now
                  </Link>
                  <button
                    type="button"
                    onClick={openSupportChat}
                    className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#17345f] bg-white px-5 text-sm font-extrabold text-[#17345f] transition-colors hover:border-[#d9aa3d] hover:bg-[#fffdf7] hover:text-[#d9aa3d]"
                  >
                    <Headphones className="h-4 w-4" />
                    Need Help?
                  </button>
                </div>
              </div>

              <div className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-[#17345f] text-[#d9aa3d]">
                    <ShieldCheck className="h-6 w-6" />
                  </span>
                  <div>
                    <p className="text-sm font-extrabold text-[#122a50]">Secure checkout flow</p>
                    <p className="mt-1 text-xs font-semibold leading-5 text-[#122a50b2]">
                      Contact, delivery address, coupons, prescriptions, online payment, and confirmation.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4" aria-label="Order steps">
            {orderSteps.map((step) => (
              <StepCard key={step.number} step={step} />
            ))}
          </section>

          <section className="mt-6 grid gap-4 lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-[0_8px_24px_rgba(18,42,80,0.05)]">
              <div className="flex items-center gap-3">
                <ReceiptText className="h-6 w-6 text-[#d9aa3d]" />
                <h2 className="text-lg font-extrabold text-[#122a50]">Quick Answers</h2>
              </div>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                {faqItems.map((item) => (
                  <article key={item.question} className="rounded-xl border border-[#17345f1a] bg-[#fffdf7] p-4">
                    <h3 className="text-sm font-extrabold text-[#122a50]">{item.question}</h3>
                    <p className="mt-2 text-xs font-semibold leading-5 text-[#122a50b2]">{item.answer}</p>
                  </article>
                ))}
              </div>
            </div>

            <aside className="rounded-2xl border border-[#17345f1a] bg-[#f8f1df] p-6 shadow-[0_8px_24px_rgba(18,42,80,0.05)]">
              <h2 className="text-lg font-extrabold text-[#122a50]">Ready to shop?</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                Explore our pet-care products and place your order today.
              </p>
              <div className="mt-5 grid gap-3">
                <Link
                  to="/products"
                  className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-colors hover:bg-[#d9aa3d]"
                >
                  Shop Now
                </Link>
                <button
                  type="button"
                  onClick={openSupportChat}
                  className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#17345f] bg-white px-5 text-sm font-extrabold text-[#17345f] transition-colors hover:border-[#d9aa3d] hover:text-[#d9aa3d]"
                >
                  <Headphones className="h-4 w-4" />
                  Need Help?
                </button>
              </div>
            </aside>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  </>
);

export default HowToOrder;
