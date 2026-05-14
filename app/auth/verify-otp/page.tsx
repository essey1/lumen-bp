"use client";
import { Suspense, useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { signIn } from "next-auth/react";

function VerifyOtpForm() {
  const [otp, setOtp] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const searchParams = useSearchParams();
  const email = searchParams.get("email");

  useEffect(() => {
    if (!email) {
      router.push("/auth/login"); // Redirect if no email is provided
    }
  }, [email, router]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsLoading(true);
    setError("");

    if (!email) {
      setError("Email not found. Please go back to login.");
      setIsLoading(false);
      return;
    }

    try {
      // Step 1: Verify OTP with the Next.js API route
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid OTP. Please try again.");
      } else {
        // Step 2: OTP is valid — establish the NextAuth session
        const nextAuthSignInResult = await signIn("credentials", {
          email,
          otpVerified: true,
          token: data.userId,
          redirect: false,
        });

        if (nextAuthSignInResult?.error) {
          setError(nextAuthSignInResult.error || "Failed to establish session.");
        } else {
          router.push("/planner"); // Redirect to protected page
          router.refresh();
        }
      }
    } catch (err) {
      console.error("OTP verification error:", err);
      setError("An unexpected error occurred during OTP verification.");
    } finally {
      setIsLoading(false);
    }
  };

  if (!email) {
    return <div className="flex min-h-screen items-center justify-center">Loading...</div>;
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4">
      <div className="w-full max-w-md space-y-8 rounded-xl border bg-white p-10 shadow-lg">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">Verify your login</h2>
          <p className="mt-2 text-sm text-gray-600">A verification code has been sent to {email}</p>
        </div>
        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          {error && (
            <div className="rounded-md bg-red-50 p-4 text-sm text-red-700 border border-red-200">
              {error}
            </div>
          )}
          <div className="space-y-4">
            <div>
              <label htmlFor="otp" className="block text-sm font-medium text-gray-700">Verification Code</label>
              <input
                id="otp"
                name="otp"
                type="text"
                required
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-blue-500 focus:outline-none focus:ring-blue-500 sm:text-sm"
                maxLength={6}
              />
            </div>
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="flex w-full justify-center rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            {isLoading ? "Verifying..." : "Verify Code"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function VerifyOtpPage() {
  return (
    <Suspense fallback={<div className="flex min-h-screen items-center justify-center">Loading...</div>}>
      <VerifyOtpForm />
    </Suspense>
  );
}
