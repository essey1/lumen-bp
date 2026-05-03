"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"

export default function VerifyPage() {
  const [code, setCode] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")
  const [remainingAttempts, setRemainingAttempts] = useState<number | null>(null)
  const router = useRouter()

  const handleVerify = async () => {
    if (!code) {
      setError("Please enter the verification code")
      return
    }

    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        body: JSON.stringify({ code }),
        credentials: "include" // Send cookies with request
      })

      const data = await res.json()

      if (data.success) {
        // Redirect to dashboard or home
        router.push("/plan")
      } else {
        setError(data.error || "Invalid or expired code")
        
        // Extract remaining attempts from error message
        const match = data.error?.match(/(\d+) attempt/)
        if (match) {
          setRemainingAttempts(parseInt(match[1]))
        }
      }
    } catch (err) {
      setError("An error occurred. Please try again.")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleResend = async () => {
    setLoading(true)
    setError("")

    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        body: JSON.stringify({ email: document.cookie.match(/otp_email=([^;]*)/)?.[1] || "" }),
        credentials: "include"
      })

      const data = await res.json()

      if (data.success) {
        setCode("")
        setRemainingAttempts(null)
        setError("New code sent to your email")
        setTimeout(() => setError(""), 3000)
      } else {
        setError(data.error || "Failed to resend code")
      }
    } catch (err) {
      setError("Failed to resend code")
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md rounded-lg border border-gray-200 p-8 shadow-md">
        <h1 className="mb-2 text-2xl font-bold">Verify Your Identity</h1>
        <p className="mb-6 text-gray-600">
          Enter the verification code sent to your email
        </p>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Verification Code
            </label>
            <input
              type="text"
              value={code}
              onChange={(e) => setCode(e.target.value.slice(0, 6))}
              placeholder="000000"
              maxLength={6}
              className="mt-1 w-full rounded border border-gray-300 px-3 py-2 text-center text-lg font-mono tracking-widest"
              disabled={loading}
            />
          </div>

          {error && (
            <div className={`rounded p-3 text-sm ${
              error.includes("sent") 
                ? "bg-green-50 text-green-600" 
                : "bg-red-50 text-red-600"
            }`}>
              {error}
            </div>
          )}

          {remainingAttempts !== null && remainingAttempts <= 1 && (
            <div className="rounded bg-yellow-50 p-3 text-sm text-yellow-700">
              ⚠️ Last attempt remaining
            </div>
          )}

          <button
            onClick={handleVerify}
            disabled={loading}
            className="w-full rounded bg-blue-600 py-2 font-medium text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? "Verifying..." : "Verify"}
          </button>
        </div>

        <p className="mt-4 text-center text-sm text-gray-600">
          Didn't receive a code?{" "}
          <button
            onClick={handleResend}
            disabled={loading}
            className="text-blue-600 hover:underline disabled:opacity-50"
          >
            Resend
          </button>
        </p>
      </div>
    </div>
  )
}
