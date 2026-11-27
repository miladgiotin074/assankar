"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const behavior: ScrollBehavior = reduce ? "auto" : "smooth";

    function snap() {
      window.scrollTo({ top: 0, left: 0, behavior: "auto" });
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;

      const sheet = document.querySelector<HTMLElement>(".dash-sheet");
      if (sheet) sheet.scrollTop = 0;

      const target = document.getElementById("dash-next");
      if (!target) return;

      if (sheet && sheet.contains(target)) {
        const top = Math.max(0, target.offsetTop - 8);
        sheet.scrollTo({ top, behavior });
      } else {
        target.scrollIntoView({ behavior, block: "start" });
      }
    }

    const frame = window.requestAnimationFrame(() => {
      snap();
      window.setTimeout(snap, reduce ? 0 : 120);
    });

    return () => window.cancelAnimationFrame(frame);
  }, [pathname]);

  return null;
}
