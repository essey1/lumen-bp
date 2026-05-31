"use client";

import { useEffect, useState, useCallback, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Sparkles, LogOut, Save, User, BookOpen, Trash2, ArrowRight, PlusCircle, Loader2,
  LayoutDashboard, Settings, Search, X,
} from "lucide-react";
import { ForestNav } from "@/components/forest-nav";
import { CompletedSemestersStep, type CompletedSemesterData } from "@/components/planner/completed-semesters-step";
import { MathPlacementStep } from "@/components/planner/math-placement-step";
import { LumenFireflies } from "@/components/lumen-ambience";
import { COURSE_CATALOG } from "@/lib/course-catalog";
import type { MathPlacement } from "@/lib/types";

const MINORS_LIST = [
  "African and African American Studies",
  "Agriculture and Natural Resources",
  "Appalachian Studies",
  "Art History",
  "Art: Studio",
  "Asian Studies",
  "Biology",
  "Business Journalism",
  "Child and Family Studies",
  "Coaching and Civic Engagement",
  "Communication Studies",
  "Computer Science",
  "Creative Writing",
  "Dance",
  "Digital Media",
  "Economics",
  "English",
  "Environmental Science",
  "Film Studies",
  "French",
  "Geology",
  "German",
  "Health Studies",
  "History",
  "Labor and Employment Studies",
  "Latin American and Latino Studies",
  "Mathematics",
  "Music",
  "Peace and Social Justice Studies",
  "Philosophy",
  "Physics",
  "Political Science",
  "Psychology",
  "Religion and Spirituality",
  "Sociology",
  "Spanish",
  "Sustainability Studies",
  "Theatre",
  "Women's, Gender, and Sexuality Studies",
].sort((a, b) => a.localeCompare(b));

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
  { value: 1, label: "1st Year (Freshman)" },
  { value: 2, label: "2nd Year (Sophomore)" },
  { value: 3, label: "3rd Year (Junior)" },
  { value: 4, label: "4th Year (Senior)" },
];

type Profile = {
  name: string;
  email: string;
  major: string | null;
  minor: string | null;
  year: number | null;
  bio: string | null;
  completedSemesters: string | null;
  mathPlacement: string | null;
  waivedCourses: string | null;
};

const ALL_CATALOG = Object.values(COURSE_CATALOG).sort((a, b) => a.code.localeCompare(b.code));

function WaivedCoursesField({ selected, onChange }: { selected: string[]; onChange: (v: string[]) => void }) {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false);
        setQuery("");
      }
    }
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const filtered = useMemo(() => {
    const q = query.toLowerCase();
    const base = q
      ? ALL_CATALOG.filter(c => c.code.toLowerCase().includes(q) || c.name.toLowerCase().includes(q))
      : ALL_CATALOG.slice(0, 30);
    return base.filter(c => !selected.includes(c.code)).slice(0, 30);
  }, [query, selected]);

  function add(code: string) {
    onChange([...selected, code]);
    setQuery("");
    setOpen(false);
    setTimeout(() => inputRef.current?.focus(), 0);
  }

  return (
    <div className="space-y-3">
      <div ref={containerRef} className="relative">
        <Search className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
        <input
          ref={inputRef}
          type="text"
          value={query}
          placeholder="Search by code or name…"
          className="h-9 w-full rounded-md border border-input bg-background pl-8 pr-3 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          onChange={e => { setQuery(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
        />
        {open && (
          <div className="absolute left-0 right-0 top-full z-50 mt-1 max-h-48 overflow-y-auto rounded-md border border-border bg-popover text-popover-foreground shadow-lg">
            {filtered.length === 0 ? (
              <p className="px-3 py-3 text-center text-xs text-muted-foreground">No courses found.</p>
            ) : filtered.map(c => (
              <button
                key={c.code}
                type="button"
                onMouseDown={e => { e.preventDefault(); add(c.code); }}
                className="flex w-full items-baseline gap-2 px-3 py-2 text-left hover:bg-muted transition-colors"
              >
                <span className="w-20 shrink-0 font-mono text-xs font-semibold">{c.code}</span>
                <span className="flex-1 min-w-0 truncate text-xs text-muted-foreground">{c.name}</span>
                <span className="shrink-0 text-[10px] text-muted-foreground/60">{c.credits}cr</span>
              </button>
            ))}
          </div>
        )}
      </div>
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selected.map(code => {
            const name = COURSE_CATALOG[code]?.name;
            return (
              <span key={code} className="inline-flex items-center gap-1 rounded-full border border-primary/30 bg-primary/5 px-2.5 py-1 text-xs font-medium text-primary">
                <span className="font-mono font-semibold">{code}</span>
                {name && <span className="opacity-60">— {name.length > 24 ? name.slice(0, 24) + "…" : name}</span>}
                <button type="button" onClick={() => onChange(selected.filter(c => c !== code))} className="ml-0.5 opacity-50 hover:opacity-100">
                  <X className="h-3 w-3" />
                </button>
              </span>
            );
          })}
        </div>
      )}
    </div>
  );
}

