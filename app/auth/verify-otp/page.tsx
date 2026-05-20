"use client"

import { Suspense, useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ForestNav } from "@/components/forest-nav"

function VerifyOtpForm() {
  const [otp, setOtp]                   = useState("")
  const [error, setError]               = useState("")
  const [loading, setLoading]           = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const router       = useRouter()
  const searchParams = useSearchParams()
  const email        = searchParams.get("email")

  useEffect(() => { if (!email) router.push("/auth/login") }, [email, router])
  useEffect(() => {
    if (resendCooldown <= 0) return
    const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(t)
  }, [resendCooldown])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    try {
      const res  = await fetch("/api/auth/verify-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: otp }) })
      const data = await res.json()
      if (!res.ok || !data.success) { setError(data.error || "Invalid code."); return }
      const result = await signIn("credentials", { email, otpVerified: true, token: data.userId, redirect: false })
      if (result?.error) { setError("Failed to sign in. Please try again."); return }
      router.push("/profile"); router.refresh()
    } catch { setError("An unexpected error occurred.") }
    finally { setLoading(false) }
  }

  const handleResend = async () => {
    if (!email || resendCooldown > 0) return
    setError("")
    try {
      const res = await fetch("/api/auth/send-otp", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email }) })
      const data = await res.json()
      if (!res.ok) setError(data.error || "Failed to resend.")
      else setResendCooldown(60)
    } catch { setError("Failed to resend code.") }
  }

  if (!email) return <div className="flex min-h-screen items-center justify-center text-[#7aada0]">Redirecting…</div>

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-center font-mono text-2xl tracking-[0.5em] text-[#e2ede8] placeholder-[#4a7a72] outline-none transition focus:border-[#f5a623]/50 focus:bg-white/8"

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#050e0b 0%,#071410 40%,#0b1f18 100%)", fontFamily: "var(--font-lora),Georgia,serif" }}>
      <ForestNav actions={
        <Link href="/auth/login" className="text-sm text-[#7aada0] transition hover:text-[#e2ede8]">
          ← Back to sign in
        </Link>
      } />

      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="w-full max-w-sm">
          <h1 className="mb-1 text-3xl font-bold text-[#f0ede0]" style={{ fontFamily: "var(--font-cinzel)" }}>
            Check your email.
          </h1>
          <p className="mb-2 text-sm italic text-[#7aada0]">We sent a 6-digit code to</p>
          <p className="mb-8 text-sm font-semibold text-[#e2ede8]">{email}</p>

          {error && (
            <Alert variant="destructive" className="mb-5 border-red-500/30 bg-red-500/10 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <input type="text" inputMode="numeric" value={otp}
              onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
              placeholder="000000" maxLength={6} required autoFocus
              className={inputCls} />
            <button type="submit" disabled={loading || otp.length !== 6}
              className="w-full rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-50"
              style={{ fontFamily: "var(--font-cinzel)", background: "#f5a623", boxShadow: "0 8px 24px rgba(245,166,35,0.24)" }}>
              {loading ? "Verifying…" : "Verify & Sign In"}
            </button>
          </form>

          <button type="button" onClick={handleResend} disabled={resendCooldown > 0}
            className="mt-5 w-full text-center text-sm text-[#4a7a72] transition hover:text-[#e2ede8] disabled:opacity-50">
            {"Didn't receive it? "}
            <span style={{ color: "#f5a623" }}>
              {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend code"}
            </span>
          </button>
        </div>
      </div>
    </div>
  )
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center" style={{ background: "#071410", color: "#7aada0" }}>Loading…</div>}>
      <VerifyOtpForm />
    </Suspense>
  )
}
