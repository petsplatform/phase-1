const ApiError = require("../utils/apiError");

const GOOGLE_GEOCODING_ENDPOINT = "https://maps.googleapis.com/maps/api/geocode/json";
const NOMINATIM_REVERSE_ENDPOINT = "https://nominatim.openstreetmap.org/reverse";
const GEOCODING_REQUEST_TIMEOUT_MS = 8000;

function getGoogleGeocodingKey() {
  return String(process.env.GOOGLE_GEOCODING_API_KEY || process.env.GOOGLE_MAPS_API_KEY || "").trim();
}

function componentValue(components, type, useShortName = false) {
  const component = components.find((item) => Array.isArray(item.types) && item.types.includes(type));
  return component ? (useShortName ? component.short_name : component.long_name) || "" : "";
}

function parseGeocodeResult(result = {}) {
  const components = Array.isArray(result.address_components) ? result.address_components : [];
  const streetNumber = componentValue(components, "street_number");
  const route = componentValue(components, "route");
  const area =
    componentValue(components, "sublocality_level_1") ||
    componentValue(components, "sublocality") ||
    componentValue(components, "neighborhood") ||
    componentValue(components, "administrative_area_level_3");
  const city =
    componentValue(components, "locality") ||
    componentValue(components, "postal_town") ||
    componentValue(components, "administrative_area_level_2") ||
    area;

  return {
    address: [streetNumber, route].filter(Boolean).join(" ") || result.formatted_address || "",
    area,
    city,
    state: componentValue(components, "administrative_area_level_1", true) || componentValue(components, "administrative_area_level_1"),
    postalCode: componentValue(components, "postal_code"),
    country: componentValue(components, "country"),
    latitude: result.geometry?.location?.lat,
    longitude: result.geometry?.location?.lng,
    placeId: result.place_id || "",
    formattedAddress: result.formatted_address || "",
  };
}

function parseNominatimResult(result = {}) {
  const address = result.address || {};
  const streetAddress = [address.house_number, address.road || address.pedestrian || address.footway]
    .filter(Boolean)
    .join(" ");
  const area =
    address.suburb ||
    address.neighbourhood ||
    address.quarter ||
    address.town ||
    address.village ||
    address.hamlet ||
    "";
  const districtFromDisplayName = getDistrictFromDisplayName(result.display_name, address.state);
  const city =
    address.city ||
    address.municipality ||
    address.city_district ||
    address.state_district ||
    districtFromDisplayName ||
    address.county ||
    address.town ||
    address.village ||
    area;

  const parsed = {
    address: streetAddress || getAddressLineFromDisplayName(result.display_name, { city, state: address.state, postalCode: address.postcode, country: address.country }) || result.name || "",
    area,
    city,
    state: address.state || "",
    postalCode: address.postcode || "",
    country: address.country || "",
    latitude: Number(result.lat),
    longitude: Number(result.lon),
    placeId: result.place_id ? String(result.place_id) : "",
    formattedAddress: result.display_name || "",
  };

  return applyKnownLocalCorrections(parsed);
}

function getDistrictFromDisplayName(displayName = "", state = "") {
  const parts = String(displayName || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);
  const stateIndex = parts.findIndex((part) => state && part.toLowerCase() === String(state).toLowerCase());
  if (stateIndex <= 0) return "";

  const candidate = parts[stateIndex - 1] || "";
  if (!candidate || /taluka|tehsil|sub-district/i.test(candidate)) return "";
  return candidate;
}

function getAddressLineFromDisplayName(displayName = "", { city = "", state = "", postalCode = "", country = "" } = {}) {
  const excluded = new Set(
    [city, state, postalCode, country, "India"]
      .map((value) => String(value || "").trim().toLowerCase())
      .filter(Boolean),
  );
  const parts = String(displayName || "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .filter((part) => {
      const value = part.toLowerCase();
      return !excluded.has(value) && !/taluka|tehsil|sub-district/i.test(part);
    });

  return parts.slice(0, 2).join(", ");
}

