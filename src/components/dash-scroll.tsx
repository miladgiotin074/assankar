"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    const run = () => {
      const target = document.getElementById("dash-next");
      const sheet = document.querySelector<HTMLElement>(".dash-sheet");
      if (target && sheet) {
        sheet.scrollTop = Math.max(0, target.offsetTop - 12);
        target.scrollIntoView({ block: "start", behavior: "smooth" });
        return;
      }
      window.scrollTo(0, 0);
      document.documentElement.scrollTop = 0;
      document.body.scrollTop = 0;
      if (sheet) sheet.scrollTop = 0;
    };

    const frame = window.requestAnimationFrame(run);
    const timer = window.setTimeout(run, 120);
    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [pathname]);

  return null;
}
