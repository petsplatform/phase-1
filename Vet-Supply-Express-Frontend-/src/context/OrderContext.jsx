import React, { createContext, useState, useContext, useEffect } from "react";
import { AppContext } from "./AppContext";
import { orderApi } from "../api/orderApi";
import { accountApi } from "../api/accountApi";
import { AUTH_CHANGE_EVENT, getStoredSession } from "../api/authStorage";

export const OrderContext = createContext();

const COUPONS = {
  VETEXPRESS10: { discount: 10, type: "percent", label: "10% Off" },
  SAVE15: { discount: 15, type: "percent", label: "15% Off" },
  FLAT20: { discount: 20, type: "fixed", label: "$20 Off" },
  WELCOME5: { discount: 5, type: "fixed", label: "$5 Off" },
};

const normalizeAddress = (addr, idx) => {
  if (!addr) return null;
  const rawId = addr._id || addr.id || (addr.address && (addr.address._id || addr.address.id)) || String(idx);
  return {
    id: String(rawId),
    _id: addr._id || addr.id || String(rawId),
    label: addr.label || "Home",
    fullName: addr.fullName || addr.name || "",
    phone: addr.phone || "",
    street: addr.street || addr.streetAddress || addr.addressLine1 || "",
    city: addr.city || "",
    state: addr.state || "",
    zip: addr.zip || addr.zipCode || addr.postalCode || "",
    country: addr.country || "United States",
    isDefault: Boolean(addr.isDefault || addr.default),
  };
};

