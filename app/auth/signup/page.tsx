"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Sparkles, ChevronRight, ChevronLeft, Check } from "lucide-react";

// Groups of majors that share a department (only one allowed per group)
const DEPT_GROUPS = [
  ["Computer and Information Science", "Computer and Information Science: Computer Science Concentration", "Computer and Information Science: Computational Mathematics Concentration", "Computer and Information Science: Information Systems Concentration"],
  ["Asian Studies: Comparative Asia", "Asian Studies: Chinese Studies", "Asian Studies: Japanese Studies"],
  ["Chemistry (General Concentration)", "Chemistry (Biochemistry Concentration)", "Chemistry (Professional Concentration)"],
  ["Child and Family Studies: Child Development", "Child and Family Studies: Family Studies", "Child and Family Studies: Nutrition and Food Studies"],
  ["Economics", "Quantitative Economics"],
  ["Engineering Technologies and Applied Design (General)", "Engineering Technologies and Applied Design (Technology Management)"],
  ["Art: Studio", "Art: History"],
  ["Physics", "Engineering Physics"],
]

function getDeptKey(name: string): string {
  for (const group of DEPT_GROUPS) {
    if (group.includes(name)) return group[0]
  }
  return name
}

function isMajorNameBlocked(name: string, selected: string[]): boolean {
  const dept = getDeptKey(name)
  return selected.some(s => s !== name && getDeptKey(s) === dept)
}

const MAJORS = [
  "Computer and Information Science",
  "Computer and Information Science: Computer Science Concentration",
  "Computer and Information Science: Computational Mathematics Concentration",
  "Computer and Information Science: Information Systems Concentration",
  "African and African American Studies",
  "Agriculture and Natural Resources",
  "Art: Studio",
  "Art: History",
  "Asian Studies: Comparative Asia",
  "Asian Studies: Chinese Studies",
  "Asian Studies: Japanese Studies",
  "Biology",
  "Business Administration",
  "Chemistry (General Concentration)",
  "Chemistry (Biochemistry Concentration)",
  "Chemistry (Professional Concentration)",
  "Child and Family Studies: Child Development",
  "Child and Family Studies: Family Studies",
  "Child and Family Studies: Nutrition and Food Studies",
  "Communication",
  "Economics",
  "Quantitative Economics",
  "Education Studies",
  "Engineering Technologies and Applied Design (General)",
  "Engineering Technologies and Applied Design (Technology Management)",
  "Engineering Physics",
  "English",
  "Environmental Science",
  "French",
  "German",
  "Health and Human Performance",
  "Health Studies",
  "History",
  "Mathematics",
  "Music",
  "Nursing",
  "Peace and Social Justice Studies",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Sociology",
  "Spanish",
  "Studies of Religion and Spirituality",
  "Theatre",
  "Women's, Gender, and Sexuality Studies",
];

const YEARS = [
  { value: "1", label: "1st Year (Freshman)" },
  { value: "2", label: "2nd Year (Sophomore)" },
  { value: "3", label: "3rd Year (Junior)" },
  { value: "4", label: "4th Year (Senior)" },
];

const STEP_TITLES = [
  "Welcome to Lumen",
  "Your Major",
  "Academic Year",
  "Your Interests",
  "Create Password",
  "Verify Your Email",
];

const STEP_SUBTITLES = [
  "Let's start with your name and email",
  "What are you studying at Berea College?",
  "What year are you currently in?",
  "Tell us about your goals and interests",
  "Secure your Lumen account",
  "Enter the 6-digit code we sent to your email",
];

