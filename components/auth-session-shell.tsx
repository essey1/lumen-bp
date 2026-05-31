"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import type { ReactNode } from "react";
import { SessionProvider, signOut, useSession } from "next-auth/react";
import { usePathname } from "next/navigation";
import { LogoutButton } from "@/components/logout-button";

// ── Timing constants ──────────────────────────────────────────────────────────
const IDLE_TIMEOUT_MS    = 90 * 60 * 1000   // 90 min total idle
const WARNING_BEFORE_MS  = 5  * 60 * 1000   // show warning 5 min before signout
const ACTIVITY_EVENTS    = ["click", "keydown", "mousemove", "scroll", "touchstart"] as const
const LAST_ACTIVITY_KEY  = "lumen:lastActivityAt"

// ── Warning modal ─────────────────────────────────────────────────────────────
function IdleWarningModal({ secondsLeft, onStay }: { secondsLeft: number; onStay: () => void }) {
  const mins = Math.floor(secondsLeft / 60)
  const secs = secondsLeft % 60
  const label = mins > 0
    ? `${mins}m ${String(secs).padStart(2, "0")}s`
    : `${secs}s`

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4"
      style={{ background: "rgba(0,0,0,0.72)", backdropFilter: "blur(6px)" }}
    >
      <div
        className="w-full max-w-sm rounded-2xl p-6 text-center shadow-2xl"
        style={{ background: "#0d1f18", border: "1px solid rgba(245,166,35,0.30)" }}
      >
        <div
          className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full text-2xl"
          style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.25)" }}
        >
          ⏱
        </div>
        <h2
          className="mb-1 text-lg font-bold text-[#f0ede0]"
          style={{ fontFamily: "var(--font-cinzel)" }}
        >
          Still here?
        </h2>
        <p className="mb-1 text-sm text-[#7aada0]">
          You&apos;ve been inactive for a while.
        </p>
        <p className="mb-6 text-sm text-[#7aada0]">
          You&apos;ll be signed out in{" "}
          <span className="font-semibold tabular-nums" style={{ color: "#f5a623" }}>
            {label}
          </span>
          .
        </p>
        <button
          onClick={onStay}
          className="w-full rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5"
          style={{
            fontFamily: "var(--font-cinzel)",
            background: "#f5a623",
            boxShadow: "0 8px 24px rgba(245,166,35,0.24)",
          }}
        >
          I&apos;m still here
        </button>
        <button
          onClick={() => signOut({ callbackUrl: "/auth/login" })}
          className="mt-3 w-full rounded-xl py-2.5 text-sm text-[#7aada0] transition hover:text-[#e2ede8]"
        >
          Sign out now
        </button>
      </div>
    </div>
  )
}

// ── Idle session guard ────────────────────────────────────────────────────────
function IdleSessionGuard({ children }: { children: ReactNode }) {
  const { status } = useSession()
  const pathname = usePathname()

  const isAuthPage    = pathname.startsWith("/auth")
  const hasOwnNav     = pathname.startsWith("/plan") || pathname.startsWith("/profile") || pathname.startsWith("/planner")
  const shouldProtect = status === "authenticated" && !isAuthPage

  const timeoutRef       = useRef<number | null>(null)
  const warningTimerRef  = useRef<number | null>(null)

  const [showWarning, setShowWarning]   = useState(false)
  const [secondsLeft, setSecondsLeft]   = useState(WARNING_BEFORE_MS / 1000)

  // Clear both timers
  const clearAllTimers = useCallback(() => {
    if (timeoutRef.current != null)      window.clearTimeout(timeoutRef.current)
    if (warningTimerRef.current != null) window.clearInterval(warningTimerRef.current)
    timeoutRef.current      = null
    warningTimerRef.current = null
  }, [])

  // Reset the idle clock — called on any user activity or "I'm still here"
  const resetIdleTimer = useCallback(() => {
    clearAllTimers()
    setShowWarning(false)
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))

    // Schedule warning
    timeoutRef.current = window.setTimeout(() => {
      // Start warning countdown
      setSecondsLeft(WARNING_BEFORE_MS / 1000)
      setShowWarning(true)

      warningTimerRef.current = window.setInterval(() => {
        setSecondsLeft(prev => {
          if (prev <= 1) {
            if (warningTimerRef.current != null) window.clearInterval(warningTimerRef.current)
            warningTimerRef.current = null
            window.localStorage.removeItem(LAST_ACTIVITY_KEY)
            signOut({ callbackUrl: "/auth/login?reason=idle" })
            return 0
          }
          return prev - 1
        })
      }, 1000)
    }, IDLE_TIMEOUT_MS - WARNING_BEFORE_MS)
  }, [clearAllTimers])

  useEffect(() => {
    if (!shouldProtect) return

    // Stamp fresh activity so a stale value doesn't cause instant logout
    window.localStorage.setItem(LAST_ACTIVITY_KEY, String(Date.now()))
    resetIdleTimer()

    const handleActivity = () => {
      if (!showWarning) resetIdleTimer()
    }

    ACTIVITY_EVENTS.forEach(ev => window.addEventListener(ev, handleActivity, { passive: true }))
    return () => {
      clearAllTimers()
      ACTIVITY_EVENTS.forEach(ev => window.removeEventListener(ev, handleActivity))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shouldProtect])

  const handleStay = () => {
    resetIdleTimer()
  }

  return (
    <>
      {shouldProtect && !hasOwnNav && (
        <div className="fixed right-4 top-4 z-50">
          <LogoutButton />
        </div>
      )}
      {shouldProtect && showWarning && (
        <IdleWarningModal secondsLeft={secondsLeft} onStay={handleStay} />
      )}
      {children}
    </>
  )
}

// ── Shell ─────────────────────────────────────────────────────────────────────
export function AuthSessionShell({ children }: { children: ReactNode }) {
  return (
    <SessionProvider>
      <IdleSessionGuard>{children}</IdleSessionGuard>
    </SessionProvider>
  )
}
