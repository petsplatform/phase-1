import { useCallback, useState } from "react";

export function useGeolocation() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const getCurrentPosition = useCallback(async () => {
    setError("");

    if (!navigator.geolocation) {
      const message = "Current location is not supported by this browser.";
      setError(message);
      return Promise.reject(new Error(message));
    }

    if (navigator.permissions?.query) {
      try {
        const permission = await navigator.permissions.query({ name: "geolocation" });
        if (import.meta.env.DEV) {
          console.info("[Geolocation] Permission state", permission.state);
        }
        if (permission.state === "denied") {
          const message = "Location access was denied. Please allow location access or enter your address manually.";
          setError(message);
          throw new Error(message);
        }
      } catch (permissionError) {
        if (permissionError.message?.includes("Location access was denied")) {
          throw permissionError;
        }
        if (import.meta.env.DEV) {
          console.info("[Geolocation] Permission query unavailable", permissionError);
        }
      }
    }

    setLoading(true);
    return new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false);
          resolve({
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
          });
        },
        (geoError) => {
          setLoading(false);
          const message = getGeolocationErrorMessage(geoError);
          if (import.meta.env.DEV) {
            console.error("[Geolocation] Current position failed", {
              code: geoError.code,
              message: geoError.message,
            });
          }
          setError(message);
          reject(new Error(message));
        },
        { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 },
      );
    });
  }, []);

  return { error, getCurrentPosition, loading };
}

function getGeolocationErrorMessage(error) {
  if (error.code === error.PERMISSION_DENIED) {
    return "Location access was denied. Please allow location access or enter your address manually.";
  }
  if (error.code === error.POSITION_UNAVAILABLE) {
    return "Your current location could not be detected. Please try again or enter your address manually.";
  }
  if (error.code === error.TIMEOUT) {
    return "Location detection timed out. Please try again.";
  }
  return "We couldn't detect your location. Please enter your address manually.";
}
