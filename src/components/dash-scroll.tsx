"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";

export function DashScroll() {
  const pathname = usePathname();

  useEffect(() => {
    if (pathname !== "/dashboard") return;

    window.scrollTo(0, 0);
    document.documentElement.scrollTop = 0;
    document.body.scrollTop = 0;

    const sheet = document.querySelector<HTMLElement>(".dash-sheet");
    if (sheet) sheet.scrollTop = 0;
  }, [pathname]);

  return null;
}
