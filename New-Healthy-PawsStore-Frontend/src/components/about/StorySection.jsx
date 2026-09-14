import { CreditCard, Leaf, PawPrint, ShieldCheck } from "lucide-react";
import storyImage from "../../assets/images/about.png";

const points = [
  { icon: Leaf, title: "Natural & Safe", text: "Only the best for your pets" },
  {
    icon: ShieldCheck,
    title: "Vet Approved",
    text: "Trusted by vets, loved by pets",
  },
  {
    icon: CreditCard,
    title: "Secure Shopping",
    text: "Safe payments, always protected",
  },
];

export default function StorySection() {
  return (
    <section id="story" className="bg-white px-6 py-10 lg:px-[76px]">
      <div className="mx-auto grid max-w-[1320px] gap-12 lg:grid-cols-[480px_1fr_260px]">
        <div className="relative overflow-hidden rounded-[14px] shadow-card">
          <img
            src={storyImage}
            alt="Pet parent caring for a happy dog"
            className="h-[300px] w-full object-cover"
            loading="lazy"
          />
          {/* <div className="absolute bottom-5 left-5 grid size-[116px] place-items-center rounded-full bg-white text-center shadow-card">
            <span className="rotate-[-12deg] text-[12px] font-extrabold text-textMain">
              Our Promise
              <PawPrint
                className="mx-auto my-2 text-secondary"
                size={22}
                fill="currentColor"
              />
              Happy Pets
              <small className="mt-1 block text-[11px] font-semibold text-muted">
                Healthy Life
              </small>
            </span>
          </div> */}
        </div>

        <div className="self-center">
          <p className="mb-4 flex items-center gap-2 text-[13px] font-extrabold text-textMain">
            <PawPrint
              className="text-secondary"
              size={15}
              fill="currentColor"
            />
            Our Story
            <PawPrint
              className="text-secondary"
              size={15}
              fill="currentColor"
            />
          </p>
          <h2 className="font-display text-[34px] font-extrabold leading-[1.08] text-textMain">
            Better Nutrition.
            <br />
            <span className="text-secondary">Happier Pets.</span>
          </h2>
          <p className="mt-5 text-[14px] font-semibold leading-[1.8] text-textMain">
            HealthyPawsStore was born out of love for pets and a desire to make
            premium pet care accessible to every pet parent.
          </p>
          <p className="mt-4 text-[14px] font-semibold leading-[1.8] text-textMain">
            We carefully curate products that meet the highest standards of
            quality, safety, and nutrition. From food and treats to medicines
            and grooming essentials, everything we offer is chosen with your
            pet&apos;s well-being in mind.
          </p>
        </div>

        <div className="grid gap-8 self-center">
          {points.map(({ icon: Icon, title, text }) => (
            <article key={title} className="flex gap-5">
              <span className="grid size-14 shrink-0 place-items-center rounded-full bg-sage/20 text-secondaryDark">
                <Icon size={27} strokeWidth={1.8} />
              </span>
              <span>
                <strong className="block text-[14px] font-extrabold text-textMain">
                  {title}
                </strong>
                <span className="mt-2 block text-[13px] font-semibold leading-snug text-muted">
                  {text}
                </span>
              </span>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
