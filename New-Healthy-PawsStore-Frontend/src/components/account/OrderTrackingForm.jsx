import { useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Search } from "lucide-react";
import { useForm } from "react-hook-form";
import { trackOrderSchema } from "../../schemas/trackOrderSchema";

export default function OrderTrackingForm({ onTrack, loading, defaultQuery = "" }) {
  const { register, handleSubmit, setValue, formState: { errors } } = useForm({
    resolver: zodResolver(trackOrderSchema),
    defaultValues: { query: defaultQuery || "" },
  });

  useEffect(() => {
    if (defaultQuery) {
      setValue("query", defaultQuery);
    }
  }, [defaultQuery, setValue]);

  return (
    <form onSubmit={handleSubmit(onTrack)} className="mt-5 grid gap-3 md:grid-cols-[1fr_150px]">
      <label>
        <span className="sr-only">Order ID / Tracking Number</span>
        <input
          {...register("query")}
          placeholder="Enter order ID (e.g. ORD-1785752366534)"
          className="h-12 w-full rounded-lg border border-borderSoft px-4 text-[14px] font-semibold outline-none focus:border-secondary focus:ring-2 focus:ring-sage"
        />
        {errors.query && <span className="mt-1 block text-[12px] font-bold text-error">{errors.query.message}</span>}
      </label>
      <button
        disabled={loading}
        type="submit"
        className="inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-secondaryDark px-5 text-[14px] font-extrabold text-white !text-white hover:bg-opacity-90 transition cursor-pointer"
      >
        <Search size={16} /> Track Order
      </button>
    </form>
  );
}
