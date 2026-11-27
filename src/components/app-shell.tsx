import type { ReactNode } from "react";
import Link from "next/link";

export function AppShell({
  title,
  backHref,
  end,
  variant = "plain",
  titleAs = "p",
  children,
}: {
  title: string;
  backHref?: string;
  end?: ReactNode;
  variant?: "plain" | "home" | "form";
  titleAs?: "p" | "h1";
  children: ReactNode;
}) {
  const home = variant === "home";
  const Title = titleAs === "h1" ? "h1" : "p";

  return (
    <div className="app-stage">
      <div className={home ? "app-device is-home" : variant === "form" ? "app-device is-form" : "app-device"}>
        <header className={home ? "app-bar is-home" : "app-bar"}>
          {home ? (
            <p className="app-brand">
              <span className="app-brand-mark" aria-hidden="true" />
              آسان‌کار
            </p>
          ) : (
            <span className="app-icon" aria-hidden="true" />
          )}
          {home ? null : <Title className="app-title">{title}</Title>}
          {backHref ? (
            <Link href={backHref} className="app-icon app-back" aria-label="بازگشت">
              <BackIcon />
            </Link>
          ) : (
            <div className={home ? "app-end" : "app-icon"}>{end}</div>
          )}
        </header>
        <main className="app-main">{children}</main>
      </div>
    </div>
  );
}

function BackIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path
        d="M14 6.5 8 12l6 5.5"
        fill="none"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