export const OrderProvider = ({ children }) => {
  const { addToast } = useContext(AppContext);

  const [orders, setOrders] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vet_orders") || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    let isMounted = true;
    const fetchOrders = async () => {
      const token = getStoredSession()?.token;
      if (token) {
        try {
          const list = await orderApi.getMyOrders();
          if (isMounted && Array.isArray(list)) {
            setOrders(list);
            localStorage.setItem("vet_orders", JSON.stringify(list));
          }
        } catch (err) {
          console.error("Failed to load user orders from API:", err);
        }
      }
    };
    fetchOrders();
    window.addEventListener(AUTH_CHANGE_EVENT, fetchOrders);
    return () => {
      isMounted = false;
      window.removeEventListener(AUTH_CHANGE_EVENT, fetchOrders);
    };
  }, []);

  const [savedAddresses, setSavedAddresses] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vet_addresses") || "[]");
    } catch {
      return [];
    }
  });

  const fetchAddresses = async () => {
    const token = getStoredSession()?.token;
    if (token) {
      try {
        const list = await accountApi.getAddresses();
        if (Array.isArray(list)) {
          const normalized = list.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
          setSavedAddresses(normalized);
          localStorage.setItem("vet_addresses", JSON.stringify(normalized));
        }
      } catch (err) {
        console.warn("Failed to fetch user addresses from API:", err?.message || err);
      }
    }
  };

  useEffect(() => {
    fetchAddresses();
    window.addEventListener(AUTH_CHANGE_EVENT, fetchAddresses);
    return () => {
      window.removeEventListener(AUTH_CHANGE_EVENT, fetchAddresses);
    };
  }, []);

  const [savedContact, setSavedContact] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("vet_contact") || "null");
    } catch {
      return null;
    }
  });

  const saveContact = (contact) => {
    setSavedContact(contact);
    localStorage.setItem("vet_contact", JSON.stringify(contact));
  };

  const saveAddress = async (address) => {
    const targetId = address.id || address._id;
    let existingIndex = -1;
    if (targetId) {
      existingIndex = savedAddresses.findIndex(
        (a) =>
          (a.id && String(a.id) === String(targetId)) ||
          (a._id && String(a._id) === String(targetId))
      );
    }

    const newId = targetId || Date.now().toString();
    const updatedAddress = { ...address, id: newId };
    if (address._id) updatedAddress._id = address._id;

    setSavedAddresses((prev) => {
      let updated;
      if (existingIndex >= 0) {
        updated = prev.map((a, idx) => (idx === existingIndex ? { ...updatedAddress } : a));
      } else {
        updated = [...prev, updatedAddress];
      }
      if (updatedAddress.isDefault) {
        updated = updated.map((a) => ({
          ...a,
          isDefault: String(a.id) === String(newId) || String(a._id) === String(newId),
        }));
      }
      localStorage.setItem("vet_addresses", JSON.stringify(updated));
      return updated;
    });

    try {
      let apiResult;
      if (existingIndex >= 0) {
        const updateId = address._id || address.id || savedAddresses[existingIndex]?._id || savedAddresses[existingIndex]?.id || existingIndex;
        apiResult = await accountApi.updateAddress(updateId, updatedAddress);
      } else {
        apiResult = await accountApi.addAddress(updatedAddress);
      }

      if (Array.isArray(apiResult)) {
        const normalized = apiResult.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
        setSavedAddresses(normalized);
        localStorage.setItem("vet_addresses", JSON.stringify(normalized));
        return normalized;
      } else if (apiResult?.addresses && Array.isArray(apiResult.addresses)) {
        const normalized = apiResult.addresses.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
        setSavedAddresses(normalized);
        localStorage.setItem("vet_addresses", JSON.stringify(normalized));
        return normalized;
      }
    } catch (err) {
      console.warn("API address save notice, kept local version:", err?.message || err);
    }
    return updatedAddress;
  };

  const deleteAddress = async (id) => {
    const target = savedAddresses.find(
      (a) => String(a.id) === String(id) || String(a._id) === String(id)
    );
    const targetIndex = savedAddresses.findIndex(
      (a) => String(a.id) === String(id) || String(a._id) === String(id)
    );
    const apiId = target?._id || target?.id || id;

    setSavedAddresses((prev) => {
      const updated = prev.filter(
        (a) => String(a.id) !== String(id) && String(a._id) !== String(id)
      );
      localStorage.setItem("vet_addresses", JSON.stringify(updated));
      return updated;
    });

    try {
      const apiResult = await accountApi.removeAddress(apiId);
      if (Array.isArray(apiResult)) {
        const normalized = apiResult.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
        setSavedAddresses(normalized);
        localStorage.setItem("vet_addresses", JSON.stringify(normalized));
      } else if (apiResult?.addresses && Array.isArray(apiResult.addresses)) {
        const normalized = apiResult.addresses.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
        setSavedAddresses(normalized);
        localStorage.setItem("vet_addresses", JSON.stringify(normalized));
      }
    } catch (err) {
      console.warn("API address remove notice, kept local version:", err?.message || err);
      if (targetIndex >= 0) {
        try {
          const fallbackRes = await accountApi.removeAddress(targetIndex);
          if (Array.isArray(fallbackRes)) {
            const normalized = fallbackRes.map((a, idx) => normalizeAddress(a, idx)).filter(Boolean);
            setSavedAddresses(normalized);
            localStorage.setItem("vet_addresses", JSON.stringify(normalized));
          }
        } catch {
          // ignore fallback error
        }
      }
    }
  };

  const applyCoupon = (code) => {
    const coupon = COUPONS[code.toUpperCase()];
    if (coupon) return { ...coupon, code: code.toUpperCase() };
    return null;
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `VSE-${timestamp}-${random}`;
  };

  const placeOrder = ({ contact, address, payment, cart, cartTotal, coupon, shipping: shippingInput = 0, taxRate = 8 }) => {
    const orderId = generateOrderId();
    const shipping = Number(shippingInput) || 0;
    let discount = 0;
    if (coupon) {
      discount = coupon.type === "percent"
        ? (cartTotal * coupon.discount) / 100
        : Math.min(coupon.discount, cartTotal);
    }
    const tax = Math.max(0, cartTotal - discount) * (Number(taxRate) / 100);
    const grandTotal = cartTotal - discount + shipping + tax;
    const estimatedDelivery = new Date();
    estimatedDelivery.setDate(estimatedDelivery.getDate() + 5);

    const order = {
      id: orderId,
      date: new Date().toISOString(),
      status: "Confirmed",
      paymentStatus: "Paid",
      estimatedDelivery: estimatedDelivery.toISOString(),
      contact,
      address,
      payment: { method: payment.method, last4: payment.cardNumber ? payment.cardNumber.slice(-4) : null },
      items: cart,
      subtotal: cartTotal,
      discount,
      shipping,
      tax,
      coupon: coupon ? coupon.code : null,
      grandTotal,
      trackingSteps: [
        { label: "Order Placed", done: true, date: new Date().toISOString() },
        { label: "Processing", done: false, date: null },
        { label: "Shipped", done: false, date: null },
        { label: "Out for Delivery", done: false, date: null },
        { label: "Delivered", done: false, date: null },
      ],
    };

    setOrders((prev) => {
      const updated = [order, ...prev];
      localStorage.setItem("vet_orders", JSON.stringify(updated));
      return updated;
    });

    addToast({
      title: "🎉 Order Placed Successfully!",
      message: "Your order is confirmed and being prepared.",
      type: "cart",
    });

    return order;
  };

  const saveRemoteOrder = (remoteOrder) => {
    setOrders((prev) => {
      const updated = [remoteOrder, ...prev];
      localStorage.setItem("vet_orders", JSON.stringify(updated));
      return updated;
    });
    addToast({
      title: "🎉 Order Placed Successfully!",
      message: "Your order is confirmed and being prepared.",
      type: "cart",
    });
    return remoteOrder;
  };

  const getOrder = (id) => orders.find((o) => o.id === id);

  return (
    <OrderContext.Provider value={{
      orders,
      savedAddresses,
      savedContact,
      saveContact,
      saveAddress,
      deleteAddress,
      fetchAddresses,
      applyCoupon,
      placeOrder,
      saveRemoteOrder,
      getOrder,
      COUPONS,
    }}>
      {children}
    </OrderContext.Provider>
  );
};
