import React from "react";
import { faqItems } from "../../utils/Home/Hero";

function FaqSection() {
  return (
    <>
      <section className=" bg-white py-16" id="faq">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid gap-10 lg:grid-cols-[0.8fr_1.2fr] lg:items-start">
            <div>
              <span className="inline-flex rounded-full border border-[#D9CDBE] bg-white px-5 py-2 text-xs font-bold uppercase tracking-[0.25em] text-secondary">
                FAQ
              </span>

              <h2 className="mt-6 max-w-xl text-3xl  leading-tight text-on-background sm:text-4xl lg:text-5xl">
                Questions? We have pet-friendly answers.
              </h2>

              <p className="mt-5 max-w-md text-base leading-7 text-[#5F5A52]">
                Clear answers about products, delivery, payments, and pet care
                support.
              </p>
            </div>

            <div className="space-y-4">
              {faqItems.map((item) => (
                <details
                  key={item.question}
                  className="group rounded-2xl border border-[#E4D8C8] bg-white px-6 py-5 shadow-sm transition-all duration-300 open:shadow-md"
                >
                  <summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-base  text-on-background">
                    <span>{item.question}</span>
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-secondary text-lg text-white transition-transform duration-300 group-open:rotate-45">
                      +
                    </span>
                  </summary>

                  <p className="mt-4 max-w-2xl text-sm leading-7 text-[#5F5A52]">
                    {item.answer}
                  </p>
                </details>
              ))}
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default FaqSection;
