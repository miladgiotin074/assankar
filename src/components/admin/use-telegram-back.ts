"use client";

import { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { backButton, hapticFeedback } from "@tma.js/sdk-react";
import { useAdminLive } from "@/components/admin/admin-live";

function parentPath(pathname: string) {
  if (/^\/admin\/payments\/[^/]+$/.test(pathname)) return "/admin/payments";
  if (/^\/admin\/partners\/[^/]+$/.test(pathname)) return "/admin/partners";
  if (pathname.startsWith("/admin/") && pathname !== "/admin") return "/admin";
  return "";
}

export function useTelegramBack() {
  const pathname = usePathname();
  const router = useRouter();
  const { consumeBack } = useAdminLive();
  const backTo = parentPath(pathname);

  useEffect(() => {
    if (!backButton.isSupported()) return;

    try {
      if (!backButton.isMounted()) backButton.mount();
    } catch {
      return;
    }

    if (!backTo) {
      try {
        backButton.hide();
      } catch {
        /* optional */
      }
      return;
    }

    try {
      backButton.show();
    } catch {
      /* optional */
    }

    const off = backButton.onClick(() => {
      if (consumeBack()) return;
      try {
        if (hapticFeedback.impactOccurred.isAvailable()) {
          hapticFeedback.impactOccurred("light");
        }
      } catch {
        /* optional */
      }
      router.push(backTo);
    });

    return () => {
      off();
      try {
        backButton.hide();
      } catch {
        /* optional */
      }
    };
  }, [backTo, consumeBack, router]);
}
