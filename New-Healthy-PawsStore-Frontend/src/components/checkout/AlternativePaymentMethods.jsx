const methods = [
  { id: "cod", label: "Cash on Delivery", text: "Pay when your pet care order arrives", logo: "COD" },
];

export default function AlternativePaymentMethods({ register }) {
  return (
    <div className="divide-y divide-borderSoft border-t border-borderSoft">
      {methods.map((method) => (
        <label key={method.id} className="flex min-h-[58px] items-center gap-3 px-4 py-3">
          <input type="radio" value={method.id} {...register("paymentMethod")} className="size-5 accent-secondaryDark" />
          <span className="min-w-0 flex-1">
            <strong className="block text-[14px] font-extrabold text-textMain">{method.label}</strong>
            <span className="text-[12px] font-semibold text-muted">{method.text}</span>
          </span>
          <span className="text-[16px] font-extrabold text-brandBlue">{method.logo}</span>
        </label>
      ))}
    </div>
  );
}