type SavedPlanSummary = {
  id: string;
  name: string;
  majors: string;
  minors: string;
  planType: string;
  createdAt: string;
  updatedAt: string;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", major: "", minor: "", year: "", bio: "" });
  const [mathPlacement, setMathPlacement] = useState<MathPlacement>("none");
  const [waivedCourses, setWaivedCourses] = useState<string[]>([]);
  const [completedCount, setCompletedCount] = useState(0);
  const [completedSemesters, setCompletedSemesters] = useState<CompletedSemesterData[]>([]);
  const [profileStatus, setProfileStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [profileError, setProfileError] = useState("");

  const [plans, setPlans] = useState<SavedPlanSummary[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => {
        if (!r.ok) throw new Error("Unauthorized");
        return r.json();
      })
      .then((data: Profile) => {
        setProfile(data);
        setForm({
          name: data.name ?? "",
          major: data.major ?? "",
          minor: data.minor ?? "",
          year: data.year?.toString() ?? "",
          bio: data.bio ?? "",
        });
        if (data.mathPlacement) setMathPlacement(data.mathPlacement as MathPlacement);
        if (data.waivedCourses) {
          try { setWaivedCourses(JSON.parse(data.waivedCourses)); } catch { /* ignore */ }
        }
        if (data.completedSemesters) {
          try {
            const parsed = JSON.parse(data.completedSemesters) as CompletedSemesterData[];
            setCompletedSemesters(Array.isArray(parsed) ? parsed : []);
            setCompletedCount(Array.isArray(parsed) ? parsed.length : 0);
          } catch {
            setCompletedSemesters([]);
            setCompletedCount(0);
          }
        } else {
          setCompletedSemesters([]);
          setCompletedCount(0);
        }
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  const loadPlans = useCallback(() => {
    setPlansLoading(true);
    fetch("/api/plans")
      .then((r) => r.json())
      .then((data) => {
        setPlans(Array.isArray(data) ? data : []);
        setPlansLoading(false);
      })
      .catch(() => setPlansLoading(false));
  }, []);

  useEffect(() => { loadPlans(); }, [loadPlans]);

  async function handleSaveProfile(e: React.FormEvent) {
    e.preventDefault();
    setProfileStatus("saving");
    setProfileError("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        major: form.major || null,
        minor: form.minor || null,
        year: form.year ? parseInt(form.year) : null,
        bio: form.bio || null,
        completedSemesters: completedSemesters.length > 0 ? completedSemesters : null,
        mathPlacement,
        waivedCourses: waivedCourses.length > 0 ? waivedCourses : null,
      }),
    });

    if (res.ok) {
      const updated: Profile = await res.json();
      setProfile(updated);
      setProfileStatus("saved");
      setTimeout(() => setProfileStatus("idle"), 2500);
    } else {
      const data = await res.json();
      setProfileError(data.error || "Failed to save changes");
      setProfileStatus("error");
    }
  }

  async function handleDeletePlan(planId: string) {
    if (confirmDeleteId !== planId) {
      setConfirmDeleteId(planId);
      return;
    }
    setDeletingId(planId);
    setConfirmDeleteId(null);
    await fetch(`/api/plans/${planId}`, { method: "DELETE" });
    setDeletingId(null);
    loadPlans();
  }

  if (!profile) {
    return (
      <div className="lumen-app-shell flex min-h-screen items-center justify-center">
        <LumenFireflies className="fixed opacity-80" />
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-t-transparent" style={{ borderColor: "rgba(245,166,35,0.3)", borderTopColor: "#f5a623" }} />
      </div>
    );
  }

  return (
    <div className="lumen-app-shell">
      <LumenFireflies className="fixed opacity-80" />
      <ForestNav />

      <main className="lumen-app-content container mx-auto max-w-3xl px-4 sm:px-6 py-8 pt-24">
        {/* User identity strip */}
        <div className="mb-6 flex items-center gap-3 sm:gap-4">
          <div className="flex h-12 w-12 sm:h-14 sm:w-14 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <User className="h-6 w-6 sm:h-7 sm:w-7 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold text-foreground leading-tight break-words">
              {profile.name || "Your Dashboard"}
            </h1>
            <p className="text-sm sm:text-base text-muted-foreground break-all">{profile.email}</p>
            {profile.major && (
              <p className="text-sm text-muted-foreground mt-0.5 break-words">
                {profile.major}
                {profile.minor ? ` · Minor: ${profile.minor}` : ""}
                {profile.year ? ` · Year ${profile.year}` : ""}
              </p>
            )}
          </div>
        </div>

        {/* Tabs: Dashboard | Settings */}
        <Tabs defaultValue="dashboard">
          <TabsList className="mb-6 w-full justify-start">
            <TabsTrigger value="dashboard" className="gap-1.5 data-[state=active]:bg-[#f5a623] data-[state=active]:text-[#071410]">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5 data-[state=active]:bg-[#f5a623] data-[state=active]:text-[#071410]">
              <Settings className="h-4 w-4" />
              Profile Settings
            </TabsTrigger>
          </TabsList>

          {/* ── Dashboard tab ── */}
          <TabsContent value="dashboard" className="space-y-6">
            {/* Quick actions */}
            <div className="flex flex-wrap gap-3">
              <Link href="/planner">
                <Button className="gap-2">
                  <PlusCircle className="h-4 w-4" />
                  Create a Plan
                </Button>
              </Link>
            </div>

          {/* Saved plans */}
            <section>
              <div className="mb-4 flex items-center justify-between flex-wrap gap-2">
                <h2 className="flex items-center gap-2 text-lg sm:text-xl font-bold text-foreground">
                  <BookOpen className="h-4 w-4 sm:h-5 sm:w-5 text-primary" />
                  <span className="break-words">My Saved Plans</span>
                  {plans.length > 0 && (
                    <span className="rounded-full bg-muted px-2.5 py-0.5 text-sm text-muted-foreground font-normal">
                      {plans.length}
                    </span>
                  )}
                </h2>
              </div>

              {plansLoading ? (
                <div className="flex items-center gap-2 py-8 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" /> Loading plans…
                </div>
              ) : plans.length === 0 ? (
                <Card className="border-dashed border-border">
                  <CardContent className="py-10 text-center">
                    <BookOpen className="mx-auto mb-3 h-10 w-10 text-muted-foreground/40" />
                    <p className="text-base font-semibold text-foreground">No saved plans yet</p>
                    <p className="mt-1 text-sm text-muted-foreground">
                      Generate a plan to get started, it saves automatically.
                    </p>
                    <Link href="/planner" className="mt-4 inline-block">
                      <Button size="sm" className="gap-1.5">
                        <PlusCircle className="h-4 w-4" />
                        Create Your First Plan
                      </Button>
                    </Link>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-3">
                  {plans.map((plan) => {
                    const majors = (() => { try { return JSON.parse(plan.majors) as string[]; } catch { return []; } })();
                    const minors = (() => { try { return JSON.parse(plan.minors) as string[]; } catch { return []; } })();
                    return (
                      <Card key={plan.id} className="border-border transition-shadow hover:shadow-md">
                        <CardContent className="py-4 sm:py-5">
                          <div className="mb-1 flex min-w-0 items-start justify-between gap-2 flex-wrap">
                            <p className="text-sm sm:text-base font-bold text-foreground leading-snug break-words">{plan.name}</p>
                            <p className="shrink-0 text-xs text-muted-foreground whitespace-nowrap">
                              {new Date(plan.updatedAt).toLocaleDateString()}
                            </p>
                          </div>
                          {(majors.length > 0 || minors.length > 0) && (
                            <p className="mb-3 sm:mb-4 text-sm text-muted-foreground break-words">
                              {majors.join(", ")}
                              {minors.length > 0 && ` · Minor: ${minors.join(", ")}`}
                            </p>
                          )}
                          <div className="flex items-center gap-2 flex-wrap">
                            <Link href={`/plan/${plan.id}`} className="flex-1 sm:flex-none min-w-[120px]">
                              <Button className="w-full gap-1.5 sm:w-auto text-sm">
                                View Plan <ArrowRight className="h-3.5 w-3.5" />
                              </Button>
                            </Link>
                            <Button
                              variant={confirmDeleteId === plan.id ? "destructive" : "ghost"}
                              onClick={() => handleDeletePlan(plan.id)}
                              disabled={deletingId === plan.id}
                              className="shrink-0 text-sm"
                            >
                              {deletingId === plan.id ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Trash2 className="h-3.5 w-3.5" />}
                              <span className="hidden sm:inline">{confirmDeleteId === plan.id ? "Confirm?" : ""}</span>
                            </Button>
                            {confirmDeleteId === plan.id && (
                              <Button variant="ghost" onClick={() => setConfirmDeleteId(null)} className="text-sm">
                                Cancel
                              </Button>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </section>
          </TabsContent>

          {/* ── Settings tab ── */}
          <TabsContent value="settings">
            <Card className="lumen-surface">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <User className="h-4 w-4" />
                  Profile Information
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSaveProfile} className="space-y-5">
                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Full Name</label>
                    <Input
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your name"
                      required
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Major</label>
                    <select
                      value={form.major}
                      onChange={(e) => setForm((f) => ({ ...f, major: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select your major</option>
                      {MAJORS.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Minor <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <select
                      value={form.minor}
                      onChange={(e) => setForm((f) => ({ ...f, minor: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">No minor / not sure yet</option>
                      {MINORS_LIST.map((m) => (
                        <option key={m} value={m}>{m}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">Year</label>
                    <select
                      value={form.year}
                      onChange={(e) => setForm((f) => ({ ...f, year: e.target.value }))}
                      className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="">Select your year</option>
                      {YEARS.map((y) => (
                        <option key={y.value} value={y.value}>{y.label}</option>
                      ))}
                    </select>
                  </div>

                  <div className="space-y-1.5">
                    <label className="text-sm font-medium text-foreground">
                      Bio <span className="text-muted-foreground font-normal">(optional)</span>
                    </label>
                    <Textarea
                      value={form.bio}
                      onChange={(e) => setForm((f) => ({ ...f, bio: e.target.value }))}
                      placeholder="Tell us a bit about yourself, your goals, or interests..."
                      rows={4}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground text-right">{form.bio.length}/500</p>
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Math Placement</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        The highest developmental or college math level you have already completed or waived.
                      </p>
                    </div>
                    <MathPlacementStep selected={mathPlacement} onChange={setMathPlacement} />
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Waived / AP Courses</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Courses you've already completed or received credit for (other than math above).
                      </p>
                    </div>
                    <WaivedCoursesField selected={waivedCourses} onChange={setWaivedCourses} />
                  </div>

                  <div className="space-y-3 rounded-lg border border-border bg-muted/20 p-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Completed Courses</h3>
                      <p className="mt-1 text-xs text-muted-foreground">
                        Add or update the courses you already took so future plans can account for them.
                      </p>
                    </div>
                    <CompletedSemestersStep
                      completedCount={completedCount}
                      onCountChange={setCompletedCount}
                      semesters={completedSemesters}
                      onSemestersChange={setCompletedSemesters}
                    />
                  </div>

                  {profileStatus === "error" && (
                    <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                      {profileError}
                    </p>
                  )}

                  <Button
                    type="submit"
                    disabled={profileStatus === "saving"}
                    className="w-full gap-2"
                    variant={profileStatus === "saved" ? "outline" : "default"}
                  >
                    <Save className="h-4 w-4" />
                    {profileStatus === "saving" ? "Saving..." : profileStatus === "saved" ? "Saved!" : "Save Changes"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}
