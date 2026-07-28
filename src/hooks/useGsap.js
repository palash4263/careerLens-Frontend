// src/hooks/useGsap.js
/**
 * GSAP Utility Hook — CareerLens
 * Provides reusable GSAP + ScrollTrigger animations.
 * Import this hook in any page/component.
 */
import { useEffect, useRef } from "react";
import { gsap } from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import { TextPlugin } from "gsap/TextPlugin";

// Register plugins once
gsap.registerPlugin(ScrollTrigger, TextPlugin);

export { gsap, ScrollTrigger };

/**
 * useGsapReveal — Staggered scroll-triggered reveal for a container's children
 * @param {string} selector - CSS selector for elements to animate
 * @param {object} opts - Optional overrides
 */
export function useGsapReveal(selector, opts = {}) {
  const ref = useRef(null);

  useEffect(() => {
    const ctx = gsap.context(() => {
      const els = gsap.utils.toArray(selector);
      if (!els.length) return;

      gsap.fromTo(
        els,
        { opacity: 0, y: 48, scale: 0.96 },
        {
          opacity: 1,
          y: 0,
          scale: 1,
          duration: opts.duration ?? 0.75,
          ease: opts.ease ?? "power3.out",
          stagger: opts.stagger ?? 0.1,
          scrollTrigger: {
            trigger: els[0],
            start: opts.start ?? "top 88%",
            toggleActions: "play none none none",
          },
          ...opts.gsapProps,
        }
      );
    }, ref);

    return () => ctx.revert();
  }, [selector]);

  return ref;
}

/**
 * useGsapCounter — Animated number counter (GSAP-powered)
 * @param {string} selector - CSS selector for the counter element
 * @param {number} target - Final number
 * @param {object} opts
 */
export function useGsapCounter(selector, target, opts = {}) {
  useEffect(() => {
    const el = document.querySelector(selector);
    if (!el) return;

    const obj = { val: 0 };
    gsap.to(obj, {
      val: target,
      duration: opts.duration ?? 2,
      ease: opts.ease ?? "power2.out",
      delay: opts.delay ?? 0,
      onUpdate() {
        el.textContent = opts.suffix
          ? Math.round(obj.val) + opts.suffix
          : Math.round(obj.val);
      },
      scrollTrigger: selector
        ? { trigger: el, start: "top 90%" }
        : undefined,
    });

    return () => gsap.killTweensOf(obj);
  }, [target]);
}

/**
 * useGsapEntrance — Hero entrance: splits heading + fades content
 * Call inside a component with containerRef pointing to the hero section
 */
export function useGsapEntrance(containerRef, opts = {}) {
  useEffect(() => {
    if (!containerRef.current) return;

    const ctx = gsap.context(() => {
      // Badge
      gsap.from("[data-gsap='badge']", {
        opacity: 0, y: -20, scale: 0.85,
        duration: 0.6, ease: "back.out(1.7)",
        delay: opts.delay ?? 0.1,
      });

      // Heading — word-by-word
      const heading = containerRef.current.querySelector("[data-gsap='heading']");
      if (heading) {
        const words = heading.textContent.split(" ");
        heading.innerHTML = words.map(w => `<span class="gsap-word">${w}</span>`).join(" ");
        gsap.from(".gsap-word", {
          opacity: 0, y: 30, rotateX: -45,
          duration: 0.65, ease: "power3.out",
          stagger: 0.07,
          delay: (opts.delay ?? 0.1) + 0.15,
          transformOrigin: "top center",
        });
      }

      // Subtext
      gsap.from("[data-gsap='sub']", {
        opacity: 0, y: 20,
        duration: 0.7, ease: "power2.out",
        delay: (opts.delay ?? 0.1) + 0.5,
      });

      // CTA Buttons
      gsap.from("[data-gsap='cta']", {
        opacity: 0, y: 20, scale: 0.92,
        duration: 0.6, ease: "back.out(1.4)",
        stagger: 0.1,
        delay: (opts.delay ?? 0.1) + 0.65,
      });

      // Stat rings
      gsap.from("[data-gsap='stat']", {
        opacity: 0, scale: 0.6, rotation: -10,
        duration: 0.7, ease: "elastic.out(1, 0.6)",
        stagger: 0.1,
        delay: (opts.delay ?? 0.1) + 0.55,
      });

      // Right mockup card
      gsap.from("[data-gsap='mockup']", {
        opacity: 0, x: 60, rotation: 4,
        duration: 0.85, ease: "power3.out",
        delay: (opts.delay ?? 0.1) + 0.4,
      });
    }, containerRef);

    return () => ctx.revert();
  }, []);
}

/**
 * useGsapCards — ScrollTrigger reveal for card grids
 */
export function useGsapCards(selector, opts = {}) {
  useEffect(() => {
    const ctx = gsap.context(() => {
      const cards = gsap.utils.toArray(selector);
      if (!cards.length) return;

      gsap.fromTo(
        cards,
        { opacity: 0, y: 60, scale: 0.94 },
        {
          opacity: 1, y: 0, scale: 1,
          duration: opts.duration ?? 0.7,
          ease: "power3.out",
          stagger: opts.stagger ?? 0.12,
          scrollTrigger: {
            trigger: cards[0].parentElement ?? cards[0],
            start: "top 85%",
            toggleActions: "play none none none",
          },
        }
      );

      // Hover magnetic on each card
      cards.forEach(card => {
        card.addEventListener("mousemove", (e) => {
          const rect = card.getBoundingClientRect();
          const x = ((e.clientX - rect.left) / rect.width - 0.5) * 12;
          const y = ((e.clientY - rect.top) / rect.height - 0.5) * 8;
          gsap.to(card, { rotateX: -y, rotateY: x, duration: 0.4, ease: "power2.out", transformPerspective: 800 });
        });
        card.addEventListener("mouseleave", () => {
          gsap.to(card, { rotateX: 0, rotateY: 0, duration: 0.5, ease: "elastic.out(1, 0.5)" });
        });
      });
    });

    return () => ctx.revert();
  }, [selector]);
}

/**
 * useGsapNavbar — Navbar drop-in on page load
 */
export function useGsapNavbar(selector = ".nb-root") {
  useEffect(() => {
    gsap.fromTo(
      selector,
      { y: -80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.8, ease: "power3.out", delay: 0.05 }
    );
  }, []);
}

/**
 * useGsapFloatingDock — Dock entrance from bottom
 */
export function useGsapFloatingDock(selector = ".fd-root") {
  useEffect(() => {
    gsap.fromTo(
      selector,
      { y: 80, opacity: 0 },
      { y: 0, opacity: 1, duration: 0.9, ease: "back.out(1.4)", delay: 0.8 }
    );
  }, []);
}
