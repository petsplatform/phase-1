import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

const policyContent = {
  privacy: {
    eyebrow: "Your Privacy",
    title: "Privacy Policy",
    intro: "HealthyPawsStore protects your account, order, and contact information while helping you shop for pet essentials.",
    sections: [
      {
        heading: "Information We Collect",
        text: "We collect details you provide during account registration, checkout, saved-address management, and support requests, including name, email, phone number, shipping address, and order information.",
      },
      {
        heading: "How We Use It",
        text: "Your information is used to process orders, manage delivery, provide customer support, improve the shopping experience, and send important account or order updates.",
      },
      {
        heading: "Data Safety",
        text: "We keep customer data limited to what is needed for store operations and do not sell personal information. Payment details are handled through secure payment providers.",
      },
      {
        heading: "Your Choices",
        text: "You can update your account details, saved addresses, and contact preferences from your account area or by reaching out through the Contact page.",
      },
    ],
  },
  terms: {
    eyebrow: "Store Terms",
    title: "Terms & Conditions",
    intro: "These terms explain how orders, accounts, and purchases work when you use HealthyPawsStore.",
    sections: [
      {
        heading: "Using The Store",
        text: "By browsing, creating an account, or placing an order, you agree to use the store responsibly and provide accurate checkout and delivery information.",
      },
      {
        heading: "Product Details",
        text: "We work to keep pricing, availability, images, and descriptions accurate. Stock, offers, and product information may change as inventory is updated.",
      },
      {
        heading: "Orders & Payment",
        text: "Orders are confirmed after checkout is completed. Online payments are verified securely, and cash-on-delivery orders may be confirmed before dispatch.",
      },
      {
        heading: "Support",
        text: "For questions about products, orders, payments, or account access, contact our support team through the Contact page.",
      },
    ],
  },
  return: {
    eyebrow: "Returns & Refunds",
    title: "Return Policy",
    intro: "We want your pet products to arrive safely, correctly, and ready to use.",
    sections: [
      {
        heading: "Return Requests",
        text: "If an item arrives damaged, incorrect, expired, or unusable, contact us with your order number and product details so our team can review the issue.",
      },
      {
        heading: "Eligible Items",
        text: "Return eligibility depends on product condition, packaging, safety requirements, and the type of pet product purchased. Opened or used health products may not be returnable.",
      },
      {
        heading: "Refund Processing",
        text: "Approved refunds are processed back to the original payment method when possible. Cash-on-delivery orders may require support confirmation before refund completion.",
      },
      {
        heading: "Need Help?",
        text: "Use the Contact page for return, refund, or replacement requests. Including photos and your order number helps us resolve requests faster.",
      },
    ],
  },
};

export default function PolicyPage({ type = "privacy" }) {
  const content = policyContent[type] || policyContent.privacy;

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main className="bg-softCream px-4 py-10 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-[1120px]">
          <section className="overflow-hidden rounded-[18px] border border-borderSoft bg-white shadow-contact">
            <div className="bg-sageLight px-6 py-8 sm:px-9">
              <span className="inline-flex rounded-full bg-white px-4 py-1.5 text-[12px] font-extrabold uppercase text-secondaryDark">
                {content.eyebrow}
              </span>
              <h1 className="mt-4 font-display text-[36px] font-extrabold leading-none text-primaryDark sm:text-[46px]">
                {content.title}
              </h1>
              <p className="mt-4 max-w-[760px] text-[15px] font-semibold leading-relaxed text-muted sm:text-[16px]">
                {content.intro}
              </p>
            </div>

            <div className="grid gap-5 p-5 sm:p-7 lg:grid-cols-2">
              {content.sections.map((section) => (
                <section
                  key={section.heading}
                  className="rounded-[14px] border border-borderSoft bg-background p-5"
                >
                  <h2 className="text-[18px] font-extrabold text-textMain">
                    {section.heading}
                  </h2>
                  <p className="mt-3 text-[14px] font-semibold leading-relaxed text-muted">
                    {section.text}
                  </p>
                </section>
              ))}
            </div>
          </section>

          <div className="mt-6 rounded-[14px] bg-secondaryDark px-5 py-4 text-[13px] font-semibold leading-relaxed text-white sm:px-6">
            For policy questions or order support, visit our Contact page and
            share your order number when available.
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
