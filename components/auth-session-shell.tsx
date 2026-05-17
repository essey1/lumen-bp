"use client";

import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

const IDLE_TIMEOUT_MS = 15 * 60 * 1000;
const ACTIVITY_EVENTS = ["click", "keydown", "mousemove", "scroll", "touchstart"];
const LAST_ACTIVITY_KEY = "lumen:lastActivityAt";

function IdleSessionGuard({ children }: { children: ReactNode }) {
  const { status } = useSession();
  const pathname = usePathname();
  const timeoutRef = useRef<ReturnType<typeof window.setTimeout> | null>(null);
  const isAuthPage = pathname.startsWith("/auth");
  const shouldProtect = status === "authenticated" && !isAuthPage;

  useEffect(() => {
    if (!shouldProtect) return;

    const clearIdleTimer = () => {
      if (timeoutRef.current) window.clearTimeout(timeoutRef.current);
    };

    const resetIdleTimer = () => {
      clearIdleTimer();
      window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
      timeoutRef.current = window.setTimeout(() => {
        window.localStorage.removeItem(LAST_ACTIVITY_KEY);
        signOut({ callbackUrl: "/auth/login?reason=idle" });
      }, IDLE_TIMEOUT_MS);
    };

    // Always stamp activity fresh when a session starts so a stale
    // localStorage value from a previous session doesn't cause instant logout.
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()));
    resetIdleTimer();
    ACTIVITY_EVENTS.forEach((eventName) => {
      window.addEventListener(eventName, resetIdleTimer, { passive: true });
    });

    return () => {
      clearIdleTimer();
      ACTIVITY_EVENTS.forEach((eventName) => {
        window.removeEventListener(eventName, resetIdleTimer);
      });
    };
  }, [shouldProtect]);

  return (
    <>
      {shouldProtect && (
        <div className="fixed right-4 top-4 z-50">
          <LogoutButton />
        </div>
      )}
      {children}
    </>
  );
}

export function AuthSessionShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <IdleSessionGuard>{children}</IdleSessionGuard>
    </SessionProvider>
  );
}
