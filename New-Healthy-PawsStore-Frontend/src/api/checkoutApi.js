import { apiRequest } from "./client";
import { authApi } from "./authApi";
import { getPrescriptionForItem } from "../utils/prescriptionUtils";

const DEFAULT_SHIPPING_COUNTRY = "US";

function buildCheckoutEmail(values) {
  const [firstName, ...restName] = values.fullName.trim().split(" ");
  return (
    values.email ||
    `${firstName}.${restName.join(".") || "customer"}@healthypaws.local`
      .replace(/\.+/g, ".")
      .toLowerCase()
  );
}

function buildOrderPayload({
  values,
  items,
  subtotal,
  shipping,
  tax,
  discount,
  promoDiscount,
  couponDiscount,
  couponCode,
  paymentMethod = "cod",
  stripePaymentIntentId,
  prescriptions,
}) {
  const rxUrls = [];
  if (prescriptions && typeof prescriptions === "object") {
    if (Array.isArray(prescriptions)) {
      prescriptions.forEach((p) => {
        if (typeof p === "string" && p) rxUrls.push(p);
        else if (p?.url) rxUrls.push(p.url);
        else if (p?.prescriptionUrl) rxUrls.push(p.prescriptionUrl);
      });
    } else {
      Object.values(prescriptions).forEach((p) => {
        if (typeof p === "string" && p) rxUrls.push(p);
        else if (p?.url) rxUrls.push(p.url);
        else if (p?.prescriptionUrl) rxUrls.push(p.prescriptionUrl);
        else if (p?.rawResponse?.url) rxUrls.push(p.rawResponse.url);
      });
    }
  }

  const uniqueRxUrls = [...new Set(rxUrls.filter(Boolean))];
  const mainRxUrl = uniqueRxUrls[0] || null;

  const formattedItems = items.map((item, idx) => {
    const isRxRequired = Boolean(
      item.prescriptionRequired ||
      item.product?.prescriptionRequired ||
      item.prescription_required
    );
    const rxData = getPrescriptionForItem(prescriptions, item);
    const itemRxUrl =
      rxData?.url ||
      rxData?.prescriptionUrl ||
      rxData?.rawResponse?.url ||
      uniqueRxUrls[idx] ||
      mainRxUrl;

    return {
      productId: item.productId || item.id,
      variantId:
        item.variantId || item.selectedVariantId || item.selectedVariant?.id,
      variantLabel:
        item.variantLabel ||
        item.selectedVariant?.label ||
        item.selectedSize?.label,
      name: item.name || item.title,
      sku: item.sku,
      quantity: item.quantity,
      price: item.price,
      image: item.image,
      optionLabel: item.optionLabel,
      selectedSize: item.selectedSize,
      selectedColor: item.selectedColor,
      ...(isRxRequired
        ? {
            prescriptionRequired: true,
            ...(itemRxUrl
              ? {
                  prescriptionUrl: itemRxUrl,
                  prescriptionUrls: [itemRxUrl],
                  prescription: itemRxUrl,
                }
              : {}),
          }
        : {}),
    };
  });

  const payload = {
    items: formattedItems,
    shippingAddress: {
      fullName: values.fullName,
      phone: values.phone,
      address: values.address,
      city: values.city,
      state: values.state,
      postalCode: values.postalCode,
      country: values.country || DEFAULT_SHIPPING_COUNTRY,
    },
    phone: values.phone,
    subtotal,
    shipping,
    tax,
    discount,
    promoDiscount,
    couponDiscount,
    couponCode,
    paymentMethod,
    stripePaymentIntentId,
  };

  if (mainRxUrl) {
    payload.prescriptionUrl = mainRxUrl;
    payload.prescriptionUrls = uniqueRxUrls.length ? uniqueRxUrls : [mainRxUrl];
    payload.prescription = mainRxUrl;
    payload.prescriptionData = {
      url: mainRxUrl,
      urls: uniqueRxUrls.length ? uniqueRxUrls : [mainRxUrl],
    };
  }

  return payload;
}

export const checkoutApi = {
  activeTax: () =>
    apiRequest("/customer-panel/taxes/active", { cache: "no-store" }),

  ensureCheckoutContact(values) {
    return authApi.checkoutContact({
      name: values.fullName,
      email: buildCheckoutEmail(values),
      phone: values.phone,
    });
  },

  uploadPrescription: async (file) => {
    const formData = new FormData();
    formData.append("prescription", file);

    const res = await apiRequest("/customer-panel/checkout/prescription", {
      method: "POST",
      body: formData,
    });
    return res;
  },

  createPaymentIntent: ({ amount, currency = "usd" }) =>
    apiRequest("/customer-panel/payments/create-intent", {
      method: "POST",
      body: JSON.stringify({ amount, currency }),
    }),

  updatePaymentIntent: ({ paymentIntentId, amount, currency = "usd" }) =>
    apiRequest(`/customer-panel/payments/${paymentIntentId}`, {
      method: "PATCH",
      body: JSON.stringify({ amount, currency }),
    }),

  validateCoupon: ({ code, subtotal, discount = 0 }) =>
    apiRequest("/customer-panel/coupons/validate", {
      method: "POST",
      body: JSON.stringify({ code, subtotal, discount }),
    }),

  quoteOrder(payload) {
    return apiRequest("/customer-panel/orders/quote", {
      method: "POST",
      body: JSON.stringify(buildOrderPayload(payload)),
    });
  },

  async placeOrder(payload) {
    const { values } = payload;
    await this.ensureCheckoutContact(values);

    return apiRequest("/customer-panel/orders", {
      method: "POST",
      body: JSON.stringify(buildOrderPayload(payload)),
    });
  },
};
