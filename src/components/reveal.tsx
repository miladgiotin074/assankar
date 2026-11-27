"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

export function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [state, setState] = useState<"idle" | "wait" | "in">("idle");

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const rect = el.getBoundingClientRect();
    const height = window.innerHeight || document.documentElement.clientHeight;
    const alreadyVisible = rect.top < height * 0.92 && rect.bottom > 32;

    if (reduce || alreadyVisible) return;

    setState("wait");

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        setState("in");
        observer.disconnect();
      },
      { threshold: 0.18, rootMargin: "0px 0px -6% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  const motion = state === "wait" ? "reveal-wait" : state === "in" ? "reveal-in" : "";

  return (
    <div
      ref={ref}
      className={`${className} ${motion}`.trim()}
      style={state === "in" && delay ? { animationDelay: `${delay}ms` } : undefined}
    >
      {children}
    </div>
  );
}
