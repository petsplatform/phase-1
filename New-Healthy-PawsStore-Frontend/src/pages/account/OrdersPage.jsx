import { useEffect, useMemo, useState } from "react";
import OrderCard from "../../components/account/OrderCard";
import OrdersToolbar from "../../components/account/OrdersToolbar";
import { getOrders } from "../../services/orderService";

export default function OrdersPage() {
  const [orders, setOrders] = useState([]);
  const [filter, setFilter] = useState("All Orders");
  const [sort, setSort] = useState("Newest First");

  useEffect(() => {
    getOrders().then(setOrders);
  }, []);

  const visibleOrders = useMemo(() => {
    let next = [...orders];
    if (filter !== "All Orders") {
      next = next.filter((order) => order.status === filter.toLowerCase().replaceAll(" ", "-"));
    }
    if (sort === "Price: High to Low") next.sort((a, b) => b.total - a.total);
    if (sort === "Price: Low to High") next.sort((a, b) => a.total - b.total);
    if (sort === "Oldest First") next.reverse();
    return next;
  }, [orders, filter, sort]);

  const handleOrderUpdated = (updatedOrder) => {
    setOrders((current) =>
      current.map((o) => (o.id === updatedOrder.id ? { ...o, ...updatedOrder } : o))
    );
  };

  return (
    <section className="pb-24 sm:pb-8">
      <h1 className="font-display text-[28px] font-extrabold text-textMain sm:text-[34px]">My Orders</h1>
      <p className="mt-1 text-[13px] font-semibold text-muted sm:text-[14px]">Track, view and manage all your orders</p>
      <OrdersToolbar filter={filter} setFilter={setFilter} sort={sort} setSort={setSort} />
      <div className="mt-6 grid gap-5">
        {visibleOrders.length ? visibleOrders.map((order) => <OrderCard key={order.id} order={order} onOrderUpdated={handleOrderUpdated} />) : <EmptyOrders />}
      </div>
    </section>
  );
}

function EmptyOrders() {
  return (
    <div className="rounded-2xl bg-white p-8 text-center shadow-card">
      <h2 className="font-display text-[26px] font-extrabold">No orders found</h2>
      <p className="mt-2 text-[14px] font-semibold text-muted">When you place an order, it will appear here.</p>
      <a href="/products" className="mt-5 inline-flex h-10 items-center rounded-lg bg-secondaryDark px-6 text-[13px] font-extrabold text-white">Start Shopping</a>
    </div>
  );
}
