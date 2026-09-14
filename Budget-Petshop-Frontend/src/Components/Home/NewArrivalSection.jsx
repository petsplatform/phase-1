import React from "react";
import arrival1 from "../../assets/arrivals/arrival1.png";
import arrival2 from "../../assets/arrivals/arrival2.png";
import arrival3 from "../../assets/arrivals/arrival3.png";

function NewArrivalSection() {
  return (
    <>
      <section>
        <div className="page-shell px-4 py-20 sm:px-6 lg:px-8">
          <div className="grid gap-14 lg:grid-cols-[1.05fr_0.95fr] lg:items-center">
            {/* Image Collage */}
            <div className="relative">
              <div className="absolute -inset-4 rounded-[40px] bg-secondary/5 blur-3xl" />

              <div className="relative grid grid-cols-2 gap-5">
                <div className="row-span-2 overflow-hidden rounded-[32px]">
                  <img
                    src={arrival1}
                    // src="https://images.unsplash.com/photo-1583511655857-d19b40a7a54e?auto=format&fit=crop&w=1200&q=80"
                    alt="Dog food"
                    className="h-full min-h-[520px] w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>

                <div className="overflow-hidden rounded-[28px]">
                  <img
                    src={arrival2}
                    // src="https://images.unsplash.com/photo-1517849845537-4d257902454a?auto=format&fit=crop&w=900&q=80"
                    alt="Happy dog"
                    className="h-[250px] w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>

                <div className="overflow-hidden rounded-[28px]">
                  <img
                    src={arrival3}
                    // src="https://images.unsplash.com/photo-1574158622682-e40e69881006?auto=format&fit=crop&w=900&q=80"
                    alt="Cat care"
                    className="h-[250px] w-full object-cover transition duration-500 hover:scale-105"
                  />
                </div>
              </div>
            </div>

            {/* Content */}
            <div>
              <span className="section-kicker">New Arrivals</span>

              <h2 className="mt-6 text-3xl leading-tight text-on-background sm:text-5xl">
                Fresh picks for happier
                <br />
                pets every day.
              </h2>
              <p className="mt-6 max-w-xl text-lg leading-8 text-charcoal-text">
                Discover thoughtfully selected products designed to keep your
                pets healthy, comfortable and entertained. Every new arrival is
                chosen for quality, safety and everyday use.
              </p>
              <div className="mt-10 grid gap-5 sm:grid-cols-2">
                <div className="store-card rounded-3xl p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    🐾
                  </div>
                  <h4 className="text-lg text-on-background">
                    Premium Quality
                  </h4>
                  <p className="mt-2 text-sm leading-7 text-charcoal-text">
                    Carefully selected products from trusted pet brands.
                  </p>
                </div>
                <div className="store-card rounded-3xl p-6">
                  <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-secondary/10">
                    ✔️
                  </div>

                  <h4 className="text-lg text-on-background">Vet Approved</h4>

                  <p className="mt-2 text-sm leading-7 text-charcoal-text">
                    Recommended essentials that support everyday pet wellness.
                  </p>
                </div>
              </div>

              <a
                href="/shop"
                className="btn-primary-link mt-10 inline-flex rounded-full bg-secondary px-8 py-4 transition hover:bg-secondary/90"
              >
                Explore New Arrivals →
              </a>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

export default NewArrivalSection;
