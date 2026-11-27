"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

type LiveValue = {
  pending: number;
  tick: number;
  refresh: () => void;
  toast: (message: string) => void;
  pushOverlay: (close: () => void) => () => void;
  consumeBack: () => boolean;
};

const AdminLiveContext = createContext<LiveValue>({
  pending: 0,
  tick: 0,
  refresh: () => undefined,
  toast: () => undefined,
  pushOverlay: () => () => undefined,
  consumeBack: () => false,
});

export function useAdminLive() {
  return useContext(AdminLiveContext);
}

export function AdminLiveProvider({ children }: { children: ReactNode }) {
  const [pending, setPending] = useState(0);
  const [tick, setTick] = useState(0);
  const [message, setMessage] = useState("");
  const overlays = useRef<Array<() => void>>([]);
  const toastTimer = useRef(0);

  const refresh = useCallback(() => setTick((value) => value + 1), []);

  const toast = useCallback((text: string) => {
    setMessage(text);
    window.clearTimeout(toastTimer.current);
    toastTimer.current = window.setTimeout(() => setMessage(""), 1600);
  }, []);

  const pushOverlay = useCallback((close: () => void) => {
    overlays.current.push(close);
    return () => {
      overlays.current = overlays.current.filter((item) => item !== close);
    };
  }, []);

  const consumeBack = useCallback(() => {
    const close = overlays.current.pop();
    if (!close) return false;
    close();
    return true;
  }, []);

  useEffect(() => {
    let alive = true;
    fetch("/api/admin/stats", { credentials: "same-origin" })
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok || !alive) return;
        setPending(Number(data.pendingPayments) || 0);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [tick]);

  useEffect(() => {
    const onShow = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onShow);
    return () => document.removeEventListener("visibilitychange", onShow);
  }, [refresh]);

  const value = useMemo(
    () => ({ pending, tick, refresh, toast, pushOverlay, consumeBack }),
    [pending, tick, refresh, toast, pushOverlay, consumeBack],
  );

  return (
    <AdminLiveContext.Provider value={value}>
      {children}
      {message ? <div className="admin-toast">{message}</div> : null}
    </AdminLiveContext.Provider>
  );
}
