import { Link } from "react-router-dom";
import supportDog from "../../assets/images/account/support-dog.png";

export default function AccountHelpCard() {
  return (
    <aside className="relative mt-7 h-[118px] overflow-hidden rounded-[13px] border border-borderSoft bg-sageLight shadow-card">
      <img
        src={supportDog}
        alt="Support dog"
        className="absolute bottom-0 left-0 h-[112px] w-[82px] object-contain object-bottom"
        loading="lazy"
      />
      <div className="ml-[84px] flex h-full flex-col justify-center pr-3">
        <h3 className="text-[15px] font-extrabold leading-tight text-textMain">Need Help?</h3>
        <p className="mt-2 text-[11px] font-semibold leading-[1.35] text-muted">Our pet experts are here for you!</p>
        <Link
          to="/contact"
          className="mt-3 inline-flex h-[31px] w-[92px] items-center justify-center rounded-[7px] bg-secondaryDark text-[11px] font-extrabold text-white shadow-sm transition hover:bg-primaryDark"
        >
          Contact Us
        </Link>
      </div>
    </aside>
  );
}
