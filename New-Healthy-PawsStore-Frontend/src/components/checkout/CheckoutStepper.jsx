import { Heart, PawPrint } from "lucide-react";
import checkoutPets from "../../assets/images/checkout/checkout-dog-cat.png";

const steps = [
  { number: 1, title: "Shipping", text: "Address" },
  { number: 2, title: "Payment", text: "Method" },
  { number: 3, title: "Review", text: "& Place Order" },
];

export default function CheckoutStepper({ activeStep }) {
  return (
    <section className="mx-auto grid max-w-[1380px] items-center gap-6 px-4 py-7 sm:px-6 lg:grid-cols-[1fr_330px] lg:px-8">
      <div className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-start gap-4">
        {steps.map((step, index) => {
          const active = step.number <= activeStep;
          return (
            <div key={step.number} className="contents">
              <div className="grid justify-items-center gap-3">
                <span
                  className={`grid size-12 place-items-center rounded-full text-[20px] font-extrabold shadow-card ${
                    active ? "bg-secondaryDark text-white" : "bg-sageLight text-muted"
                  }`}
                >
                  {step.number}
                </span>
                <span className="text-center">
                  <strong className={`block text-[14px] font-extrabold ${active ? "text-secondaryDark" : "text-textMain"}`}>
                    {step.title}
                  </strong>
                  <span className="text-[13px] font-semibold text-muted">{step.text}</span>
                </span>
              </div>
              {index < steps.length - 1 && <span className="mt-6 h-px w-full bg-borderSoft" />}
            </div>
          );
        })}
      </div>
      <div className="relative hidden min-h-[155px] lg:block">
        <Heart className="absolute left-4 top-7 text-sage" size={18} />
        <PawPrint className="absolute right-6 top-8 text-sage" size={18} fill="currentColor" />
        <img
          src={checkoutPets}
          alt="Happy dog and cat beside checkout steps"
          className="absolute bottom-0 right-0 h-[170px] w-full object-contain object-right-bottom"
        />
      </div>
    </section>
  );
}
