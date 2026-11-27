"use client";

import { useEffect, useId, useRef, useState } from "react";
import { site } from "@/lib/site";

export function SupportChat() {
  const [open, setOpen] = useState(false);
  const titleId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    dialogRef.current?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        triggerRef.current?.focus();
        return;
      }
      if (event.key !== "Tab") return;
      const dialog = dialogRef.current;
      if (!dialog) return;
      const items = [...dialog.querySelectorAll<HTMLElement>("a, button")];
      if (!items.length) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = previous;
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const close = () => {
    setOpen(false);
    triggerRef.current?.focus();
  };

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        className="support-fab"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-controls={open ? titleId : undefined}
        onPointerDown={(event) => {
          if (event.button !== 0) return;
          setOpen(true);
        }}
        onClick={() => setOpen(true)}
      >
        <TelegramIcon />
        <span>پشتیبانی</span>
        <span className="support-live" />
      </button>

      {open ? (
        <div className="support-layer" onPointerDown={close}>
          <div
            ref={dialogRef}
            id={titleId}
            className="support-dialog"
            role="dialog"
            aria-modal="true"
            aria-labelledby={`${titleId}-title`}
            tabIndex={-1}
            onPointerDown={(event) => event.stopPropagation()}
          >
            <div className="brand-bar" />
            <div className="p-5 sm:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="kicker">پشتیبانی ۲۴ ساعته</p>
                  <h2 id={`${titleId}-title`} className="mt-3 text-2xl font-extrabold">
                    ارتباط با پشتیبانی
                  </h2>
                </div>
                <button
                  type="button"
                  className="grid size-11 shrink-0 place-items-center rounded-full border border-line text-pine"
                  aria-label="بستن"
                  onClick={close}
                >
                  <CloseIcon />
                </button>
              </div>
              <p className="copy mt-4 text-muted">
                پشتیبانی آسان‌کار از راه تلگرام و به‌صورت ۲۴ ساعته در دسترس است.
              </p>
              <p className="mt-4 rounded-2xl bg-paper-deep px-4 py-3 text-end text-base font-extrabold text-pine" dir="ltr">
                @{site.telegramUser}
              </p>
              <a
                className="btn mt-5 w-full"
                href={`https://t.me/${site.telegramUser}`}
                target="_blank"
                rel="noopener noreferrer"
              >
                ارتباط با پشتیبانی
              </a>
            </div>
          </div>
        </div>
      ) : null}
    </>
  );
}

function CloseIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-5" aria-hidden="true">
      <path d="M7 7l10 10M17 7 7 17" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
    </svg>
  );
}

function TelegramIcon() {
  return (
    <svg viewBox="0 0 24 24" className="size-6" aria-hidden="true">
      <path
        d="M20.8 5.4 3.9 11.6c-.8.3-.8 1.4.1 1.7l4.2 1.4 1.6 5c.3.8 1.3 1 1.8.3l2.2-2.6 4.3 3.2c.7.5 1.6.1 1.8-.7l2.2-12.2c.2-.9-.6-1.6-1.5-1.3Z"
        fill="currentColor"
      />
      <path d="M9.2 14.2 16.8 8.4" fill="none" stroke="#0c4d86" strokeWidth="1.6" strokeLinecap="round" />
    </svg>
  );
}
