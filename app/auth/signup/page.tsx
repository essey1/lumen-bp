"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { ChevronRight, ChevronLeft, Check } from "lucide-react";
import { CompletedSemestersStep, type CompletedSemesterData } from "@/components/planner/completed-semesters-step";
import { MathPlacementStep } from "@/components/planner/math-placement-step";
import { WaivedCoursesStep } from "@/components/planner/waived-courses-step";
import { ForestNav } from "@/components/forest-nav";
import type { MathPlacement } from "@/lib/types";

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
].sort((a, b) => a.localeCompare(b));

const YEARS = [
  { value: "1", label: "1st Year (Freshman)" },
  { value: "2", label: "2nd Year (Sophomore)" },
  { value: "3", label: "3rd Year (Junior)" },
  { value: "4", label: "4th Year (Senior)" },
];

// ── 9-step signup ────────────────────────────────────────────────────────────
const TOTAL_STEPS = 9;

const STEP_TITLES = [
  "Welcome to Lumen",       // 1
  "Your Major",             // 2
  "Academic Year",          // 3
  "Your Progress",          // 4
  "Math Placement",         // 5
  "Waived Courses",         // 6
  "Your Interests",         // 7
  "Create Password",        // 8
  "Verify Your Email",      // 9
];

const STEP_SUBTITLES = [
  "Let's start with your name and email",
  "What are you studying at Berea College?",
  "What year are you currently in?",
  "Tell us about semesters you've already completed",
  "Up to what level of developmental math have you waived?",
  "Add any courses you have already been waived from",
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
  const [completedCount, setCompletedCount] = useState(0);
  const [completedSemesters, setCompletedSemesters] = useState<CompletedSemesterData[]>([]);
  // Step 5 — Math placement waiver
  const [mathPlacement, setMathPlacement] = useState<MathPlacement>("none");
  // Step 6 — Other waived courses
  const [waivedCourses, setWaivedCourses] = useState<string[]>([]);
  // Step 7
  const [bio, setBio] = useState("");
  // Step 8
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  // Step 9
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
    if (step === 8) {
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

    if (step === 8) {
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
        body: JSON.stringify({
          name:              name.trim(),
          email:             email.trim().toLowerCase(),
          password,
          major:             majors.join(", "),
          year:              parseInt(year),
          bio,
          completedSemesters: completedSemesters.length > 0 ? completedSemesters : null,
          mathPlacement,
          waivedCourses:     waivedCourses.length > 0 ? waivedCourses : null,
        }),
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

      setStep(9);
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

  const inputCls = "w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm text-[#e2ede8] placeholder-[#4a7a72] outline-none transition focus:border-[#f5a623]/50 focus:bg-white/8"
  const labelCls = "mb-1.5 block text-xs font-semibold uppercase tracking-[0.12em] text-[#7aada0]"

  const isSkippable = step === 4 || step === 5 || step === 6 || step === 7;

  function skip() {
    setError("");
    if (step === 4) { setCompletedCount(0); setCompletedSemesters([]); }
    if (step === 5) { setMathPlacement("none"); }
    if (step === 6) { setWaivedCourses([]); }
    setStep(s => s + 1);
  }

  return (
    <div className="min-h-screen flex flex-col" style={{ background: "linear-gradient(180deg,#050e0b 0%,#071410 40%,#0b1f18 100%)", fontFamily: "var(--font-lora),Georgia,serif" }}>
      <ForestNav actions={
        <Link href="/auth/login" className="text-sm text-[#7aada0] transition hover:text-[#e2ede8]">
          Have an account? <span style={{ color: "#f5a623" }}>Sign in</span>
        </Link>
      } />

      {/* Progress bar */}
      <div className="fixed left-0 right-0 top-[57px] z-40 h-[3px] bg-white/5">
        <div className="h-full transition-all duration-500" style={{ width: `${(step / TOTAL_STEPS) * 100}%`, background: "#f5a623" }} />
      </div>

      <div className="flex flex-1 items-center justify-center px-4 py-12 pt-24">
        <div className="w-full max-w-md">
          {/* Step dots */}
          <div className="mb-4 flex items-center gap-1.5">
            {Array.from({ length: TOTAL_STEPS }, (_, i) => (
              <div key={i} className="h-1 flex-1 rounded-full transition-all duration-300"
                style={{ background: i + 1 <= step ? "#f5a623" : "rgba(255,255,255,0.08)" }} />
            ))}
          </div>

          <p className="mb-1 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#4a7a72]">Step {step} of {TOTAL_STEPS}</p>
          <h1 className="mb-1 text-2xl font-bold text-[#f0ede0]" style={{ fontFamily: "var(--font-cinzel)" }}>{STEP_TITLES[step - 1]}</h1>
          <p className="mb-8 text-sm italic text-[#7aada0]">{STEP_SUBTITLES[step - 1]}</p>

          {error && (
            <Alert variant="destructive" className="mb-6 border-red-500/30 bg-red-500/10 text-red-300">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {/* ── Step 1: Name & Email ── */}
          {step === 1 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Full Name</label>
                <Input type="text" value={name} onChange={e => setName(e.target.value)}
                  placeholder="Jane Doe" autoFocus onKeyDown={e => e.key === "Enter" && handleNext()}
                  className="forest-input" />
              </div>
              <div>
                <label className={labelCls}>Berea College Email <span className="normal-case font-normal text-[#4a7a72]">(@berea.edu only)</span></label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="janedoe@berea.edu" onKeyDown={e => e.key === "Enter" && handleNext()}
                  className="forest-input" />
              </div>
            </div>
          )}

          {/* ── Step 2: Major ── */}
          {step === 2 && (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className={labelCls}>Major(s)</label>
                <span className="text-xs text-[#4a7a72]">{majors.length === 0 ? "Select at least one" : `${majors.length} selected`}</span>
              </div>
              {majors.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {majors.map(m => (
                    <span key={m} className="inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium"
                      style={{ background: "rgba(245,166,35,0.15)", color: "#f5a623" }}>
                      {m}
                      <button type="button" onClick={() => setMajors(prev => prev.filter(x => x !== m))} className="ml-0.5 opacity-70 hover:opacity-100">×</button>
                    </span>
                  ))}
                </div>
              )}
              <div className="max-h-64 overflow-y-auto rounded-xl border border-white/10" style={{ background: "rgba(255,255,255,0.03)" }}>
                {MAJORS.map(m => {
                  const isSelected = majors.includes(m)
                  const blocked = !isSelected && isMajorNameBlocked(m, majors)
                  return (
                    <button key={m} type="button" disabled={blocked}
                      title={blocked ? "You already selected a major from this department" : undefined}
                      onClick={() => setMajors(prev => isSelected ? prev.filter(x => x !== m) : blocked ? prev : [...prev, m])}
                      className={`flex w-full items-center justify-between border-b border-white/6 px-4 py-2.5 text-left text-sm last:border-0 transition-colors ${isSelected ? "font-medium" : blocked ? "cursor-not-allowed opacity-30 line-through" : "hover:bg-white/5"}`}
                      style={{ color: isSelected ? "#f5a623" : "#c8e0d8" }}>
                      {m}
                      {isSelected && <Check className="ml-2 h-4 w-4 shrink-0" />}
                      {blocked && <span className="ml-2 text-[10px] text-[#4a7a72] no-underline">same dept</span>}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          {/* ── Step 3: Academic Year ── */}
          {step === 3 && (
            <div className="space-y-3">
              {YEARS.map(y => (
                <button key={y.value} type="button" onClick={() => setYear(y.value)}
                  className="flex w-full items-center justify-between rounded-xl border px-4 py-4 text-sm font-medium transition-all"
                  style={{
                    borderColor: year === y.value ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.08)",
                    background:  year === y.value ? "rgba(245,166,35,0.10)" : "rgba(255,255,255,0.03)",
                    color:       year === y.value ? "#f5a623" : "#c8e0d8",
                  }}>
                  {y.label}
                  {year === y.value && <Check className="h-4 w-4" />}
                </button>
              ))}
            </div>
          )}

          {/* ── Step 4: Completed Semesters ── */}
          {step === 4 && (
            <CompletedSemestersStep completedCount={completedCount} onCountChange={setCompletedCount}
              semesters={completedSemesters} onSemestersChange={setCompletedSemesters} />
          )}

          {/* ── Step 5: Math Placement ── */}
          {step === 5 && (
            <MathPlacementStep
              selected={mathPlacement}
              onChange={setMathPlacement}
            />
          )}

          {/* ── Step 6: Waived Courses ── */}
          {step === 6 && (
            <WaivedCoursesStep
              selected={waivedCourses}
              onChange={setWaivedCourses}
            />
          )}

          {/* ── Step 7: Interests / Bio ── */}
          {step === 7 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>About you <span className="normal-case font-normal text-[#4a7a72]">(optional)</span></label>
                <Textarea value={bio} onChange={e => setBio(e.target.value)}
                  placeholder="Share your career goals, interests, clubs you're in, or anything that helps us personalize your plan..."
                  className="min-h-[140px] resize-none rounded-xl border border-white/10 bg-white/5 text-[#e2ede8] placeholder-[#4a7a72] focus:border-[#f5a623]/40"
                  maxLength={500} autoFocus />
                <p className="mt-1.5 text-right text-xs text-[#4a7a72]">{bio.length}/500</p>
              </div>
            </div>
          )}

          {/* ── Step 8: Password ── */}
          {step === 8 && (
            <div className="space-y-4">
              <div>
                <label className={labelCls}>Password</label>
                <Input type="password" value={password} onChange={e => setPassword(e.target.value)}
                  placeholder="Create a strong password" autoFocus className="forest-input" />
              </div>
              {password.length > 0 && (
                <ul className="space-y-1.5 rounded-xl border border-white/8 bg-white/3 px-4 py-3">
                  {[
                    { label: "At least 8 characters",       ok: password.length >= 8 },
                    { label: "One uppercase letter (A–Z)",   ok: /[A-Z]/.test(password) },
                    { label: "One lowercase letter (a–z)",   ok: /[a-z]/.test(password) },
                    { label: "One number (0–9)",             ok: /[0-9]/.test(password) },
                    { label: "One special character (!@#…)", ok: /[^A-Za-z0-9]/.test(password) },
                  ].map(({ label, ok }) => (
                    <li key={label} className="flex items-center gap-2 text-xs" style={{ color: ok ? "#6fcf97" : "#4a7a72" }}>
                      <span className="flex h-4 w-4 shrink-0 items-center justify-center rounded-full text-[10px] font-bold"
                        style={{ background: ok ? "rgba(111,207,151,0.15)" : "rgba(255,255,255,0.05)", color: ok ? "#6fcf97" : "#4a7a72" }}>
                        {ok ? "✓" : "·"}
                      </span>
                      {label}
                    </li>
                  ))}
                </ul>
              )}
              <div>
                <label className={labelCls}>Confirm Password</label>
                <Input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)}
                  placeholder="Re-enter your password" onKeyDown={e => e.key === "Enter" && handleNext()}
                  className="forest-input" />
                {confirmPassword.length > 0 && password !== confirmPassword && (
                  <p className="mt-1.5 text-xs text-red-400">Passwords do not match.</p>
                )}
              </div>
            </div>
          )}

          {/* ── Step 9: OTP ── */}
          {step === 9 && (
            <div className="space-y-6">
              <div className="rounded-xl border border-white/8 bg-white/4 px-4 py-4 text-center text-sm text-[#7aada0]">
                We sent a 6-digit code to <span className="font-semibold text-[#e2ede8]">{email}</span>
              </div>
              <div>
                <label className={labelCls}>Verification Code</label>
                <Input type="text" inputMode="numeric" value={otp}
                  onChange={e => setOtp(e.target.value.replace(/\D/g,"").slice(0,6))}
                  placeholder="000000" maxLength={6}
                  className="text-center text-2xl tracking-[0.5em] font-mono forest-input"
                  autoFocus onKeyDown={e => e.key === "Enter" && verifyOtp()} />
              </div>
              <button type="button" onClick={resendOtp} disabled={loading}
                className="w-full text-center text-sm text-[#4a7a72] transition hover:text-[#e2ede8] disabled:opacity-50">
                {"Didn't"} receive it? <span style={{ color: "#f5a623" }}>Resend code</span>
              </button>
            </div>
          )}

          {/* Navigation */}
          <div className="mt-8 flex gap-3">
            {step > 1 && step < 9 && (
              <button onClick={() => { setError(""); setStep(s => s - 1); }} disabled={loading}
                className="flex items-center gap-1 rounded-xl border border-white/15 px-4 py-3 text-sm text-[#c8e0d8] transition hover:border-white/30 disabled:opacity-50">
                <ChevronLeft className="h-4 w-4" /> Back
              </button>
            )}
            {step < 9 && (
              <button onClick={handleNext} disabled={loading}
                className="flex flex-1 items-center justify-center gap-1 rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-60"
                style={{ fontFamily: "var(--font-cinzel)", background: "#f5a623", boxShadow: "0 8px 24px rgba(245,166,35,0.22)" }}>
                {loading ? "Creating account…" : step === 8 ? "Create Account" : "Continue"}
                {!loading && step < 8 && <ChevronRight className="h-4 w-4" />}
              </button>
            )}
            {step === 9 && (
              <button onClick={verifyOtp} disabled={loading || otp.length !== 6}
                className="flex-1 rounded-xl py-3 text-sm font-bold tracking-wide text-[#071410] transition hover:-translate-y-0.5 disabled:opacity-50"
                style={{ fontFamily: "var(--font-cinzel)", background: "#f5a623", boxShadow: "0 8px 24px rgba(245,166,35,0.22)" }}>
                {loading ? "Verifying…" : "Verify & Sign In"}
              </button>
            )}
          </div>

          {/* Skip links for optional steps */}
          {isSkippable && (
            <div className="mt-3 text-center">
              <button type="button" onClick={skip}
                className="text-sm text-[#4a7a72] transition hover:text-[#e2ede8]">
                Skip for now
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
