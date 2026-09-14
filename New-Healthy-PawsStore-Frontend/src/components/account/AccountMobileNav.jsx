import { NavLink } from "react-router-dom";
import { accountNavigation } from "../../data/accountNavigation";

export default function AccountMobileNav() {
  return (
    <nav
      className="mb-6 flex gap-2.5 overflow-x-auto rounded-[16px] border border-borderSoft bg-white p-2 shadow-sm [ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden lg:hidden"
      aria-label="Mobile account navigation"
    >
      {accountNavigation.filter((item) => !item.action).map(({ label, path }) => (
        <NavLink
          key={label}
          to={path}
          className={({ isActive }) =>
            `shrink-0 rounded-xl px-4 py-2.5 text-[13px] font-extrabold transition active:scale-[0.97] ${
              isActive ? "bg-secondaryDark text-white shadow-sm" : "bg-sageLight/70 text-textMain hover:bg-sageLight"
            }`
          }
        >
          {label}
        </NavLink>
      ))}
    </nav>
  );
}
