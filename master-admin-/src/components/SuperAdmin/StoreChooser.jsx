import { Check, ChevronDown, Store as StoreIcon } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { adminApi, isSuperAdmin } from "../../lib/api";
import {
  ALL_STORES_KEY,
  fallbackStores,
  getSelectedSuperAdminStore,
  normalizeSuperAdminStore,
  setSelectedSuperAdminStore,
  SUPER_ADMIN_STORE_EVENT,
} from "../../lib/superAdminStore";

export function useSuperAdminStores() {
  const [stores, setStores] = useState(fallbackStores);

  useEffect(() => {
    if (!isSuperAdmin()) {
      return undefined;
    }

    let active = true;
    adminApi
      .stores()
      .then((records) => {
        if (!active) return;
        const normalized = (Array.isArray(records) ? records : [])
          .slice(0, 7)
          .map(normalizeSuperAdminStore);
        setStores(normalized.length ? normalized : fallbackStores);
      })
      .catch(() => {
        if (active) setStores(fallbackStores);
      });
    return () => {
      active = false;
    };
  }, []);

  return stores;
}

export function useSelectedSuperAdminStore(stores = []) {
  const [selectedKey, setSelectedKey] = useState(getSelectedSuperAdminStore);

  useEffect(() => {
    const sync = () => setSelectedKey(getSelectedSuperAdminStore());
    window.addEventListener(SUPER_ADMIN_STORE_EVENT, sync);
    window.addEventListener("storage", sync);
    return () => {
      window.removeEventListener(SUPER_ADMIN_STORE_EVENT, sync);
      window.removeEventListener("storage", sync);
    };
  }, []);

  return useMemo(() => {
    const selectedStore = stores.find((store) => store.storeKey === selectedKey) || null;
    return {
      selectedKey,
      selectedStore,
      label: selectedKey === ALL_STORES_KEY || !selectedKey ? "All Stores" : selectedStore?.name || selectedKey,
    };
  }, [selectedKey, stores]);
}

export default function StoreChooser({ compact = false, onSelect }) {
  const stores = useSuperAdminStores();
  const { selectedKey, label } = useSelectedSuperAdminStore(stores);
  const [open, setOpen] = useState(false);

  const choose = (storeKey) => {
    setSelectedSuperAdminStore(storeKey);
    setOpen(false);
    onSelect?.(storeKey);
  };

  if (compact) {
    return (
      <div className="relative">
        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          className="inline-flex h-11 items-center gap-2 rounded-xl border border-black/10 bg-white px-4 text-sm font-medium text-black shadow-sm transition hover:border-black"
        >
          <StoreIcon size={16} />
          <span>Change Store:</span>
          <span className="max-w-[180px] truncate">{label}</span>
          <ChevronDown size={16} className={open ? "rotate-180 transition" : "transition"} />
        </button>

        {open && (
          <>
            <button className="fixed inset-0 z-30 cursor-default" type="button" onClick={() => setOpen(false)} aria-label="Close store menu" />
            <div className="absolute right-0 z-40 mt-2 w-80 overflow-hidden rounded-2xl border border-black/10 bg-white shadow-2xl">
              <StoreOption
                name="All Stores"
                sub="View combined data"
                active={selectedKey === ALL_STORES_KEY || !selectedKey}
                onClick={() => choose(ALL_STORES_KEY)}
              />
              {stores.map((store) => (
                <StoreOption
                  key={store.storeKey}
                  logo={store.logo}
                  name={store.name}
                  sub={store.storeKey}
                  active={selectedKey === store.storeKey}
                  onClick={() => choose(store.storeKey)}
                />
              ))}
            </div>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StoreCard
        name="All Stores"
        sub="Combined dashboard"
        active={selectedKey === ALL_STORES_KEY || !selectedKey}
        onClick={() => choose(ALL_STORES_KEY)}
      />
      {stores.map((store) => (
        <StoreCard
          key={store.storeKey}
          logo={store.logo}
          name={store.name}
          sub={store.storeKey}
          active={selectedKey === store.storeKey}
          onClick={() => choose(store.storeKey)}
        />
      ))}
    </div>
  );
}

function StoreCard({ logo, name, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`group min-h-[170px] rounded-3xl border bg-white p-5 text-left shadow-sm transition hover:-translate-y-1 hover:border-black hover:shadow-xl ${
        active ? "border-black ring-4 ring-black/10" : "border-black/10"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="grid h-16 w-16 place-items-center rounded-2xl border border-black/10 bg-neutral-50">
          {logo ? (
            <img src={logo} alt="" className="max-h-12 max-w-14 object-contain" />
          ) : (
            <StoreIcon size={28} className="text-black" />
          )}
        </div>
        {active && (
          <span className="grid h-8 w-8 place-items-center rounded-full bg-black text-white">
            <Check size={16} />
          </span>
        )}
      </div>
      <p className="mt-5 text-lg font-semibold text-black">{name}</p>
      <p className="mt-1 text-xs font-medium uppercase tracking-[0.16em] text-neutral-500">{sub}</p>
    </button>
  );
}

function StoreOption({ logo, name, sub, active, onClick }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex w-full items-center gap-3 border-b border-black/5 px-4 py-3 text-left transition last:border-b-0 hover:bg-neutral-50"
    >
      <span className="grid h-10 w-10 place-items-center rounded-xl border border-black/10 bg-white">
        {logo ? <img src={logo} alt="" className="max-h-8 max-w-8 object-contain" /> : <StoreIcon size={18} />}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-semibold text-black">{name}</span>
        <span className="block text-xs font-semibold text-neutral-500">{sub}</span>
      </span>
      {active && <Check size={16} className="text-black" />}
    </button>
  );
}
