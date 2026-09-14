import { PawPrint } from "lucide-react";

export default function SectionTitle({ children }) {
  return (
    <div className="mb-5 flex items-center gap-3">
      <PawPrint size={15} className="text-secondary" fill="currentColor" />
      <h2 className="font-display text-[24px] font-extrabold leading-none text-textMain">
        {children}
      </h2>
      <PawPrint size={15} className="text-secondary" fill="currentColor" />
    </div>
  );
}
