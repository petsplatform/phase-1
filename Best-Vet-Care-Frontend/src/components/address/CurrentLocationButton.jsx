import { useState } from "react";
import { LocateFixed } from "lucide-react";
import { reverseGeocodeLocation } from "../../api/locationApi";
import { useGeolocation } from "../../hooks/useGeolocation";

const LOCATION_LOOKUP_TIMEOUT_MS = 20000;

function withTimeout(promise, message) {
  let timeoutId;
  const timeout = new Promise((_, reject) => {
    timeoutId = window.setTimeout(() => reject(new Error(message)), LOCATION_LOOKUP_TIMEOUT_MS);
  });

  return Promise.race([promise, timeout]).finally(() => window.clearTimeout(timeoutId));
}

export default function CurrentLocationButton({ onAddressSelect, onError, onSuccess, className = "" }) {
  const { error, getCurrentPosition, loading: locating } = useGeolocation();
  const [detecting, setDetecting] = useState(false);
  const loading = locating || detecting;

  const detectLocation = async () => {
    if (loading) return;
    setDetecting(true);
    try {
      const coords = await getCurrentPosition();
      const address = await withTimeout(
        reverseGeocodeLocation(coords),
        "Location lookup timed out. Please try again or enter your address manually.",
      );
      onAddressSelect({ ...address, ...coords });
      onSuccess?.("Location detected.");
    } catch (err) {
      const message = err.message || error || "We couldn't detect your location. Please enter your address manually.";
      if (import.meta.env.DEV) {
        console.error("[Address] Use current location failed", err);
      }
      onError?.(message);
    } finally {
      setDetecting(false);
    }
  };

  return (
    <button
      type="button"
      onClick={detectLocation}
      disabled={loading}
      className={`inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-extrabold text-[#17345f] hover:bg-[#f8f1df] disabled:cursor-not-allowed disabled:opacity-60 ${className}`}
    >
      <LocateFixed className="h-4 w-4" />
      {loading ? "Detecting your location..." : "Use current location"}
    </button>
  );
}
