import { Heart, PencilLine } from "lucide-react";
import petBowl from "../../assets/images/checkout/pet-bowl-toys.png";

export default function OrderNote({ register, noteLength }) {
  return (
    <section className="relative overflow-hidden rounded-[20px] border border-borderSoft bg-white p-5 shadow-contact sm:p-7">
      <h2 className="flex items-center gap-3 font-display text-[22px] font-extrabold text-textMain">
        <PencilLine className="text-secondaryDark" size={23} />
        Add a Note <span className="text-[14px] font-semibold text-muted">(Optional)</span>
      </h2>
      <p className="mt-1 text-[14px] font-semibold text-muted">Add any special instructions for your order</p>
      <textarea
        {...register("orderNote")}
        maxLength={500}
        placeholder="Your note here..."
        className="relative z-10 mt-4 min-h-[88px] w-full max-w-[560px] resize-y rounded-xl border border-borderSoft bg-white px-4 py-3 text-[14px] font-semibold outline-none placeholder:text-muted focus:border-secondary focus:ring-2 focus:ring-sage"
      />
      <p className="mt-2 text-[12px] font-semibold text-muted">{500 - noteLength} characters remaining</p>
      <Heart className="absolute bottom-20 right-16 text-sage" size={28} />
      <Heart className="absolute bottom-14 right-10 text-sage" size={28} />
      <img src={petBowl} alt="Pet bowl and toys" className="absolute bottom-4 right-8 hidden h-[90px] object-contain sm:block" loading="lazy" />
    </section>
  );
}
