import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { BadgeDollarSign, Gift, ShoppingCart, Star } from "lucide-react";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { ChevronDownIcon } from "../components/common/HeaderIcons";
import { accountApi } from "../api/accountApi";
import { useAuth } from "../context/AuthContext";

const money = (value) => `$${Number(value || 0).toFixed(2)}`;
const dateLabel = (value) => {
  if (!value) return "";
  return new Date(value).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

const rewardSteps = [
  { title: "Create an account", text: "New customers can receive signup reward credit when the rewards program is enabled.", icon: Gift },
  { title: "Shop pet essentials", text: "Eligible purchases can earn points that build toward future savings.", icon: ShoppingCart },
  { title: "Redeem at checkout", text: "Reward points can be applied toward eligible orders once redemption settings are active.", icon: BadgeDollarSign },
];

const RewardPoints = () => {
  const { isLoggedIn } = useAuth();
  const [rewards, setRewards] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isLoggedIn) {
      setRewards(null);
      return undefined;
    }

    let active = true;
    setLoading(true);
    accountApi
      .getRewards()
      .then((data) => {
        if (active) setRewards(data);
      })
      .catch(() => {
        if (active) setRewards(null);
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [isLoggedIn]);

  const settings = rewards?.settings || {};
  const transactions = rewards?.transactions || [];

  return (
    <>
      <SEO
        title="Reward Points | Best Vet Care"
        description="Learn how Best Vet Care reward points help customers earn and redeem savings."
      />
      <div className="min-h-screen bg-[#fffdf7] text-[#122a50]">
        <Header />
        <main className="px-4 pb-8 pt-6 sm:px-5 lg:px-[22px]">
          <div className="mx-auto max-w-[1120px]">
            <nav className="flex flex-wrap items-center gap-2 text-xs font-semibold text-[#122a50b2]">
              <Link to="/" className="transition-colors hover:text-[#d9aa3d]">Home</Link>
              <ChevronDownIcon className="h-3 w-3 -rotate-90" />
              <span className="font-extrabold text-[#122a50]">Reward Points</span>
            </nav>

            <section className="mt-5 rounded-2xl border border-[#17345f1a] bg-[#f8f1df] px-5 py-8 shadow-[0_12px_36px_rgba(18,42,80,0.08)] sm:px-8">
              <div className="grid gap-6 md:grid-cols-[1fr_auto] md:items-center">
                <div className="flex max-w-3xl items-center gap-4">
                  <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-white text-[#d9aa3d] shadow-sm">
                    <Star className="h-7 w-7 fill-current" />
                  </span>
                  <div>
                    <h1 className="text-3xl font-extrabold tracking-normal text-[#122a50] sm:text-4xl">
                      Reward Points
                    </h1>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">
                      Earn points on eligible activity and use them for future pet-care savings.
                    </p>
                  </div>
                </div>
                {isLoggedIn ? (
                  <div className="rounded-xl bg-white px-5 py-4 text-left shadow-sm">
                    <p className="text-xs font-extrabold uppercase text-[#122a50]/60">Current Balance</p>
                    <p className="mt-1 text-3xl font-extrabold text-[#17345f]">{loading ? "..." : rewards?.balance || 0}</p>
                    <p className="text-xs font-bold text-[#122a50]/60">Worth {money(rewards?.value)}</p>
                  </div>
                ) : (
                  <Link to="/login" className="inline-flex h-11 items-center justify-center rounded-lg bg-[#17345f] px-5 text-sm font-extrabold text-white hover:bg-[#d9aa3d]">
                    Sign In
                  </Link>
                )}
              </div>
            </section>

            <section className="mt-6 grid gap-4 md:grid-cols-3">
              {rewardSteps.map((step) => {
                const Icon = step.icon;
                return (
                  <article key={step.title} className="rounded-2xl border border-[#17345f1a] bg-white p-5 shadow-sm">
                    <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-[#f8f1df] text-[#d9aa3d]">
                      <Icon className="h-5 w-5" />
                    </span>
                    <h2 className="mt-4 text-lg font-extrabold text-[#122a50]">{step.title}</h2>
                    <p className="mt-2 text-sm font-semibold leading-6 text-[#122a50b2]">{step.text}</p>
                  </article>
                );
              })}
            </section>

            <section className="mt-6 grid gap-4 lg:grid-cols-[340px_1fr]">
              <div className="rounded-2xl border border-[#17345f1a] bg-white p-6 shadow-sm">
                <h2 className="text-lg font-extrabold text-[#122a50]">Program Details</h2>
                <div className="mt-4 space-y-3 text-sm font-semibold text-[#122a50b2]">
                  <p>Signup bonus: <span className="font-extrabold text-[#17345f]">{Number(settings.rewardSignupPoints || 0)} points</span></p>
                  <p>Earn rate: <span className="font-extrabold text-[#17345f]">{Number(settings.rewardPointsPerCurrencyUnit || 0)} points per $1</span></p>
                  <p>Point value: <span className="font-extrabold text-[#17345f]">{money(settings.rewardPointValue)} each</span></p>
                  <p>Checkout cap: <span className="font-extrabold text-[#17345f]">{Number(settings.rewardMaxRedeemPercent || 0)}% of eligible order value</span></p>
                </div>
              </div>

              <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
                <div className="border-b border-[#17345f1a] px-5 py-4">
                  <h2 className="text-lg font-extrabold text-[#122a50]">Recent Activity</h2>
                </div>
                {isLoggedIn && transactions.length ? (
                  <div className="divide-y divide-[#17345f1a]">
                    {transactions.map((item) => (
                      <div key={item.id} className="grid gap-2 px-5 py-4 sm:grid-cols-[1fr_auto] sm:items-center">
                        <div>
                          <p className="text-sm font-extrabold text-[#122a50]">{item.description || (item.type === "redeem" ? "Redeemed points" : "Earned points")}</p>
                          <p className="mt-1 text-xs font-semibold text-[#122a50]/60">{dateLabel(item.createdAt)}{item.orderId ? ` - Order ${item.orderId}` : ""}</p>
                        </div>
                        <div className="text-left sm:text-right">
                          <p className={`text-sm font-extrabold ${Number(item.points) < 0 ? "text-red-600" : "text-emerald-700"}`}>
                            {Number(item.points) > 0 ? "+" : ""}{Number(item.points || 0)} points
                          </p>
                          <p className="text-xs font-semibold text-[#122a50]/60">Balance {Number(item.balanceAfter || 0)}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="p-8 text-center">
                    <p className="text-sm font-semibold text-[#122a50b2]">
                      {isLoggedIn ? "No reward activity yet." : "Sign in to see your reward balance and activity."}
                    </p>
                    <Link to={isLoggedIn ? "/products" : "/login"} className="mt-4 inline-flex rounded-lg bg-[#17345f] px-5 py-3 text-sm font-extrabold text-white hover:bg-[#d9aa3d]">
                      {isLoggedIn ? "Shop Products" : "Sign In"}
                    </Link>
                  </div>
                )}
              </div>
            </section>
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
};

export default RewardPoints;
