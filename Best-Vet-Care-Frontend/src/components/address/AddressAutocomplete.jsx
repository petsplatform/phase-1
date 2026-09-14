import { useEffect, useRef, useState } from "react";
import { MapPin, Search } from "lucide-react";
import {
  getGoogleMapsCountryRestriction,
  getPlacesStatusMessage,
  hasGoogleMapsKey,
  loadGoogleMaps,
  parseGooglePlace,
} from "../../services/googleMapsService";

const MIN_QUERY_LENGTH = 3;

export default function AddressAutocomplete({ onAddressSelect, placeholder = "Search your address" }) {
  const placesNodeRef = useRef(null);
  const autocompleteServiceRef = useRef(null);
  const placesServiceRef = useRef(null);
  const mapsRef = useRef(null);
  const [query, setQuery] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState(hasGoogleMapsKey() ? "" : "Google address search is unavailable. You can enter the address manually.");
  const [activeIndex, setActiveIndex] = useState(-1);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps()
      .then((maps) => {
        if (cancelled) return;
        mapsRef.current = maps;
        autocompleteServiceRef.current = new maps.places.AutocompleteService();
        placesServiceRef.current = new maps.places.PlacesService(placesNodeRef.current);
        setStatus("");
      })
      .catch((error) => {
        if (!cancelled) setStatus(error.message || "Google address search is unavailable. You can enter the address manually.");
      });

    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    const value = query.trim();
    if (value.length < MIN_QUERY_LENGTH || !autocompleteServiceRef.current) {
      setPredictions([]);
      setActiveIndex(-1);
      return undefined;
    }

    let active = true;
    const timer = window.setTimeout(() => {
      const country = getGoogleMapsCountryRestriction();
      setLoading(true);
      setStatus("");
      autocompleteServiceRef.current.getPlacePredictions(
        {
          input: value,
          types: ["geocode"],
          ...(country ? { componentRestrictions: { country } } : {}),
        },
        (results, googleStatus) => {
          if (!active) return;
          setLoading(false);
          const okStatus = mapsRef.current?.places?.PlacesServiceStatus?.OK || "OK";
          if (googleStatus === okStatus) {
            setPredictions(results || []);
            setActiveIndex(-1);
            return;
          }
          setPredictions([]);
          setActiveIndex(-1);
          setStatus(getPlacesStatusMessage(googleStatus, mapsRef.current));
        },
      );
    }, 250);

    return () => {
      active = false;
      window.clearTimeout(timer);
    };
  }, [query]);

  const selectPrediction = (prediction) => {
    if (!prediction || !placesServiceRef.current) return;
    setLoading(true);
    setStatus("");
    placesServiceRef.current.getDetails(
      {
        placeId: prediction.place_id,
        fields: ["address_components", "formatted_address", "geometry", "name", "place_id"],
      },
      (place, googleStatus) => {
        setLoading(false);
        const okStatus = mapsRef.current?.places?.PlacesServiceStatus?.OK || "OK";
        if (googleStatus !== okStatus || !place) {
          setStatus(getPlacesStatusMessage(googleStatus, mapsRef.current));
          return;
        }
        const parsed = parseGooglePlace(place);
        setQuery(place.formatted_address || prediction.description || "");
        setPredictions([]);
        setActiveIndex(-1);
        onAddressSelect(parsed);
      },
    );
  };

  const handleKeyDown = (event) => {
    if (!predictions.length) return;
    if (event.key === "ArrowDown") {
      event.preventDefault();
      setActiveIndex((current) => Math.min(current + 1, predictions.length - 1));
    } else if (event.key === "ArrowUp") {
      event.preventDefault();
      setActiveIndex((current) => Math.max(current - 1, 0));
    } else if (event.key === "Enter" && activeIndex >= 0) {
      event.preventDefault();
      selectPrediction(predictions[activeIndex]);
    } else if (event.key === "Escape") {
      setPredictions([]);
      setActiveIndex(-1);
    }
  };

  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-5 h-4 w-4 -translate-y-1/2 text-[#122a50]/40" />
      <input
        type="text"
        autoComplete="off"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="h-11 w-full rounded-lg border border-[#17345f1a] bg-white pl-9 pr-3 text-sm font-semibold text-[#122a50] outline-none placeholder:text-[#122a50]/40 focus:border-[#d9aa3d]"
        aria-autocomplete="list"
        aria-expanded={predictions.length > 0}
      />
      {loading && <p className="mt-1 text-xs font-semibold text-[#122a50]/50">Searching address...</p>}
      {!loading && status && <p className="mt-1 text-xs font-semibold text-red-600">{status}</p>}
      {predictions.length > 0 && (
        <div className="absolute left-0 right-0 top-[48px] z-[95] overflow-hidden rounded-lg border border-[#17345f1a] bg-white shadow-[0_18px_38px_rgba(18,42,80,0.16)]">
          {predictions.map((prediction, index) => (
            <button
              key={prediction.place_id}
              type="button"
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => selectPrediction(prediction)}
              className={`flex w-full items-start gap-2 px-3 py-2.5 text-left text-sm font-semibold text-[#122a50] hover:bg-[#fffaf0] ${
                activeIndex === index ? "bg-[#fffaf0]" : ""
              }`}
            >
              <MapPin className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#d9aa3d]" />
              <span className="min-w-0">
                <span className="block truncate">{prediction.structured_formatting?.main_text || prediction.description}</span>
                {prediction.structured_formatting?.secondary_text && (
                  <span className="block truncate text-xs text-[#122a50]/55">{prediction.structured_formatting.secondary_text}</span>
                )}
              </span>
            </button>
          ))}
        </div>
      )}
      <div ref={placesNodeRef} className="hidden" />
    </div>
  );
}
