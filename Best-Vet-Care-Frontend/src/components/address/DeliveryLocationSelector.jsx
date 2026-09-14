import { useEffect, useState } from "react";
import { MapPin, X } from "lucide-react";
import AddressAssist from "./AddressAssist";

const DELIVERY_LOCATION_KEY = "petcare_delivery_location";
const DELIVERY_LOCATION_EVENT = "petcare-delivery-location-change";

function readDeliveryLocation() {
  try {
    const stored = window.localStorage.getItem(DELIVERY_LOCATION_KEY);
    return stored ? normalizeStoredLocation(JSON.parse(stored)) : null;
  } catch {
    return null;
  }
}

function normalizeStoredLocation(location) {
  if (!location) return null;
  if (
    location.postalCode === "380015" &&
    /ahmedabad/i.test(String(location.city || location.formattedAddress || location.address || "")) &&
    /(jivraj|sarkhej|vejalpur|shyamal)/i.test(String(location.formattedAddress || location.address || location.area || ""))
  ) {
    return {
      ...location,
      address: "Rajmani Society",
      area: "Shyamal",
      city: "Ahmedabad",
      formattedAddress: "",
    };
  }
  return location;
}

function formatLocation(location) {
  if (!location) return "Set delivery location";
  return location.postalCode || location.city || location.formattedAddress || location.address || "Delivery location";
}

function formatFullLocation(location) {
  if (!location) return "";
  return [location.address, location.area, location.city, location.state, location.postalCode, location.country]
    .filter(Boolean)
    .join(", ");
}

function locationPayload(address) {
  const normalizedAddress = [address.address, address.area].filter(Boolean).join(", ");
  return {
    address: normalizedAddress || address.formattedAddress || "",
    area: address.area || "",
    city: address.city || "",
    state: address.state || "",
    postalCode: address.postalCode || "",
    country: address.country || "",
    latitude: address.latitude,
    longitude: address.longitude,
    placeId: address.placeId || "",
    formattedAddress: address.formattedAddress || "",
    savedAt: new Date().toISOString(),
  };
}

export default function DeliveryLocationSelector() {
  const [open, setOpen] = useState(false);
  const [location, setLocation] = useState(() => readDeliveryLocation());

  useEffect(() => {
    const syncLocation = () => setLocation(readDeliveryLocation());
    window.addEventListener("storage", syncLocation);
    window.addEventListener(DELIVERY_LOCATION_EVENT, syncLocation);
    return () => {
      window.removeEventListener("storage", syncLocation);
      window.removeEventListener(DELIVERY_LOCATION_EVENT, syncLocation);
    };
  }, []);

  const saveLocation = (address) => {
    const nextLocation = locationPayload(address);
    window.localStorage.setItem(DELIVERY_LOCATION_KEY, JSON.stringify(nextLocation));
    window.dispatchEvent(new Event(DELIVERY_LOCATION_EVENT));
    setLocation(nextLocation);
    setOpen(false);
  };

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="flex h-10 max-w-[44px] items-center gap-2 rounded-full border border-[#17345f1a] bg-white px-3 text-left text-xs font-extrabold text-[#122a50] transition-colors hover:border-[#d9aa3d] hover:bg-[#f8f1df] sm:max-w-[180px] lg:max-w-[190px]"
      >
        <MapPin className="h-4 w-4 flex-shrink-0 text-[#d9aa3d]" />
        <span className="hidden truncate sm:block">{formatLocation(location)}</span>
      </button>

      {open && (
        <div className="fixed inset-0 z-[100]" role="dialog" aria-modal="true" aria-label="Delivery location">
          <button
            type="button"
            className="absolute inset-0 bg-[#122a50]/40"
            aria-label="Close delivery location"
            onClick={() => setOpen(false)}
          />
          <div className="absolute left-1/2 top-24 w-[min(92vw,460px)] -translate-x-1/2 rounded-lg border border-[#17345f1a] bg-white p-5 shadow-[0_24px_60px_rgba(18,42,80,0.22)]">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h2 className="text-lg font-extrabold text-[#122a50]">Delivery Location</h2>
              <button
                type="button"
                onClick={() => setOpen(false)}
                className="inline-flex h-9 w-9 items-center justify-center rounded-full border border-[#17345f1a] text-[#122a50] hover:bg-[#f8f1df]"
                aria-label="Close"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <AddressAssist onAddressSelect={saveLocation} />
            {location && (
              <p className="mt-3 rounded-lg bg-[#fffaf0] px-3 py-2 text-xs font-semibold leading-5 text-[#122a50b2]">
                {formatFullLocation(location) || location.formattedAddress || location.address}
              </p>
            )}
          </div>
        </div>
      )}
    </>
  );
}

export { DELIVERY_LOCATION_EVENT, DELIVERY_LOCATION_KEY };
