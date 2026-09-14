import { Headset } from "lucide-react";
import { Link } from "react-router-dom";
import { FaInstagram, FaPinterest, FaWhatsapp } from "react-icons/fa";
import mountainImage from "../../assets/images/Image.png";
import logo from "../../assets/logo/logo.png";

const shopLinks = [
  { label: "Dogs", href: "/products?q=dog" },
  { label: "Cats", href: "/products?q=cat" },
  { label: "Grooming", href: "/products?category=Grooming" },
  { label: "Coats", href: "/products?q=coats" },
];
const companyLinks = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about" },
  { label: "Shop", href: "/products" },
  { label: "Contact", href: "/contact" },
];

export default function Footer() {
  return (
    <footer className="overflow-hidden bg-[#242826] text-white">
      <div className="w-full bg-[#242826]">
        <img
          src={mountainImage}
          alt=""
          aria-hidden="true"
          className="w-full h-auto block"
        />
      </div>

      <div className="mx-auto max-w-[1128px] px-5 pb-6 pt-7 sm:px-6 lg:px-0">
        <div className="grid grid-cols-2 gap-8 md:grid-cols-2 lg:grid-cols-[390px_150px_190px_240px] lg:gap-[72px]">
          <section className="col-span-2 md:col-span-1 lg:col-span-1">
            <Link
              to="/"
              className="block h-[74px] w-[218px] overflow-hidden sm:h-[86px] sm:w-[255px]"
              aria-label="HealthyPawsStore home"
            >
              <img
                src={logo}
                alt="HealthyPawsStore"
                className="h-full w-full object-contain object-left"
              />
            </Link>
            <p className="mt-5 max-w-[390px] text-[14px] font-medium leading-[1.75] text-white/90 sm:mt-8 sm:text-[15px]">
              Our mission at HealthyPawsStore is to consistently provide the
              best pet products at unbeatable prices, ensuring a fun and
              hassle-free shopping experience for all pet owners.
            </p>
          </section>

          <FooterList title="Shop" links={shopLinks} highlight="Horses" />
          <FooterList title="Company" links={companyLinks} />

          <section className="col-span-2 md:col-span-1 lg:col-span-1">
            <h3 className="text-[15px] font-extrabold text-white">
              Expert help
            </h3>
            <p className="mt-5 text-[15px] font-medium leading-[1.7] text-white/90">
              Need any advice before you buy?
              <br />
              We&apos;re here to help.
            </p>
            <Link
              to="/contact"
              className="mt-6 inline-block text-[15px] font-semibold text-white underline underline-offset-2"
            >
              Contact Us
            </Link>
            <div className="mt-6 grid size-[78px] place-items-center rounded-full border-[5px] border-white/85 bg-[#d9ddd9] shadow-lg sm:mt-7 sm:size-[92px]">
              <div className="grid size-[60px] place-items-center rounded-full bg-[#f1f0e9] text-[#242826] sm:size-[72px]">
                <Headset size={34} strokeWidth={1.8} />
              </div>
            </div>
          </section>
        </div>

        <div className="mt-9 flex flex-col gap-7 lg:mt-10 lg:flex-row lg:items-end lg:justify-between">
          <div>
            {/* <PaymentBadges /> */}
            <p className="mt-7 text-[12px] font-medium leading-relaxed text-white/80 lg:mt-16">
              &copy; 2026, HealthyPawsStore. Developed By{" "}
              <a
                href="https://techrabbit.io/"
                target="_blank"
                rel="noreferrer"
                className="font-semibold text-white transition-colors hover:text-sage"
              >
                Tech Rabbit
              </a>
              &nbsp; | &nbsp;
              <Link to="/privacy-policy" className="hover:text-white">
                Privacy Policy
              </Link>
              &nbsp; | &nbsp;
              <Link to="/terms-conditions" className="hover:text-white">
                Terms &amp; Conditions
              </Link>
              &nbsp; | &nbsp;
              <Link to="/return-policy" className="hover:text-white">
                Return Policy
              </Link>
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-7">
            <a
              href="#"
              aria-label="Instagram"
              className="text-white transition-colors hover:text-sage"
            >
              <FaInstagram size={20} />
            </a>
            <a
              href="#"
              aria-label="Pinterest"
              className="text-white transition-colors hover:text-sage"
            >
              <FaPinterest size={20} />
            </a>
            <a
              href="#"
              aria-label="WhatsApp"
              className="text-white transition-colors hover:text-sage"
            >
              <FaWhatsapp size={20} />
            </a>
            {/* <button type="button" className="flex h-[48px] items-center gap-3 rounded-full bg-white/10 px-5 text-[13px] font-semibold text-white">
              <span className="grid size-5 place-items-center rounded-full bg-[#1f4693] text-[11px]">UK</span>
              United Kingdom (GBP £, EN)
              <ChevronDown size={16} />
            </button> */}
          </div>
        </div>
      </div>
    </footer>
  );
}

function FooterList({ title, links, highlight }) {
  return (
    <section>
      <h3 className="text-[15px] font-extrabold text-white">{title}</h3>
      <ul className="mt-4 grid gap-3 text-[14px] font-medium text-white/90 sm:mt-5 sm:text-[15px]">
        {links.map((link) => (
          <li key={link.label}>
            <Link
              to={link.href}
              className="inline-flex items-center gap-3 transition-colors hover:text-sage"
            >
              {link.label}
              {link.label === highlight && (
                <span className="rounded-sm bg-white px-2 py-0.5 text-[10px] font-extrabold text-[#242826]">
                  NEW
                </span>
              )}
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
