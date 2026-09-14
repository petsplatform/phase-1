import { useCallback, useState } from "react";
import AddressAutocomplete from "./AddressAutocomplete";
import CurrentLocationButton from "./CurrentLocationButton";
import { hasGoogleMapsKey } from "../../services/googleMapsService";

export default function AddressAssist({ onAddressSelect }) {
  const [message, setMessage] = useState({ text: "", type: "" });

  const handleAddressSelect = useCallback((address) => {
    setMessage({ text: "", type: "" });
    onAddressSelect(address);
  }, [onAddressSelect]);

  if (!hasGoogleMapsKey()) {
    return null;
  }

  return (
    <div className="space-y-2">
      <AddressAutocomplete onAddressSelect={handleAddressSelect} />
      <CurrentLocationButton
        onAddressSelect={handleAddressSelect}
        onError={(text) => setMessage({ text, type: "error" })}
        onSuccess={(text) => setMessage({ text, type: "success" })}
      />
      {message.text && (
        <p className={`text-xs font-semibold ${message.type === "success" ? "text-green-700" : "text-red-600"}`}>
          {message.text}
        </p>
      )}
    </div>
  );
}
