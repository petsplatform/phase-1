import { FaApple, FaFacebook, FaGoogle } from "react-icons/fa";

const providers = [
  { name: "Google", icon: FaGoogle },
  { name: "Facebook", icon: FaFacebook },
  { name: "Apple", icon: FaApple },
];

export default function SocialLoginButtons({ onSocialLogin }) {
  return (
    <div className="grid gap-3 sm:grid-cols-3">
      {providers.map(({ name, icon: Icon }) => (
        <button
          key={name}
          type="button"
          onClick={() => onSocialLogin(name)}
          className="inline-flex h-11 items-center justify-center gap-2 rounded-lg border border-borderSoft bg-white px-3 text-[12px] font-extrabold text-textMain transition hover:bg-sageLight focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-secondary"
        >
          <Icon
            size={17}
            className={
              name === "Google"
                ? "text-red"
                : name === "Facebook"
                  ? "text-brandBlue"
                  : "text-textMain"
            }
          />
          Continue with {name}
        </button>
      ))}
    </div>
  );
}
