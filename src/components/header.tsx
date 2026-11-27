"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import { nav, site } from "@/lib/site";
import { Seal } from "@/components/marks";

export function Header({ hashPrefix = "" }: { hashPrefix?: string }) {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [active, setActive] = useState("");
  const panelId = useId();
  const rootRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const armRef = useRef<number | null>(null);
  const skipClick = useRef(false);
  const href = (id: string) => `${hashPrefix}#${id}`;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 6);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    if (hashPrefix) return;
    const ratios = new Map<string, number>();
    const nodes = nav
      .map((item) => document.getElementById(item.id))
      .filter((node): node is HTMLElement => Boolean(node));
    if (!nodes.length) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          ratios.set(entry.target.id, entry.isIntersecting ? entry.intersectionRatio : 0);
        }
        let best = "";
        let bestRatio = 0;
        for (const [id, ratio] of ratios) {
          if (ratio > bestRatio) {
            best = id;
            bestRatio = ratio;
          }
        }
        setActive(best);
      },
      { rootMargin: "-40% 0px -45% 0px", threshold: [0, 0.25, 0.5] },
    );

    nodes.forEach((node) => observer.observe(node));
    return () => observer.disconnect();
  }, [hashPrefix]);

  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        buttonRef.current?.focus();
      }
    };
    const release = (event: PointerEvent) => {
      if (event.pointerId === armRef.current) armRef.current = null;
    };
    const onPointer = (event: PointerEvent) => {
      if (event.pointerId === armRef.current) return;
      if (!rootRef.current?.contains(event.target as Node)) setOpen(false);
    };
    const onResize = () => {
      if (window.innerWidth >= 1024) setOpen(false);
    };
    document.addEventListener("keydown", onKey);
    document.addEventListener("pointerdown", onPointer);
    document.addEventListener("pointerup", release);
    document.addEventListener("pointercancel", release);
    window.addEventListener("resize", onResize);
    return () => {
      document.removeEventListener("keydown", onKey);
      document.removeEventListener("pointerdown", onPointer);
      document.removeEventListener("pointerup", release);
      document.removeEventListener("pointercancel", release);
      window.removeEventListener("resize", onResize);
    };
  }, [open]);

  return (
    <header className={`topbar sticky top-0 z-40 bg-white ${scrolled ? "is-stuck" : ""}`}>
      <div className="brand-bar" />
      <div className="border-b border-line/80 bg-paper">
        <div className="wrap flex items-center justify-between gap-3 py-2.5">
          <Link href="/" className="group flex shrink-0 items-center gap-3">
            <Seal className="size-11 transition-transform duration-300 group-hover:scale-105" />
            <span className="flex flex-col">
              <span className="text-[0.68rem] font-bold tracking-[0.18em] whitespace-nowrap text-wax">
                {site.latin}
              </span>
              <span className="text-lg leading-none font-extrabold whitespace-nowrap">{site.name}</span>
            </span>
          </Link>

          <nav className="hidden items-center gap-4 text-sm font-semibold xl:gap-5 lg:flex" aria-label="بخش‌ها">
            {nav.map((item) => (
              <a
                key={item.id}
                href={href(item.id)}
                className={`nav-link ${active === item.id ? "is-active" : ""}`}
                aria-current={active === item.id ? "true" : undefined}
              >
                {item.label}
              </a>
            ))}
          </nav>

          <Link className="btn hidden shrink-0 lg:inline-flex" href="/register">
            ثبت‌نام و ورود
          </Link>

          <div className="relative lg:hidden" ref={rootRef}>
            <button
              ref={buttonRef}
              type="button"
              className="btn-ghost min-h-12 min-w-12 px-4"
              aria-expanded={open}
              aria-controls={panelId}
              onPointerDown={(event) => {
                if (event.button !== 0) return;
                armRef.current = event.pointerId;
                skipClick.current = true;
                setOpen((value) => !value);
              }}
              onClick={() => {
                if (skipClick.current) {
                  skipClick.current = false;
                  return;
                }
                setOpen((value) => !value);
              }}
            >
              {open ? "بستن" : "منو"}
            </button>
            {open ? (
              <div
                id={panelId}
                className="menu-pop absolute end-0 z-50 mt-2 w-[min(18rem,calc(100vw-2rem))] rounded-3xl border border-line bg-white p-2 shadow-[0_16px_40px_rgba(12,77,134,0.14)]"
              >
                {nav.map((item) => (
                  <a
                    key={item.id}
                    href={href(item.id)}
                    className="block rounded-2xl px-3 py-3 font-semibold transition-colors hover:bg-paper-deep"
                    onClick={() => setOpen(false)}
                  >
                    {item.label}
                  </a>
                ))}
                <Link className="btn mt-1 w-full" href="/register" onClick={() => setOpen(false)}>
                  ثبت‌نام و ورود
                </Link>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </header>
  );
}
