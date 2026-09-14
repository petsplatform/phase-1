import { useEffect } from "react";
import { useLocation } from "react-router-dom";

function ScrollToTop() {
  const location = useLocation();

  useEffect(() => {
    if (location.hash) {
      const sectionId = location.hash.slice(1);

      window.requestAnimationFrame(() => {
        const element = document.getElementById(sectionId);

        if (element) {
          element.scrollIntoView({ behavior: "smooth", block: "start" });
          return;
        }

        window.scrollTo({ top: 0, behavior: "smooth" });
      });

      return;
    }

    window.scrollTo({ top: 0, behavior: "smooth" });
  }, [location.hash, location.pathname]);

  return null;
}

export default ScrollToTop;
