"use client"

import { Suspense, useState, useEffect } from "react"
import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { KeyRound, ArrowLeft, CheckCircle2, Eye, EyeOff } from "lucide-react"
import { ForestNav } from "@/components/forest-nav"

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e2ede8] placeholder-[#4a7a72] outline-none transition focus:border-[#f5a623]/50 focus:bg-white/8"
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7aada0]"

function ResetPasswordForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const emailParam = searchParams.get("email") ?? ""

  const [email, setEmail] = useState(emailParam)
  const [code, setCode] = useState("")
  const [password, setPassword] = useState("")
  const [confirm, setConfirm] = useState("")
  const [showPass, setShowPass] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [done, setDone] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(emailParam ? 60 : 0)

  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    setError("")
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      if (!res.ok) {
        const data = await res.json()
        setError(data.error ?? "Failed to resend code")
      } else {
        setResendCooldown(60)
      }
    } catch {
      setError("Network error. Please try again.")
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")

    if (code.length !== 6) {
      setError("Please enter the full 6-digit code.")
      return
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters.")
      return
    }
    if (password !== confirm) {
      setError("Passwords don't match.")
      return
    }

    setLoading(true)
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          code: code.trim(),
          password,
        }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      setDone(true)
      setTimeout(() => router.push("/auth/login"), 3000)
    } catch {
      setError("Network error. Please check your connection and try again.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div
      className="min-h-screen"
      style={{
        background: "linear-gradient(180deg,#050e0b 0%,#071410 40%,#0b1f18 100%)",
        fontFamily: "var(--font-lora),Georgia,serif",
      }}
    >
      <ForestNav
        actions={
          <Link
            href="/auth/login"
            className="flex items-center gap-1.5 text-sm text-[#7aada0] transition hover:text-[#e2ede8]"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            Back to sign in
          </Link>
        }
      />

      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="w-full max-w-sm">
          {done ? (
            /* Success state */
            <div className="text-center">
              <div
                className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full"
                style={{ background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.3)" }}
              >
                <CheckCircle2 className="h-8 w-8" style={{ color: "#f5a623" }} />
              </div>
              <h1
                className="mb-2 text-2xl font-bold text-[#f0ede0]"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                Password reset!
              </h1>
              <p className="text-sm text-[#7aada0]">
                Your password has been updated. Taking you to sign in…
              </p>
            </div>
          ) : (
            <>
              <div
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(245,166,35,0.10)", border: "1px solid rgba(245,166,35,0.25)" }}
              >
                <KeyRound className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>

              <h1
                className="mb-1 text-center text-3xl font-bold text-[#f0ede0]"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                Reset password.
              </h1>
              <p className="mb-2 text-center text-sm italic text-[#7aada0]">
                Enter the code we sent and your new password.
              </p>
              <p className="mb-8 text-center text-xs" style={{ color: "#f5a623" }}>
                {"Don't see it? Check your"} <strong>Junk</strong> {" or "} <strong>Spam</strong> {" folder."}
              </p>

              {error && (
                <div
                  className="mb-5 rounded-xl border px-4 py-3 text-sm"
                  style={{ borderColor: "rgba(239,68,68,0.3)", background: "rgba(239,68,68,0.08)", color: "#fca5a5" }}
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* Email (editable in case they arrived directly) */}
                {!emailParam && (
                  <div>
                    <label className={labelCls}>Email address</label>
                    <input
                      type="email"
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="janedoe@berea.edu"
                      required
                      disabled={loading}
                      className={inputCls}
                    />
                  </div>
                )}

                {/* 6-digit code */}
                <div>
                  <label className={labelCls}>6-digit reset code</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    value={code}
                    onChange={e => setCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
                    placeholder="000000"
                    maxLength={6}
                    required
                    autoFocus
                    className={`${inputCls} text-center font-mono text-2xl tracking-[0.5em]`}
                  />
                </div>

                {/* New password */}
                <div>
                  <label className={labelCls}>New password</label>
                  <div className="relative">
                    <input
                      type={showPass ? "text" : "password"}
                      value={password}
                      onChange={e => setPassword(e.target.value)}
                      placeholder="At least 8 characters"
                      required
                      disabled={loading}
                      className={`${inputCls} pr-11`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPass(v => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a7a72] transition hover:text-[#7aada0]"
                    >
                      {showPass ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {/* Confirm password */}
                <div>
                  <label className={labelCls}>Confirm new password</label>
                  <input
                    type={showPass ? "text" : "password"}
                    value={confirm}
                    onChange={e => setConfirm(e.target.value)}
                    placeholder="Re-enter password"
                    required
                    disabled={loading}
                    className={inputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || code.length !== 6 || !password || !confirm}
                  className="w-full rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    background: "#f5a623",
                    boxShadow: "0 8px 24px rgba(245,166,35,0.24)",
                  }}
                >
                  {loading ? "Resetting…" : "Reset Password"}
                </button>
              </form>

              <button
                type="button"
                onClick={handleResend}
                disabled={resendCooldown > 0 || !email.trim()}
                className="mt-5 w-full text-center text-sm text-[#4a7a72] transition hover:text-[#e2ede8] disabled:opacity-50"
              >
                Didn&apos;t get the code?{" "}
                <span style={{ color: "#f5a623" }}>
                  {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
                </span>
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense
      fallback={
        <div
          className="flex min-h-screen items-center justify-center"
          style={{ background: "#071410", color: "#7aada0" }}
        >
          Loading…
        </div>
      }
    >
      <ResetPasswordForm />
    </Suspense>
  )
}
