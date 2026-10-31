import { useEffect, useRef } from "react";

const revealTargets = ".manifesto, .section-heading, .feature-card, .platform-inner, .closing, .page-hero, .download-card, .release-bar, .docs-layout, .faq-item, .policy-content section, .opensource-grid article, .notice-panel, .install-info, .previous-releases";

export default function SiteMotion() {
  const cursorRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(revealTargets));
    let observer: IntersectionObserver | undefined;
    if (!reducedMotion && "IntersectionObserver" in window) {
      document.documentElement.classList.add("motion-ready");
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            (entry.target as HTMLElement).dataset.reveal = "visible";
            observer?.unobserve(entry.target);
          }
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -4% 0px" });
      nodes.forEach((node, index) => {
        node.dataset.reveal = "pending";
        node.style.setProperty("--reveal-delay", `${Math.min(index % 4, 3) * 70}ms`);
        observer?.observe(node);
      });
    }
    const cursor = cursorRef.current;
    if (!cursor || reducedMotion || !finePointer) return () => observer?.disconnect();
    let frame = 0;
    const move = (event: PointerEvent) => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        cursor.style.setProperty("--cursor-x", `${event.clientX}px`);
        cursor.style.setProperty("--cursor-y", `${event.clientY}px`);
        cursor.classList.add("cursor-visible");
      });
    };
    const hover = (event: PointerEvent) => {
      cursor.classList.toggle("cursor-over-interactive", Boolean((event.target as HTMLElement | null)?.closest("a, button, [role=button], .feature-card, .download-card")));
    };
    window.addEventListener("pointermove", move, { passive: true });
    document.addEventListener("pointerover", hover, { passive: true });
    return () => {
      observer?.disconnect(); cancelAnimationFrame(frame);
      window.removeEventListener("pointermove", move);
      document.removeEventListener("pointerover", hover);
    };
  }, []);
  return <div className="cursor-orbit" ref={cursorRef} aria-hidden="true"><span/><i/></div>;
}
