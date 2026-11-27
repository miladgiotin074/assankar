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
  backButton,
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
    const bg = state.bg_color || "#f3f7fb";
    const sheet = state.secondary_bg_color || "#ffffff";
    const text = state.text_color || "#10293f";
    const muted = state.hint_color || "#4e6578";
    const accent = state.button_color || "#0c4d86";
    const accentText = state.button_text_color || "#ffffff";
    const danger = state.destructive_text_color || "#a33b3b";

    root.style.setProperty("--admin-bg", bg);
    root.style.setProperty("--admin-sheet", sheet);
    root.style.setProperty("--admin-text", text);
    root.style.setProperty("--admin-muted", muted);
    root.style.setProperty("--admin-accent", accent);
    root.style.setProperty("--admin-accent-text", accentText);
    root.style.setProperty("--admin-danger", danger);
    root.style.setProperty("--admin-ok", "#0b7a52");
    root.style.setProperty("--admin-wait", "#9a5408");
    root.style.setProperty("--admin-line", "color-mix(in srgb, var(--admin-muted) 18%, transparent)");

    try {
      if (miniApp.setHeaderColor.isAvailable()) miniApp.setHeaderColor(accent as `#${string}`);
      if (miniApp.setBgColor.isAvailable()) miniApp.setBgColor(bg as `#${string}`);
    } catch {
      /* optional */
    }
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
                  bg_color: "#f2f5f8",
                  text_color: "#10293f",
                  hint_color: "#6b7c8f",
                  link_color: "#0c4d86",
                  button_color: "#0c4d86",
                  button_text_color: "#ffffff",
                  secondary_bg_color: "#ffffff",
                  destructive_text_color: "#a33b3b",
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
          /* optional */
        }
        try {
          if (miniApp.ready.isAvailable?.()) miniApp.ready();
        } catch {
          /* optional */
        }
        try {
          themeParams.mount();
          applyTheme();
        } catch {
          /* optional */
        }
        try {
          if (backButton.isSupported()) backButton.mount();
        } catch {
          /* optional */
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
