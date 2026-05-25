"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signIn } from "next-auth/react"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { ForestNav } from "@/components/forest-nav"

export default function LoginPage() {
  const router = useRouter()
  const [email, setEmail]       = useState("")
  const [password, setPassword] = useState("")
  const [error, setError]       = useState("")
  const [loading, setLoading]   = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    const result = await signIn("credentials", {
      email: email.trim().toLowerCase(),
      password,
      redirect: false,
    })
    if (result?.error) {
      setError("Invalid email or password.")
      setLoading(false)
    } else {
      window.location.href = "/profile"
    }
  }

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e2ede8] placeholder-[#4a7a72] outline-none transition focus:border-[#f5a623]/50 focus:bg-white/8 focus:ring-0"
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7aada0]"

  return (
    <div className="min-h-screen" style={{ background: "linear-gradient(180deg,#050e0b 0%,#071410 40%,#0b1f18 100%)", fontFamily: "var(--font-lora),Georgia,serif" }}>
      <ForestNav actions={
        <Link href="/auth/signup" className="text-sm text-[#7aada0] transition hover:text-[#e2ede8]">
          No account? <span style={{ color: "#f5a623" }}>Sign up</span>
        </Link>
      } />

      <div className="flex min-h-screen items-center justify-center px-4 pt-20">
        <div className="w-full max-w-sm">

          <h1 className="mb-1 text-3xl font-bold text-[#f0ede0]" style={{ fontFamily: "var(--font-cinzel)" }}>
            Welcome back.
          </h1>
          <p className="mb-8 text-sm italic text-[#7aada0]">Sign in to continue your journey.</p>

          {error && (
            <Alert variant="destructive" className="mb-5 border-red-500/30 bg-red-500/10 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelCls}>Email</label>
              <input type="email" value={email} onChange={e => setEmail(e.target.value)}
                placeholder="janedoe@berea.edu" required disabled={loading} autoFocus
                className={inputCls} />
            </div>
            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <label className={labelCls} style={{ marginBottom: 0 }}>Password</label>
                <Link href="/auth/forgot-password"
                  className="text-xs transition hover:text-[#e2ede8]"
                  style={{ color: "#f5a623" }}>
                  Forgot password?
                </Link>
              </div>
              <input type="password" value={password} onChange={e => setPassword(e.target.value)}
                placeholder="••••••••" required disabled={loading}
                className={inputCls} />
            </div>
            <button type="submit" disabled={loading}
              className="mt-2 w-full rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-60"
              style={{ fontFamily: "var(--font-cinzel)", background: "#f5a623", boxShadow: "0 8px 24px rgba(245,166,35,0.24)" }}>
              {loading ? "Signing in…" : "Sign In"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-[#4a7a72]">
            No account?{" "}
            <Link href="/auth/signup" className="font-medium transition hover:text-[#e2ede8]" style={{ color: "#f5a623" }}>
              Sign up free
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}