export default function SignupPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Step 1
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  // Step 2
  const [majors, setMajors] = useState<string[]>([]);
  // Step 3
  const [year, setYear] = useState("");
  // Step 4
  const [bio, setBio] = useState("");
  // Step 5
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Step 6
  const [otp, setOtp] = useState("");

  function validateStep(): string | null {
    if (step === 1) {
      if (!name.trim()) return "Please enter your full name.";
      if (!email.trim() || !email.includes("@")) return "Please enter a valid email.";
      if (!email.trim().toLowerCase().endsWith("@berea.edu")) return "Only Berea College email addresses (@berea.edu) are allowed.";
    }
    if (step === 2) {
      if (majors.length === 0) return "Please select at least one major.";
    }
    if (step === 3) {
      if (!year) return "Please select your academic year.";
    }
    if (step === 5) {
      if (password.length < 8) return "Password must be at least 8 characters.";
      if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter.";
      if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter.";
      if (!/[0-9]/.test(password)) return "Password must contain at least one number.";
      if (!/[^A-Za-z0-9]/.test(password)) return "Password must contain at least one special character.";
      if (password !== confirmPassword) return "Passwords do not match.";
    }
    return null;
  }

  async function handleNext() {
    setError("");
    const err = validateStep();
    if (err) { setError(err); return; }

    if (step === 5) {
      await createAccount();
      return;
    }

    setStep((s) => s + 1);
  }

  async function createAccount() {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: name.trim(), email: email.trim().toLowerCase(), password, major: majors.join(", "), year: parseInt(year), bio }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to create account.");
        return;
      }

      const otpRes = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });

      const otpData = await otpRes.json();

      if (!otpRes.ok) {
        setError(otpData.error || "Failed to send verification code.");
        return;
      }

      setStep(6);
    } catch {
      setError("An error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setError("");
    if (otp.length !== 6) { setError("Please enter the 6-digit code."); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/verify-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ code: otp }),
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        setError(data.error || "Invalid code. Please try again.");
        return;
      }

      const result = await signIn("credentials", {
        email: email.trim().toLowerCase(),
        otpVerified: true,
        token: data.userId,
        redirect: false,
      });

      if (result?.error) {
        setError("Failed to sign in. Please try logging in manually.");
        return;
      }

      window.location.href = "/profile";
    } catch {
      setError("An unexpected error occurred.");
    } finally {
      setLoading(false);
    }
  }

  async function resendOtp() {
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/send-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim().toLowerCase() }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.error || "Failed to resend code.");
    } catch {
      setError("Failed to resend code.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card px-4 py-4">
        <div className="container mx-auto flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Lumen</span>
          </Link>
          <Link href="/auth/login" className="text-sm text-muted-foreground hover:text-foreground">
            Already have an account? <span className="text-primary font-medium">Sign in</span>
          </Link>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-muted">
        <div
          className="h-full bg-primary transition-all duration-500"
          style={{ width: `${(step / 6) * 100}%` }}
        />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12">
        <div className="w-full max-w-md">
          {/* Step indicator */}
          <div className="mb-2 flex items-center gap-1.5">
            {Array.from({ length: 6 }, (_, i) => (
              <div
                key={i}
                className={`h-1.5 flex-1 rounded-full transition-colors duration-300 ${
                  i + 1 <= step ? "bg-primary" : "bg-muted"
                }`}
              />
            ))}
          </div>

          <p className="mb-1 text-xs text-muted-foreground">Step {step} of 6</p>
          <h1 className="mb-1 text-2xl font-bold text-foreground">{STEP_TITLES[step - 1]}</h1>
          <p className="mb-8 text-sm text-muted-foreground">{STEP_SUBTITLES[step - 1]}</p>

          {error && (
            <Alert variant="destructive" className="mb-6">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* Step 1: Name & Email */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Full Name</label>
                <Input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Jane Doe"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  Berea College Email
                  <span className="ml-1.5 text-xs font-normal text-muted-foreground">(@berea.edu only)</span>
                </label>
                <Input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="janedoe@berea.edu"
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
              </div>
            </div>
          )}

          {/* Step 2: Major (multi-select) */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-foreground">Select your major(s)</label>
                <span className="text-xs text-muted-foreground">
                  {majors.length === 0 ? "Select at least one" : `${majors.length} selected`}
                </span>
              </div>

              {/* Selected pills */}
              {majors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {majors.map((m) => (
                    <span
                      key={m}
                      className="inline-flex items-center gap-1 rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary"
                    >
                      {m}
                      <button
                        type="button"
                        onClick={() => setMajors((prev) => prev.filter((x) => x !== m))}
                        className="ml-0.5 hover:text-primary/60"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="max-h-64 overflow-y-auto rounded-lg border border-border">
                {MAJORS.map((m) => {
                  const isSelected = majors.includes(m);
                  const blocked = !isSelected && isMajorNameBlocked(m, majors);
                  return (
                    <button
                      key={m}
                      type="button"
                      disabled={blocked}
                      title={blocked ? "You already selected a major from this department" : undefined}
                      onClick={() =>
                        setMajors((prev) =>
                          isSelected ? prev.filter((x) => x !== m) : blocked ? prev : [...prev, m]
                        )
                      }
                      className={`flex w-full items-center justify-between px-4 py-2.5 text-sm text-left transition-colors border-b border-border last:border-0 ${
                        isSelected
                          ? "bg-primary/10 text-primary font-medium"
                          : blocked
                            ? "opacity-40 line-through text-muted-foreground cursor-not-allowed"
                            : "text-foreground hover:bg-muted/50"
                      }`}
                    >
                      {m}
                      {isSelected && <Check className="h-4 w-4 shrink-0 ml-2" />}
                      {blocked && <span className="text-[10px] text-muted-foreground ml-2 no-underline">same dept</span>}
                    </button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Step 3: Year */}
          {step === 3 && (
            <div className="space-y-3">
              {YEARS.map((y) => (
                <button
                  key={y.value}
                  type="button"
                  onClick={() => setYear(y.value)}
                  className={`flex w-full items-center justify-between rounded-lg border px-4 py-4 text-sm font-medium transition-all ${
                    year === y.value
                      ? "border-primary bg-primary/10 text-primary"
                      : "border-border bg-card text-foreground hover:bg-muted/50"
                  }`}
                >
                  {y.label}
                  {year === y.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {/* Step 4: Interests */}
          {step === 4 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">
                  About you <span className="text-muted-foreground font-normal">(optional)</span>
                </label>
                <Textarea
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  placeholder="Share your career goals, interests, clubs you're in, or anything that helps us personalize your plan..."
                  className="min-h-[140px] resize-none"
                  maxLength={500}
                  autoFocus
                />
                <p className="mt-1.5 text-right text-xs text-muted-foreground">{bio.length}/500</p>
              </div>
            </div>
          )}

          {/* Step 5: Password */}
          {step === 5 && (
            <div className="space-y-4">
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Password</label>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Create a strong password"
                  autoFocus
                />
              </div>

              {/* Live requirements */}
              {password.length > 0 && (
                <ul className="space-y-1.5 rounded-lg border border-border bg-muted/30 px-4 py-3">
                  {[
                    { label: "At least 8 characters",      ok: password.length >= 8 },
                    { label: "One uppercase letter (A–Z)",  ok: /[A-Z]/.test(password) },
                    { label: "One lowercase letter (a–z)",  ok: /[a-z]/.test(password) },
                    { label: "One number (0–9)",            ok: /[0-9]/.test(password) },
                    { label: "One special character (!@#…)", ok: /[^A-Za-z0-9]/.test(password) },
                  ].map(({ label, ok }) => (
                    <li key={label} className={`flex items-center gap-2 text-xs ${ok ? "text-green-600" : "text-muted-foreground"}`}>
                      <span className={`flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold ${ok ? "bg-green-100 text-green-600" : "bg-muted text-muted-foreground"}`}>
                        {ok ? "✓" : "·"}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              )}

              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Confirm Password</label>
                <Input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password"
                  onKeyDown={(e) => e.key === "Enter" && handleNext()}
                />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-destructive">Passwords do not match.</p>
                )}
              </div>
            </div>
          )}

          {/* Step 6: OTP */}
          {step === 6 && (
            <div className="space-y-6">
                      <div className="rounded-lg border border-border bg-muted/30 px-4 py-4 text-center text-sm text-muted-foreground">
                We sent a 6-digit code to <span className="font-medium text-foreground">{email}</span>
              </div>
              <div>
                <label className="mb-1.5 block text-sm font-medium text-foreground">Verification Code</label>
                <Input
                  type="text"
                  inputMode="numeric"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, "").slice(0, 6))}
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono"
                  autoFocus
                  onKeyDown={(e) => e.key === "Enter" && verifyOtp()}
                />
              </div>
              <button
                type="button"
                onClick={resendOtp}
                disabled={loading}
                className="w-full text-center text-sm text-muted-foreground hover:text-foreground disabled:opacity-50"
              >
                {"Didn't"} receive it? <span className="text-primary font-medium">Resend code</span>
              </button>
            </div>
          )}

          {/* Navigation buttons */}
          <div className="mt-8 flex gap-3">
            {step > 1 && step < 6 && (
              <Button
                variant="outline"
                onClick={() => { setError(""); setStep((s) => s - 1); }}
                disabled={loading}
                className="gap-1"
              >
                <ChevronLeft className="h-4 w-4" /> Back
              </Button>
            )}
            {step < 6 && (
              <Button
                onClick={handleNext}
                disabled={loading}
                className="flex-1 gap-1"
              >
                {loading ? "Creating account..." : step === 5 ? "Create Account" : "Continue"}
                {!loading && step < 5 && <ChevronRight className="h-4 w-4" />}
              </Button>
            )}
            {step === 6 && (
              <Button
                onClick={verifyOtp}
                disabled={loading || otp.length !== 6}
                className="flex-1"
              >
                {loading ? "Verifying..." : "Verify & Sign In"}
              </Button>
            )}
          </div>

          {/* Skip interests step */}
          {step === 4 && (
            <div className="mt-3 text-center">
              <button
                type="button"
                onClick={() => { setError(""); setStep(5); }}
                className="text-sm text-muted-foreground hover:text-foreground"
              >
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
