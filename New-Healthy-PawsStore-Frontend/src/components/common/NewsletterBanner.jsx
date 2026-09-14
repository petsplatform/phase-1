import { motion, useReducedMotion } from "framer-motion";
import { PawPrint } from "lucide-react";
import { useState } from "react";
import contactDog from "../../assets/images/contact/newsletter-dog.png";
import wishlistDog from "../../assets/images/wishlist/newsletter-dog.png";

export default function NewsletterBanner({ assetVariant = "contact" }) {
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  const reduceMotion = useReducedMotion();
  const dog = assetVariant === "wishlist" ? wishlistDog : contactDog;

  const handleSubmit = (event) => {
    event.preventDefault();

    if (!email.trim()) {
      setMessage("Email is required.");
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setMessage("Enter a valid email address.");
      return;
    }

    setMessage("You're subscribed!");
    setEmail("");
  };

  return (
    <motion.section
      initial={reduceMotion ? false : { opacity: 0, y: 18 }}
      whileInView={reduceMotion ? undefined : { opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.2 }}
      className="mx-auto max-w-[1360px] px-4 pb-8 sm:px-5 lg:px-6"
      aria-labelledby="contact-newsletter-title"
    >
      <div className="relative grid min-h-[104px] items-center gap-5 overflow-hidden rounded-[18px] bg-gradient-to-r from-primaryDark to-secondaryDark px-6 py-6 text-white shadow-card md:grid-cols-[170px_1fr_500px] md:px-9 md:py-4">
        <PawPrint
          className="absolute left-8 top-5 text-sage/20"
          size={28}
          fill="currentColor"
        />
        <PawPrint
          className="absolute right-6 top-5 text-sage/20"
          size={28}
          fill="currentColor"
        />
        <PawPrint
          className="absolute right-16 bottom-5 text-sage/20"
          size={24}
          fill="currentColor"
        />

        <img
          src={dog}
          alt="Happy dog inviting customers to join the HealthyPawsStore newsletter"
          className="relative z-10 mx-auto hidden h-[118px] self-end object-contain md:block"
          loading="lazy"
        />

        <div className="relative z-10">
          <h2
            id="contact-newsletter-title"
            className="font-display text-[27px] font-extrabold leading-tight"
          >
            Join Our Paw-some Family!
          </h2>
          <p className="mt-1 text-[14px] font-semibold text-white/90">
            Get exclusive offers, pet care tips & updates.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="relative z-10">
          <div className="grid overflow-hidden rounded-lg bg-white sm:grid-cols-[1fr_155px]">
            <label className="sr-only" htmlFor="newsletter-email">
              Email address
            </label>
            <input
              id="newsletter-email"
              type="email"
              value={email}
              onChange={(event) => {
                setEmail(event.target.value);
                setMessage("");
              }}
              placeholder="Enter your email address"
              className="h-12 min-w-0 px-5 text-[13px] font-semibold text-textMain outline-none placeholder:text-muted focus:ring-2 focus:ring-sage"
            />
            <button
              type="submit"
              className="inline-flex h-12 items-center justify-center gap-2 bg-orange px-5 text-[14px] font-extrabold text-white transition hover:scale-[1.02] focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              <PawPrint size={16} fill="currentColor" />
              Subscribe
            </button>
          </div>
          {message && (
            <p className="mt-2 text-[12px] font-extrabold text-white">
              {message}
            </p>
          )}
        </form>
      </div>
    </motion.section>
  );
}