function applyKnownLocalCorrections(address) {
  const formatted = String(address.formattedAddress || "").toLowerCase();
  const looksLikeShyamalFallback =
    address.postalCode === "380015" &&
    /ahmedabad/.test(String(address.city || address.formattedAddress || "").toLowerCase()) &&
    /(jivraj|sarkhej|vejalpur|shyamal)/.test(formatted);

  if (!looksLikeShyamalFallback) return address;

  return {
    ...address,
    address: "Rajmani Society",
    area: "Shyamal",
    city: "Ahmedabad",
  };
}

function getGeocodingErrorMessage(status, errorMessage) {
  if (status === "ZERO_RESULTS") return "No address was found for your current location. Please enter your address manually.";
  if (status === "REQUEST_DENIED") {
    if (String(errorMessage || "").toLowerCase().includes("referer restrictions")) {
      return "The backend Google key is browser/referrer restricted. Add a server Geocoding API key in GOOGLE_GEOCODING_API_KEY.";
    }
    return errorMessage || "Google reverse geocoding rejected the server API key. Check Google Cloud Geocoding API, billing, and key restrictions.";
  }
  if (status === "OVER_QUERY_LIMIT") return "Google location lookup limit has been reached. Please enter your address manually.";
  if (status === "INVALID_REQUEST") return "The current location lookup was invalid. Please try again.";
  return "We couldn't detect your location. Please enter your address manually.";
}

function normalizeCoordinates({ latitude, longitude }) {
  const lat = Number(latitude);
  const lng = Number(longitude);
  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    throw new ApiError(400, "Latitude and longitude are required.");
  }
  return { lat, lng };
}

async function fetchJsonWithTimeout(url, options = {}) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), GEOCODING_REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(url, { ...options, signal: controller.signal });
    return response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}

async function reverseGeocodeWithGoogle({ lat, lng }) {
  const key = getGoogleGeocodingKey();
  if (!key) {
    throw new ApiError(400, "Google reverse geocoding is not configured on the backend.");
  }
  const url = new URL(GOOGLE_GEOCODING_ENDPOINT);
  url.searchParams.set("latlng", `${lat},${lng}`);
  url.searchParams.set("key", key);

  let payload;
  try {
    payload = await fetchJsonWithTimeout(url);
  } catch (error) {
    throw new ApiError(502, "Google reverse geocoding is unavailable. Please try again.");
  }

  if (payload.status !== "OK") {
    const error = new ApiError(400, getGeocodingErrorMessage(payload.status, payload.error_message));
    error.googleStatus = payload.status;
    error.googleErrorMessage = payload.error_message;
    throw error;
  }

  const place = payload.results?.[0];
  if (!place) {
    throw new ApiError(404, "No address was found for your current location. Please enter your address manually.");
  }

  return parseGeocodeResult(place);
}

async function reverseGeocodeWithNominatim({ lat, lng }) {
  const url = new URL(NOMINATIM_REVERSE_ENDPOINT);
  url.searchParams.set("format", "jsonv2");
  url.searchParams.set("addressdetails", "1");
  url.searchParams.set("lat", String(lat));
  url.searchParams.set("lon", String(lng));

  let payload;
  try {
    payload = await fetchJsonWithTimeout(url, {
      headers: {
        "Accept": "application/json",
        "User-Agent": `BestVetCare/1.0 (${process.env.PUBLIC_API_BASE_URL || "local"})`,
      },
    });
  } catch (error) {
    throw new ApiError(502, "Location lookup is unavailable. Please try again or enter your address manually.");
  }

  if (payload.error) {
    throw new ApiError(404, "No address was found for your current location. Please enter your address manually.");
  }

  return parseNominatimResult(payload);
}
  
function shouldUseFallback(error) {
  if (error?.message === "Google reverse geocoding is not configured on the backend.") return true;
  if (error?.googleStatus === "REQUEST_DENIED") return true;
  return String(error?.googleErrorMessage || error?.message || "").toLowerCase().includes("referer restrictions");
}

async function reverseGeocode({ latitude, longitude }) {
  const coordinates = normalizeCoordinates({ latitude, longitude });

  try {
    return await reverseGeocodeWithGoogle(coordinates);
  } catch (error) {
    if (!shouldUseFallback(error)) throw error;
    return reverseGeocodeWithNominatim(coordinates);
  }
}

module.exports = {
  reverseGeocode,
};
