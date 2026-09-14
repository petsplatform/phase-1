import { useEffect, useState } from "react";
import DashboardHero from "../../components/account/DashboardHero";
import DashboardStats from "../../components/account/DashboardStats";
import LoyaltyCard from "../../components/account/LoyaltyCard";
import RecentOrders from "../../components/account/RecentOrders";
import { getCustomerProfile } from "../../services/accountService";
import { getOrders } from "../../services/orderService";

export default function DashboardPage() {
  const [profile, setProfile] = useState(null);
  const [orders, setOrders] = useState([]);

  useEffect(() => {
    Promise.all([getCustomerProfile(), getOrders()]).then(([nextProfile, nextOrders]) => {
      setProfile(nextProfile);
      setOrders(nextOrders);
    });
  }, []);

  if (!profile) return <AccountSkeleton />;

  return (
    <div className="grid gap-7 xl:grid-cols-[minmax(0,1fr)_240px]">
      <div className="min-w-0">
        <DashboardHero profile={profile} />
        <div className="mt-8">
          <DashboardStats orders={orders} />
          <div className="mt-7">
            <RecentOrders orders={orders} />
          </div>
        </div>
      </div>
      <LoyaltyCard points={profile.loyaltyPoints} />
    </div>
  );
}

function  AccountSkeleton() {
  return <div className="h-[360px] animate-pulse rounded-2xl bg-sageLight" />;
}
