import { MoreVertical, Pencil, Trash2 } from "lucide-react";

export default function AddressCard({ address, onEdit, onDelete }) {
  const cityLine = [address.city, address.state, address.postalCode || address.zip]
    .filter(Boolean)
    .join(", ");

  return (
    <article className="rounded-[14px] border border-borderSoft bg-white p-5 shadow-card">
      <div className="flex items-start justify-between">
        <h2 className="text-[18px] font-extrabold text-textMain">{address.fullName || "Saved Address"}</h2>
        <MoreVertical size={18} />
      </div>
      <p className="mt-4 text-[13px] font-semibold leading-relaxed text-textMain">
        {address.phone}
        <br />
        {address.line1}
        <br />
        {cityLine}
      </p>
      <div className="mt-5 flex gap-5 text-[12px] font-extrabold">
        <button type="button" onClick={() => onEdit?.(address)} className="inline-flex items-center gap-2 transition hover:text-secondaryDark"><Pencil size={14} /> Edit</button>
        <button type="button" onClick={() => onDelete?.(address)} className="inline-flex items-center gap-2 transition hover:text-error"><Trash2 size={14} /> Delete</button>
      </div>
    </article>
  );
}
