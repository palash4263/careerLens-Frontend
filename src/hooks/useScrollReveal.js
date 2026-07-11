import { useEffect } from "react";

export const useScrollReveal = (dependencies = []) => {
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("revealed");
          }
        });
      },
      { threshold: 0.05, rootMargin: "0px 0px -40px 0px" }
    );

    const elements = document.querySelectorAll(
      ".scroll-reveal, .scroll-reveal-3d, .scroll-reveal-left, .scroll-reveal-right"
    );
    
    elements.forEach((el) => observer.observe(el));

    return () => observer.disconnect();
  }, dependencies);
};
