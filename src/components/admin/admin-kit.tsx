"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";
import { faDigits } from "@/lib/format";
import { hapticFeedback } from "@tma.js/sdk-react";
import { useAdminLive } from "@/components/admin/admin-live";

export function relativeFa(iso: string) {
  if (!iso) return "";
  const diff = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(diff) || diff < 0) return "";
  const min = Math.round(diff / 60000);
  if (min < 1) return "همین حالا";
  if (min < 60) return `${faDigits(String(min))} دقیقه پیش`;
  const hour = Math.round(min / 60);
  if (hour < 24) return `${faDigits(String(hour))} ساعت پیش`;
  const day = Math.round(hour / 24);
  if (day < 14) return `${faDigits(String(day))} روز پیش`;
  return faDigits(
    new Intl.DateTimeFormat("fa-IR", { month: "short", day: "numeric" }).format(new Date(iso)),
  );
}

export function personMark(name: string) {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (!parts.length || parts[0] === "بدون") return "؟";
  if (parts.length === 1) return parts[0].slice(0, 1);
  return `${parts[0].slice(0, 1)}${parts[1].slice(0, 1)}`;
}

export function buzz(kind: "success" | "error" | "warning" | "light") {
  try {
    if (kind === "light") {
      if (hapticFeedback.impactOccurred.isAvailable()) hapticFeedback.impactOccurred("light");
      return;
    }
    if (hapticFeedback.notificationOccurred.isAvailable()) hapticFeedback.notificationOccurred(kind);
  } catch {
    /* optional */
  }
}

export function useCopy() {
  const { toast } = useAdminLive();
  return async (value: string, label = "کپی شد") => {
    const text = value.trim();
    if (!text) return;
    try {
      await navigator.clipboard.writeText(text);
      buzz("light");
      toast(label);
    } catch {
      toast("کپی نشد");
    }
  };
}

export function AdminAvatar({ name }: { name: string }) {
  return <span className="admin-avatar">{personMark(name)}</span>;
}

export function AdminSkeleton({ rows = 4 }: { rows?: number }) {
  return (
    <div className="admin-skel" aria-hidden="true">
      {Array.from({ length: rows }, (_, index) => (
        <span key={index} />
      ))}
    </div>
  );
}

export function CopyButton({ value, label }: { value: string; label: string }) {
  const copy = useCopy();
  return (
    <button type="button" className="admin-copy" onClick={() => void copy(value, label)}>
      کپی
    </button>
  );
}

export function ReceiptZoom({ src, children }: { src: string; children: ReactNode }) {
  const { pushOverlay } = useAdminLive();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (!open) return;
    return pushOverlay(() => setOpen(false));
  }, [open, pushOverlay]);

  return (
    <>
      <button type="button" className="admin-receipt-wrap" onClick={() => setOpen(true)}>
        {children}
        <span>برای دیدن بزرگ‌تر لمس کنید</span>
      </button>
      {open ? (
        <div className="admin-zoom" role="dialog" aria-modal="true" aria-label="فیش">
          <button type="button" className="admin-zoom-close" onClick={() => setOpen(false)}>
            بستن
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={src} alt="فیش واریزی" />
        </div>
      ) : null}
    </>
  );
}

export function ConfirmSheet({
  title,
  text,
  confirm,
  tone,
  pending,
  onCancel,
  onConfirm,
}: {
  title: string;
  text: string;
  confirm: string;
  tone: "ok" | "bad";
  pending: boolean;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  const { pushOverlay } = useAdminLive();
  const cancelRef = useRef(onCancel);
  cancelRef.current = onCancel;

  useEffect(() => pushOverlay(() => cancelRef.current()), [pushOverlay]);

  return (
    <div className="admin-sheet-root" role="presentation">
      <button type="button" className="admin-sheet-dim" aria-label="بستن" onClick={onCancel} />
      <div className="admin-sheet" role="dialog" aria-modal="true">
        <strong>{title}</strong>
        <p>{text}</p>
        <div className="admin-sheet-actions">
          <button type="button" className="is-ghost" disabled={pending} onClick={onCancel}>
            انصراف
          </button>
          <button type="button" className={tone === "ok" ? "is-ok" : "is-bad"} disabled={pending} onClick={onConfirm}>
            {pending ? "در حال ثبت…" : confirm}
          </button>
        </div>
      </div>
    </div>
  );
}
