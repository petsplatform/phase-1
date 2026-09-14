import { reverseGeocodeLocation } from "../api/locationApi";

const GOOGLE_MAPS_SCRIPT_ID = "best-vet-care-google-maps";
const GOOGLE_MAPS_KEY = String(import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "").trim();
const GOOGLE_MAPS_COUNTRY = String(import.meta.env.VITE_GOOGLE_MAPS_COUNTRY || "").trim();
const GOOGLE_MAPS_LOAD_TIMEOUT_MS = 12000;

let loadingPromise = null;

export function hasGoogleMapsKey() {
  return Boolean(GOOGLE_MAPS_KEY);
}

export function getGoogleMapsCountryRestriction() {
  const value = String(GOOGLE_MAPS_COUNTRY || "").trim().toLowerCase();
  return value || "";
}

export async function loadGoogleMaps() {
  if (window.google?.maps?.places) return window.google.maps;
  if (!GOOGLE_MAPS_KEY) {
    throw new Error("Google Maps API key is missing.");
  }
  if (loadingPromise) return loadingPromise;

  loadingPromise = new Promise((resolve, reject) => {
    let settled = false;
    let timeoutId;
    const previousAuthFailure = window.gm_authFailure;

    const finish = (maps) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.gm_authFailure = previousAuthFailure;
      const script = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
      if (script) script.dataset.loaded = "true";
      resolve(maps);
    };

    const fail = (message, details) => {
      if (settled) return;
      settled = true;
      window.clearTimeout(timeoutId);
      window.gm_authFailure = previousAuthFailure;
      loadingPromise = null;
      const script = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
      if (script) script.dataset.failed = "true";
      if (import.meta.env.DEV) {
        console.error("[Google Maps] Load failed", {
          message,
          keyConfigured: Boolean(GOOGLE_MAPS_KEY),
          keyPrefix: GOOGLE_MAPS_KEY ? `${GOOGLE_MAPS_KEY.slice(0, 6)}...` : "",
          origin: window.location.origin,
          details,
        });
      }
      reject(new Error(message));
    };

    window.gm_authFailure = () => {
      fail(
        "Google Maps rejected this API key or website restriction. Please check Google Cloud referrer, billing, and enabled APIs.",
        "gm_authFailure",
      );
      if (typeof previousAuthFailure === "function") previousAuthFailure();
    };

    const existing = document.getElementById(GOOGLE_MAPS_SCRIPT_ID);
    if (existing) {
      if (window.google?.maps?.places) {
        finish(window.google.maps);
        return;
      }
      if (existing.dataset.failed === "true" || existing.dataset.loaded === "true") {
        existing.remove();
      } else {
        timeoutId = window.setTimeout(() => {
          fail("Google Maps took too long to load. Please check the API key, referrer restrictions, and network.", "existing_timeout");
        }, GOOGLE_MAPS_LOAD_TIMEOUT_MS);
        existing.addEventListener("load", () => {
          window.setTimeout(() => {
            if (window.google?.maps?.places) {
              finish(window.google.maps);
            } else {
              fail("Google Maps loaded but Places is unavailable. Check API key permissions and enabled APIs.", "places_missing");
            }
          }, 0);
        }, { once: true });
        existing.addEventListener("error", () => fail("Google Maps could not be loaded. Check your network and API key restrictions.", "script_error"), { once: true });
        return;
      }
    }

    const script = document.createElement("script");
    script.id = GOOGLE_MAPS_SCRIPT_ID;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(GOOGLE_MAPS_KEY)}&libraries=places&v=weekly`;
    script.async = true;
    script.defer = true;
    script.onload = () => {
      script.dataset.loaded = "true";
      window.setTimeout(() => {
        if (window.google?.maps?.places) {
          finish(window.google.maps);
        } else {
          fail("Google Maps loaded but Places is unavailable. Check API key permissions and enabled APIs.", "places_missing");
        }
      }, 0);
    };
    script.onerror = () => {
      script.dataset.failed = "true";
      fail("Google Maps could not be loaded. Check your network and API key restrictions.", "script_error");
    };
    timeoutId = window.setTimeout(() => {
      fail("Google Maps took too long to load. Please check the API key, referrer restrictions, and network.", "timeout");
    }, GOOGLE_MAPS_LOAD_TIMEOUT_MS);
    document.head.appendChild(script);
  });

  return loadingPromise;
}

export function getPlacesStatusMessage(status, maps) {
  const statuses = maps?.places?.PlacesServiceStatus || {};
  if (status === statuses.ZERO_RESULTS || status === "ZERO_RESULTS") return "";
  if (status === statuses.REQUEST_DENIED || status === "REQUEST_DENIED") {
    return "Google address search is not allowed for this API key. Please check Google Cloud API restrictions.";
  }
  if (status === statuses.OVER_QUERY_LIMIT || status === "OVER_QUERY_LIMIT") {
    return "Google address search limit has been reached. Please enter the address manually.";
  }
  if (status === statuses.INVALID_REQUEST || status === "INVALID_REQUEST") {
    return "Enter more address details to search.";
  }
  return "Google address search is unavailable. Please enter the address manually.";
}

export function parseGooglePlace(place = {}) {
  const components = Array.isArray(place.address_components) ? place.address_components : [];
  const byType = (type) => components.find((component) => component.types?.includes(type)) || {};
  const shortByType = (type) => byType(type).short_name || byType(type).long_name || "";
  const longByType = (type) => byType(type).long_name || "";
  const streetNumber = longByType("street_number");
  const route = longByType("route");
  const area =
    longByType("sublocality_level_1") ||
    longByType("sublocality") ||
    longByType("neighborhood") ||
    longByType("administrative_area_level_3");
  const city =
    longByType("locality") ||
    longByType("postal_town") ||
    longByType("administrative_area_level_2") ||
    area;
  const state = shortByType("administrative_area_level_1") || longByType("administrative_area_level_1");
  const country = longByType("country");
  const postalCode = longByType("postal_code");
  const lat = typeof place.geometry?.location?.lat === "function"
    ? place.geometry.location.lat()
    : place.geometry?.location?.lat;
  const lng = typeof place.geometry?.location?.lng === "function"
    ? place.geometry.location.lng()
    : place.geometry?.location?.lng;

  return {
    address: [streetNumber, route].filter(Boolean).join(" ") || place.name || place.formatted_address || "",
    area,
    city,
    state,
    postalCode,
    country,
    latitude: Number.isFinite(Number(lat)) ? Number(lat) : undefined,
    longitude: Number.isFinite(Number(lng)) ? Number(lng) : undefined,
    placeId: place.place_id || "",
    formattedAddress: place.formatted_address || "",
  };
}

export async function reverseGeocodeCoordinates({ latitude, longitude }) {
  try {
    const maps = await loadGoogleMaps();
    const geocoder = new maps.Geocoder();
    const request = { location: { lat: Number(latitude), lng: Number(longitude) } };
    const result = await geocode(geocoder, request, maps);
    const place = result?.results?.[0];
    if (!place) throw new Error("No address found for this location.");
    return parseGooglePlace(place);
  } catch (error) {
    if (import.meta.env.DEV) {
      console.warn("[Google Maps] Browser reverse geocoding failed, trying backend fallback", error);
    }
    return reverseGeocodeLocation({ latitude, longitude });
  }
}

function geocode(geocoder, request, maps) {
  const okStatus = maps?.GeocoderStatus?.OK || "OK";

  return new Promise((resolve, reject) => {
    let settled = false;
    const finish = (callbackResult) => {
      if (settled) return;
      settled = true;
      resolve(callbackResult);
    };
    const fail = (error) => {
      if (settled) return;
      settled = true;
      reject(error);
    };

    try {
      const maybePromise = geocoder.geocode(request, (results, status) => {
        if (status === okStatus) {
          finish({ results });
        } else {
          fail(new Error(getGeocoderStatusMessage(status, maps)));
        }
      });

      if (maybePromise?.then) {
        maybePromise
          .then((response) => finish(response))
          .catch((error) => fail(new Error(error?.message || "We couldn't detect your location. Please enter your address manually.")));
      }
    } catch (error) {
      fail(error);
    }
  });
}

function getGeocoderStatusMessage(status, maps) {
  const statuses = maps?.GeocoderStatus || {};
  if (status === statuses.ZERO_RESULTS || status === "ZERO_RESULTS") {
    return "No address was found for your current location. Please enter your address manually.";
  }
  if (status === statuses.REQUEST_DENIED || status === "REQUEST_DENIED") {
    return "Google reverse geocoding is not allowed for this API key. Please check Google Cloud API restrictions.";
  }
  if (status === statuses.OVER_QUERY_LIMIT || status === "OVER_QUERY_LIMIT") {
    return "Google location lookup limit has been reached. Please enter your address manually.";
  }
  if (status === statuses.INVALID_REQUEST || status === "INVALID_REQUEST") {
    return "The current location lookup was invalid. Please try again or enter your address manually.";
  }
  return "We couldn't detect your location. Please enter your address manually.";
}
