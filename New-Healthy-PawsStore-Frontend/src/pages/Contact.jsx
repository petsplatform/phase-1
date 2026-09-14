import ContactForm from "../components/contact/ContactForm";
import ContactHero from "../components/contact/ContactHero";
import ContactInfo from "../components/contact/ContactInfo";
import TrustFeatures from "../components/contact/TrustFeatures";
import Newsletter from "../components/home/Newsletter";
import Footer from "../components/layout/Footer";
import Header from "../components/layout/Header";

export default function Contact() {
  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main>
        <ContactHero />
        <section className="bg-background px-4 py-3 sm:px-5 lg:px-6">
          <div className="mx-auto grid max-w-[1300px] gap-8 lg:grid-cols-[1fr_1.04fr]">
            <ContactForm />
            <ContactInfo />
          </div>
        </section>
        <TrustFeatures />
        <Newsletter />
      </main>
      <Footer />
    </div>
  );
}
