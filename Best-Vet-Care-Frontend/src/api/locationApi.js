import api from "./axios";

export async function reverseGeocodeLocation({ latitude, longitude }) {
  try {
    const response = await api.get("/customer-panel/geocode/reverse", {
      params: { latitude, longitude },
      skipAuth: true,
    });
    return response.data?.data;
  } catch (error) {
    throw new Error(error.response?.data?.message || error.message || "We couldn't detect your location. Please enter your address manually.");
  }
}
