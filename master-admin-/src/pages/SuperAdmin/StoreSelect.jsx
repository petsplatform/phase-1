import { ArrowRight, ShieldCheck } from "lucide-react";
import { useNavigate } from "react-router-dom";
import StoreChooser from "../../components/SuperAdmin/StoreChooser";
import { ALL_STORES_KEY, setSelectedSuperAdminStore } from "../../lib/superAdminStore";

export default function StoreSelect() {
  const navigate = useNavigate();

  return (
    <main className="min-h-screen bg-white px-4 py-8 text-black sm:px-6 lg:px-10">
      <div className="mx-auto flex min-h-[calc(100vh-4rem)] max-w-7xl flex-col">
        <header className="flex items-center justify-between border-b border-black/10 pb-6">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-neutral-500">
              Super Admin
            </p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-black sm:text-5xl">
              Select Store
            </h1>
          </div>
          <div className="hidden items-center gap-2 rounded-full border border-black/10 px-4 py-2 text-xs font-medium uppercase tracking-[0.16em] text-neutral-600 sm:flex">
            <ShieldCheck size={16} />
            View only access
          </div>
        </header>

        <section className="grid flex-1 place-items-center py-10">
          <div className="w-full">
            <div className="mb-8 max-w-2xl">
              <h2 className="text-2xl font-semibold text-black sm:text-3xl">
                Choose the workspace you want to review.
              </h2>
              <p className="mt-3 text-sm font-semibold leading-6 text-neutral-500">
                Pick one store to see only that store's orders, products, customers and categories, or choose All Stores for the full network view.
              </p>
            </div>

            <StoreChooser onSelect={() => navigate("/dashboard", { replace: true })} />

            <button
              type="button"
              onClick={() => {
                setSelectedSuperAdminStore(ALL_STORES_KEY);
                navigate("/dashboard", { replace: true });
              }}
              className="mt-8 inline-flex h-12 items-center gap-2 rounded-xl bg-black px-5 text-sm font-semibold text-white transition hover:bg-neutral-800"
            >
              Continue to Dashboard
              <ArrowRight size={17} />
            </button>
          </div>
        </section>
      </div>
    </main>
  );
}
