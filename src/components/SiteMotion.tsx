import { useEffect, useRef } from "react";

const revealTargets = [
  ".manifesto",
  ".section-heading",
  ".feature-card",
  ".platform-inner",
  ".closing",
  ".page-hero",
  ".download-card",
  ".download-release-summary",
  ".download-recommendation",
  ".release-bar",
  ".docs-layout",
  ".faq-item",
  ".policy-content section",
  ".opensource-grid article",
  ".notice-panel",
  ".install-info",
  ".previous-releases",
  ".requirements-grid article",
  ".install-guide",
  ".roadmap-panel",
].join(", ");

function revealEffect(node: HTMLElement, index: number) {
  if (node.matches(".feature-card, .download-card, .opensource-grid article, .requirements-grid article")) return "card";
  if (node.matches(".section-heading, .page-hero")) return "heading";
  if (node.matches(".manifesto, .platform-inner, .closing, .docs-layout")) return "soft";
  return index % 2 === 0 ? "left" : "right";
}

export default function SiteMotion() {
  const progressRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const nodes = Array.from(document.querySelectorAll<HTMLElement>(revealTargets));
    let observer: IntersectionObserver | undefined;
    let frame = 0;

    if (!reducedMotion && "IntersectionObserver" in window && nodes.length) {
      document.documentElement.classList.add("motion-ready");
      observer = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (!entry.isIntersecting) return;
          const node = entry.target as HTMLElement;
          node.dataset.reveal = "visible";
          observer?.unobserve(node);
        });
      }, { threshold: 0.12, rootMargin: "0px 0px -6% 0px" });

      nodes.forEach((node, index) => {
        const siblings = Array.from(node.parentElement?.children ?? [])
          .filter(child => (child as HTMLElement).matches(revealTargets));
        const groupIndex = Math.max(0, siblings.indexOf(node));
        node.dataset.reveal = "pending";
        node.dataset.revealEffect = revealEffect(node, index);
        node.style.setProperty("--reveal-delay", `${Math.min(groupIndex, 5) * 85}ms`);
        observer?.observe(node);
      });
    }

    const topbar = document.querySelector<HTMLElement>(".topbar");
    const shell = document.querySelector<HTMLElement>(".site-shell");
    const updateScrollDecorations = () => {
      cancelAnimationFrame(frame);
      frame = requestAnimationFrame(() => {
        const scrollRange = document.documentElement.scrollHeight - window.innerHeight;
        const progress = scrollRange > 0 ? window.scrollY / scrollRange : 0;
        progressRef.current?.style.setProperty("--scroll-progress", String(Math.min(1, Math.max(0, progress))));
        topbar?.classList.toggle("site-scrolled", window.scrollY > 16);
        const shift = Math.min(window.scrollY * 0.09, 54);
        shell?.style.setProperty("--hero-scroll-shift", `${shift}px`);
        shell?.style.setProperty("--hero-orb-scroll-shift", `${shift * 0.32}px`);
      });
    };

    if (!reducedMotion) {
      updateScrollDecorations();
      window.addEventListener("scroll", updateScrollDecorations, { passive: true });
      window.addEventListener("resize", updateScrollDecorations, { passive: true });
    }

    return () => {
      observer?.disconnect();
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", updateScrollDecorations);
      window.removeEventListener("resize", updateScrollDecorations);
      document.documentElement.classList.remove("motion-ready");
      topbar?.classList.remove("site-scrolled");
      shell?.style.removeProperty("--hero-scroll-shift");
      shell?.style.removeProperty("--hero-orb-scroll-shift");
    };
  }, []);

  return <div className="scroll-progress" ref={progressRef} aria-hidden="true" />;
}
