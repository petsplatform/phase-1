import api from "./axios";
import { normalizeAddressForApi } from "../utils/addressPayload";

export const orderApi = {
  createOrder: async (orderData) => {
    const res = await api.post("/customer-panel/orders", {
      ...orderData,
      shippingAddress: normalizeAddressForApi(orderData.shippingAddress, {
        fullName: [
          orderData.contactDetails?.firstName,
          orderData.contactDetails?.lastName,
        ]
          .filter(Boolean)
          .join(" "),
        mobile: orderData.contactDetails?.mobile || orderData.phone,
      }),
    });
    return res.data.data;
  },
  getMyOrders: async () => {
    const res = await api.get("/customer-panel/orders");
    return res.data.data || [];
  },
  getOrderById: async (id) => {
    const res = await api.get(
      `/customer-panel/orders/${encodeURIComponent(id)}`,
    );
    return res.data.data;
  },

  uploadPrescription: async (file) => {
    const formData = new FormData();
    formData.append("prescription", file);

    const res = await api.post(
      "/customer-panel/checkout/prescription",
      formData,
    );
    return res?.data?.data || res?.data;
  },
};
