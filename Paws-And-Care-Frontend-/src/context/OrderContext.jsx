import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { orderApi } from '../api/orderApi';
import { normalizeOrder } from '../api/catalogAdapter';
import { AUTH_CHANGE_EVENT } from '../api/axios';
import { authApi } from '../api/authApi';

const OrderContext = createContext(null);

export function OrderProvider({ children }) {
  const [orders, setOrders] = useState([]);

  const refreshOrders = useCallback(async () => {
    if (!authApi.getSession()) {
      setOrders([]);
      return [];
    }
    const data = await orderApi.getMyOrders();
    const normalized = data.map(normalizeOrder);
    setOrders(normalized);
    return normalized;
  }, []);

  useEffect(() => {
    refreshOrders().catch(() => {});
    window.addEventListener(AUTH_CHANGE_EVENT, refreshOrders);
    return () => window.removeEventListener(AUTH_CHANGE_EVENT, refreshOrders);
  }, [refreshOrders]);

  const placeOrder = async (orderDetails) => {
    const created = await orderApi.createOrder(orderDetails);
    const normalized = normalizeOrder(created);
    setOrders((prev) => [normalized, ...prev.filter((order) => order.orderId !== normalized.orderId)]);
    return normalized;
  };

  const lookupOrder = useCallback(
    (orderId) => {
      if (!orderId) return null;
      return orders.find((order) => String(order.orderId).toLowerCase() === String(orderId).toLowerCase()) || null;
    },
    [orders],
  );

  const reorder = (orderId, onAddToCart) => {
    const target = lookupOrder(orderId);
    if (!target) return false;
    target.items.forEach((item) => {
      onAddToCart(
        {
          id: item.productId || item.id,
          productId: item.productId || item.id,
          name: item.name,
          price: item.price,
          image: item.image,
          options: item.option ? [item.option] : [],
        },
        item.quantity,
        item.option,
      );
    });
    return true;
  };

  const value = useMemo(
    () => ({ orders, placeOrder, lookupOrder, reorder, refreshOrders }),
    [lookupOrder, orders, refreshOrders],
  );

  return <OrderContext.Provider value={value}>{children}</OrderContext.Provider>;
}

export function useOrders() {
  return useContext(OrderContext);
}
