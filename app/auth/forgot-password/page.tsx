"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { Mail, ArrowLeft, Send, CheckCircle2 } from "lucide-react"
import { ForestNav } from "@/components/forest-nav"

const inputCls =
  "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e2ede8] placeholder-[#4a7a72] outline-none transition focus:border-[#f5a623]/50 focus:bg-white/8"
const labelCls =
  "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7aada0]"

export default function ForgotPasswordPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [sent, setSent] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError("")
    setLoading(true)

    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      })
      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? "Something went wrong. Please try again.")
        return
      }

      setSent(true)
      // Redirect to reset page after a moment
      setTimeout(() => {
        router.push(`/auth/reset-password?email=${encodeURIComponent(email.trim().toLowerCase())}`)
      }, 2000)
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
          {sent ? (
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
                Check your inbox.
              </h1>
              <p className="text-sm text-[#7aada0]">
                If <span className="font-medium text-[#e2ede8]">{email}</span> is registered,
                we&apos;ve sent a 6-digit reset code. Redirecting you now…
              </p>
            </div>
          ) : (
            /* Email form */
            <>
              <div
                className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full"
                style={{ background: "rgba(245,166,35,0.10)", border: "1px solid rgba(245,166,35,0.25)" }}
              >
                <Mail className="h-6 w-6" style={{ color: "#f5a623" }} />
              </div>

              <h1
                className="mb-1 text-center text-3xl font-bold text-[#f0ede0]"
                style={{ fontFamily: "var(--font-cinzel)" }}
              >
                Forgot password?
              </h1>
              <p className="mb-8 text-center text-sm italic text-[#7aada0]">
                Enter your email and we&apos;ll send you a reset code.
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
                <div>
                  <label className={labelCls}>Email address</label>
                  <input
                    type="email"
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="janedoe@berea.edu"
                    required
                    disabled={loading}
                    autoFocus
                    className={inputCls}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading || !email.trim()}
                  className="flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-60"
                  style={{
                    fontFamily: "var(--font-cinzel)",
                    background: "#f5a623",
                    boxShadow: "0 8px 24px rgba(245,166,35,0.24)",
                  }}
                >
                  {loading ? (
                    "Sending…"
                  ) : (
                    <>
                      <Send className="h-4 w-4" />
                      Send Reset Code
                    </>
                  )}
                </button>
              </form>

              <p className="mt-6 text-center text-sm text-[#4a7a72]">
                Remember it?{" "}
                <Link
                  href="/auth/login"
                  className="font-medium transition hover:text-[#e2ede8]"
                  style={{ color: "#f5a623" }}
                >
                  Sign in
                </Link>
              </p>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
