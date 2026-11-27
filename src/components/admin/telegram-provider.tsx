"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import {
  init,
  isTMA,
  mockTelegramEnv,
  retrieveRawInitData,
  themeParams,
  viewport,
  miniApp,
} from "@tma.js/sdk-react";

type AdminUser = { tgId: number; name: string; username: string };

type AdminTelegramContextValue = {
  ready: boolean;
  insideTelegram: boolean;
  error: string;
  admin: AdminUser | null;
  refreshSession: () => Promise<void>;
};

const AdminTelegramContext = createContext<AdminTelegramContextValue>({
  ready: false,
  insideTelegram: false,
  error: "",
  admin: null,
  refreshSession: async () => undefined,
});

export function useAdminTelegram() {
  return useContext(AdminTelegramContext);
}

function applyTheme() {
  try {
    const state = themeParams.state();
    const root = document.documentElement;
    if (state.bg_color) root.style.setProperty("--admin-bg", state.bg_color);
    if (state.secondary_bg_color) root.style.setProperty("--admin-sheet", state.secondary_bg_color);
    if (state.text_color) root.style.setProperty("--admin-text", state.text_color);
    if (state.hint_color) root.style.setProperty("--admin-muted", state.hint_color);
    if (state.button_color) root.style.setProperty("--admin-accent", state.button_color);
    if (state.button_text_color) root.style.setProperty("--admin-accent-text", state.button_text_color);
    if (state.destructive_text_color) root.style.setProperty("--admin-danger", state.destructive_text_color);
  } catch {
    /* theme optional */
  }
}

export function AdminTelegramProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [insideTelegram, setInsideTelegram] = useState(false);
  const [error, setError] = useState("");
  const [admin, setAdmin] = useState<AdminUser | null>(null);

  const refreshSession = useCallback(async () => {
    let initData = "";
    try {
      initData = retrieveRawInitData() || "";
    } catch {
      initData = "";
    }
    if (!initData) {
      setError("داده ورود تلگرام پیدا نشد.");
      setAdmin(null);
      return;
    }

    const response = await fetch("/api/admin/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ initData }),
      credentials: "same-origin",
    });
    const data = (await response.json().catch(() => null)) as
      | { ok?: boolean; error?: string; admin?: AdminUser }
      | null;
    if (!response.ok || !data?.admin) {
      setError(data?.error || "ورود ادمین انجام نشد.");
      setAdmin(null);
      return;
    }
    setError("");
    setAdmin(data.admin);
  }, []);

  useEffect(() => {
    let cancelled = false;

    async function boot() {
      try {
        const tmaCheck = isTMA();
        const inTelegram = typeof tmaCheck === "boolean" ? tmaCheck : await tmaCheck;
        if (!inTelegram) {
          if (process.env.NODE_ENV !== "production") {
            const initData = new URLSearchParams({
              user: JSON.stringify({
                id: Number(process.env.NEXT_PUBLIC_ADMIN_MOCK_ID || "1"),
                first_name: "Admin",
                username: "admin",
              }),
              auth_date: String(Math.floor(Date.now() / 1000)),
              hash: "dev",
              signature: "dev",
            }).toString();
            mockTelegramEnv({
              launchParams: {
                tgWebAppPlatform: "web",
                tgWebAppVersion: "8.0",
                tgWebAppThemeParams: {
                  bg_color: "#f3f7fb",
                  text_color: "#10293f",
                  hint_color: "#4e6578",
                  link_color: "#0c4d86",
                  button_color: "#0c4d86",
                  button_text_color: "#ffffff",
                  secondary_bg_color: "#ffffff",
                },
                tgWebAppData: initData,
              },
            });
          } else if (!cancelled) {
            setInsideTelegram(false);
            setReady(true);
            setError("این پنل فقط داخل تلگرام باز می‌شود.");
            return;
          }
        }

        init();
        try {
          if (viewport.mount.isAvailable?.()) {
            await viewport.mount();
            if (viewport.expand.isAvailable?.()) viewport.expand();
          }
        } catch {
          /* viewport optional */
        }
        try {
          if (miniApp.ready.isAvailable?.()) miniApp.ready();
        } catch {
          /* ready optional */
        }
        try {
          if (themeParams.mount.isAvailable?.()) themeParams.mount();
          else themeParams.mount();
          applyTheme();
        } catch {
          /* theme optional */
        }

        if (cancelled) return;
        setInsideTelegram(true);
        await refreshSession();
        if (!cancelled) setReady(true);
      } catch (bootError) {
        if (cancelled) return;
        setReady(true);
        setInsideTelegram(false);
        setError(bootError instanceof Error ? bootError.message : "راه‌اندازی مینی‌اپ ناموفق بود.");
      }
    }

    void boot();
    return () => {
      cancelled = true;
    };
  }, [refreshSession]);

  const value = useMemo(
    () => ({ ready, insideTelegram, error, admin, refreshSession }),
    [ready, insideTelegram, error, admin, refreshSession],
  );

  return <AdminTelegramContext.Provider value={value}>{children}</AdminTelegramContext.Provider>;
}
