import { useEffect, useState } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";
import Footer from "../layout/Footer";
import Header from "../layout/Header";
import { verifyAuthSession } from "../../services/authService";
import { getCustomerToken } from "../../api/client";
import AccountBenefits from "./AccountBenefits";
import AccountMobileNav from "./AccountMobileNav";
import AccountSidebar from "./AccountSidebar";
import Newsletter from "../home/Newsletter";

export default function AccountLayout() {
  const location = useLocation();
  const [status, setStatus] = useState(() =>
    getCustomerToken() ? "checking" : "guest",
  );

  useEffect(() => {
    let active = true;

    verifyAuthSession()
      .then((user) => {
        if (active) setStatus(user ? "verified" : "guest");
      })
      .catch(() => {
        if (active) setStatus("guest");
      });

    return () => {
      active = false;
    };
  }, [location.pathname, location.search]);

  if (status === "checking") return <AccountAuthLoading />;

  if (status !== "verified")
    return (
      <Navigate
        to="/login"
        replace
        state={{ from: `${location.pathname}${location.search}` }}
      />
    );

  return (
    <div className="min-h-screen bg-background text-textMain">
      <Header />
      <main className="mx-auto flex max-w-[1330px] gap-7 px-4 py-7 sm:px-6 lg:px-8">
        <AccountSidebar />
        <section className="min-w-0 flex-1">
          <AccountMobileNav />
          <Outlet />
        </section>
      </main>
      <AccountBenefits />
      {/* <NewsletterBanner assetVariant="wishlist" /> */}
      <Newsletter />
      <Footer />
    </div>
  );
}

function AccountAuthLoading() {
  return (
    <div className="grid min-h-screen place-items-center bg-background text-secondaryDark">
      <div className="flex flex-col items-center gap-4">
        <span className="size-10 animate-spin rounded-full border-4 border-sage border-t-secondaryDark" />
        <span className="text-[14px] font-extrabold">Verifying your session...</span>
      </div>
    </div>
  );
}
