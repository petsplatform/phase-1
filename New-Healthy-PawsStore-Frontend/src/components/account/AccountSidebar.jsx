import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
import { accountNavigation } from "../../data/accountNavigation";
import { logout } from "../../services/authService";
import ConfirmModal from "../common/ConfirmModal";
import AccountHelpCard from "./AccountHelpCard";

export default function AccountSidebar() {
  const navigate = useNavigate();
  const [logoutOpen, setLogoutOpen] = useState(false);

  const confirmLogout = () => {
    logout();
    setLogoutOpen(false);
    navigate("/login");
  };

  return (
    <aside className="hidden w-[210px] shrink-0 lg:block">
      <nav className="rounded-[14px] border border-borderSoft bg-white p-3 shadow-card" aria-label="Account navigation">
        {accountNavigation.map(({ label, path, icon: Icon, action }) =>
          action === "logout" ? (
            <button
              key={label}
              type="button"
              onClick={() => setLogoutOpen(true)}
              className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-left text-[12px] font-extrabold text-textMain transition hover:bg-sageLight"
            >
              <Icon size={15} />
              {label}
            </button>
          ) : (
            <NavLink
              key={label}
              to={path}
              className={({ isActive }) =>
                `flex items-center gap-3 rounded-lg px-3 py-2.5 text-[12px] font-extrabold transition ${
                  isActive ? "bg-sageLight text-secondaryDark" : "text-textMain hover:bg-sageLight"
                }`
              }
            >
              <Icon size={15} />
              {label}
            </NavLink>
          ),
        )}
      </nav>
      <AccountHelpCard />
      <ConfirmModal
        open={logoutOpen}
        title="Logout from your account?"
        message="You will need to sign in again to view orders, saved addresses, and account details."
        confirmText="Yes, Logout"
        tone="danger"
        onCancel={() => setLogoutOpen(false)}
        onConfirm={confirmLogout}
      />
    </aside>
  );
}
