import React, { useContext, useState } from "react";
import { Link } from "react-router-dom";
import { OrderContext } from "../../context/OrderContext";
import ProductImage from "../Common/ProductImage";
import {
  Package,
  ChevronRight,
  ShoppingBag,
  Truck,
  CheckCircle2,
  Clock,
  X,
  Search,
} from "lucide-react";

const STATUS_COLORS = {
  Pending: "bg-amber-50 text-amber-700 border-amber-200",
  Processing: "bg-blue-50 text-blue-700 border-blue-200",
  Shipped: "bg-indigo-50 text-indigo-700 border-indigo-200",
  Delivered: "bg-emerald-50 text-emerald-700 border-emerald-200",
  Cancelled: "bg-red-50 text-red-700 border-red-200",
};

const STATUS_ICONS = {
  Pending: <Clock className="w-3.5 h-3.5" />,
  Processing: <Clock className="w-3.5 h-3.5" />,
  Shipped: <Truck className="w-3.5 h-3.5" />,
  Delivered: <Package className="w-3.5 h-3.5" />,
  Cancelled: <X className="w-3.5 h-3.5" />,
};

const MyOrdersPage = () => {
  const { orders } = useContext(OrderContext);
  const [search, setSearch] = useState("");

  const filtered = orders.filter(
    (o) =>
      o.id.toLowerCase().includes(search.toLowerCase()) ||
      o.items.some((i) => i.name.toLowerCase().includes(search.toLowerCase())),
  );

  return (
    <div className="min-h-screen bg-[#F7FAFC] py-10 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#0874C9] mb-2">
            <Package className="w-4 h-4" />
            <span>Order History</span>
          </div>
          <h1 className="font-heading font-black text-3xl text-[#102A43]">
            My Orders
          </h1>
          <p className="text-sm text-[#627D98] mt-1">
            Track and manage all your VetSupplyExpress orders.
          </p>
        </div>

        {/* Search */}
        {orders.length > 0 && (
          <div className="relative mb-6">
            <Search className="w-4 h-4 text-[#627D98] absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search by order ID or product name…"
              className="w-full bg-white border border-[#D9E8F2] rounded-2xl pl-11 pr-4 py-3 text-sm text-[#102A43] focus:outline-none focus:ring-2 focus:ring-[#0874C9] transition-all"
            />
          </div>
        )}

        {/* Empty state */}
        {orders.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-16 text-center flex flex-col items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-[#EAF5FC] flex items-center justify-center">
              <ShoppingBag className="w-10 h-10 text-[#9FB3C8]" />
            </div>
            <h3 className="font-heading font-black text-xl text-[#102A43]">
              No orders yet
            </h3>
            <p className="text-sm text-[#627D98] max-w-xs">
              Your order history will appear here once you place your first
              order.
            </p>
            <Link
              to="/shop"
              className="mt-2 bg-[#0874C9] hover:bg-[#F28C18] text-white font-bold px-8 py-3 rounded-2xl transition-all duration-300 cursor-pointer"
            >
              Start Shopping
            </Link>
          </div>
        ) : filtered.length === 0 ? (
          <div className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm p-12 text-center">
            <p className="text-sm text-[#627D98]">
              No orders match your search.
            </p>
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {filtered.map((order) => {
              const orderDate = new Date(order.date).toLocaleDateString(
                "en-US",
                {
                  year: "numeric",
                  month: "short",
                  day: "numeric",
                },
              );
              const estDate = new Date(
                order.estimatedDelivery,
              ).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
              });

              return (
                <div
                  key={order.id}
                  className="bg-white rounded-3xl border border-[#D9E8F2] shadow-sm overflow-hidden hover:border-[#0874C9]/30 hover:shadow-md transition-all duration-200"
                >                  {/* Order header */}
                  <div className="bg-[#F7FAFC] border-b border-[#D9E8F2] p-4 sm:px-5 sm:py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 sm:gap-4 w-full sm:w-auto">
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">
                          Order ID
                        </p>
                        <p className="font-heading font-bold text-xs sm:text-sm text-[#0874C9] truncate">
                          {order.id}
                        </p>
                      </div>
                      <div>
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">
                          Placed On
                        </p>
                        <p className="text-xs font-bold text-[#102A43]">
                          {orderDate}
                        </p>
                      </div>
                      <div className="col-span-2 sm:col-span-1">
                        <p className="text-[10px] font-black uppercase tracking-wider text-[#9FB3C8]">
                          Total
                        </p>
                        <p className="text-xs sm:text-sm font-black text-[#102A43]">
                          ${order.grandTotal.toFixed(2)}
                        </p>
                      </div>
                    </div>
                    <div
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1 rounded-full border shrink-0 whitespace-nowrap self-start sm:self-auto ${STATUS_COLORS[order.status] || STATUS_COLORS.Confirmed}`}
                    >
                      {STATUS_ICONS[order.status]}
                      {order.status}
                    </div>
                  </div>

                  {/* Items preview */}
                  <div className="p-4 sm:p-5">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 mb-4">
                      {order.items.slice(0, 3).map((item) => (
                        <div
                          key={item.id}
                          className="flex items-center gap-2 bg-[#F7FAFC] border border-[#D9E8F2] rounded-xl p-2.5"
                        >
                          <ProductImage
                            src={item.image}
                            alt={item.name}
                            product={item}
                            className="w-9 h-9 rounded-lg object-cover shrink-0 border border-[#D9E8F2]/60"
                          />
                          <div className="min-w-0 flex-1">
                            <p className="text-xs font-bold text-[#102A43] truncate">
                              {item.name}
                            </p>
                            <p className="text-[10px] text-[#627D98]">
                              Qty: {item.quantity}
                            </p>
                          </div>
                        </div>
                      ))}
                      {order.items.length > 3 && (
                        <div className="bg-[#EAF5FC] border border-[#D9E8F2] rounded-xl p-2.5 flex items-center justify-center text-xs font-bold text-[#627D98]">
                          +{order.items.length - 3} more
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-3.5 border-t border-[#F0F6FA]">
                      {estDate &&
                      estDate !== "Invalid Date" &&
                      estDate !== "—" &&
                      estDate !== "N/A" ? (
                        <div className="flex items-center gap-1.5 text-xs text-[#627D98]">
                          <Truck className="w-3.5 h-3.5 text-[#F28C18] shrink-0" />
                          <span>
                            Est. Delivery:{" "}
                            <strong className="text-[#102A43]">
                              {estDate}
                            </strong>
                          </span>
                        </div>
                      ) : (
                        <div />
                      )}
                      <div className="grid grid-cols-2 sm:flex sm:items-center gap-2 w-full sm:w-auto">
                        {String(order.status || "").toLowerCase() !== "cancelled" && (
                          <Link
                            to={`/track-order/${order.id}`}
                            className="col-span-1 flex items-center justify-center gap-1.5 text-xs font-bold text-[#627D98] hover:text-[#0874C9] border border-[#D9E8F2] px-3 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap"
                          >
                            <Truck className="w-3.5 h-3.5 shrink-0" /> Track
                          </Link>
                        )}
                        <Link
                          to={`/order-confirmation/${order.id}`}
                          className="col-span-1 flex items-center justify-center gap-1.5 text-xs font-bold text-white bg-[#0874C9] hover:bg-[#F28C18] px-4 py-2.5 rounded-xl transition-colors cursor-pointer whitespace-nowrap shadow-xs"
                        >
                          View Details <ChevronRight className="w-3.5 h-3.5 shrink-0" />
                        </Link>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyOrdersPage;
