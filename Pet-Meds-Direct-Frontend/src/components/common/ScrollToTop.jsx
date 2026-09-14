import { useEffect } from "react";
import { useLocation } from "react-router-dom";

export default function ScrollToTop() {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      // Wait a tick so the page has mounted/rendered before scrolling
      const id = hash.replace("#", "");
      const scrollToElement = () => {
        const el = document.getElementById(id);
        if (el) {
          el.scrollIntoView({ behavior: "smooth", block: "start" });
        }
      };
      // Try immediately, then retry after 300ms for slow renders
      scrollToElement();
      const timer = setTimeout(scrollToElement, 300);
      return () => clearTimeout(timer);
    } else {
      window.scrollTo({ top: 0, left: 0, behavior: "instant" });
    }
  }, [pathname, hash]);

  return null;
}
