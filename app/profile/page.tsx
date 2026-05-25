"use client";

import { useEffect, useState, useCallback } from "react";
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
  LayoutDashboard, Settings,
} from "lucide-react";
import { ForestNav } from "@/components/forest-nav";
import { CompletedSemestersStep, type CompletedSemesterData } from "@/components/planner/completed-semesters-step";
import { LumenFireflies } from "@/components/lumen-ambience";

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
];

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
};

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
    <div className="lumen-app-shell" style={{ fontFamily: "var(--font-lora),Georgia,serif" }}>
      <LumenFireflies className="fixed opacity-80" />
      <ForestNav />

      <main className="lumen-app-content container mx-auto max-w-3xl px-4 py-8 pt-24">
        {/* User identity strip */}
        <div className="mb-6 flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 shrink-0">
            <User className="h-7 w-7 text-primary" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground leading-tight">
              {profile.name || "Your Dashboard"}
            </h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
            {profile.major && (
              <p className="text-xs text-muted-foreground mt-0.5">
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
            <TabsTrigger value="dashboard" className="gap-1.5">
              <LayoutDashboard className="h-4 w-4" />
              Dashboard
            </TabsTrigger>
            <TabsTrigger value="settings" className="gap-1.5">
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
              <div className="mb-4 flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-base font-semibold text-foreground">
                  <BookOpen className="h-4 w-4 text-primary" />
                  My Saved Plans
                  {plans.length > 0 && (
                    <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground font-normal">
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
                    <p className="text-sm font-medium text-foreground">No saved plans yet</p>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Generate a plan and click &quot;Save Plan&quot; to keep it here.
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
                      <Card key={plan.id} className="border-border hover:shadow-sm transition-shadow">
                        <CardContent className="py-4">
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
                            <div className="min-w-0">
                              <p className="font-semibold text-foreground truncate">{plan.name}</p>
                              <p className="mt-0.5 text-xs text-muted-foreground truncate">
                                Plan {plan.planType}
                                {majors.length > 0 && ` · ${majors[0]}`}
                                {minors.length > 0 && ` · Minor: ${minors[0]}`}
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Updated {new Date(plan.updatedAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <Link href={`/plan/${plan.id}`} className="flex-1 sm:flex-none">
                                <Button size="sm" className="w-full gap-1.5 sm:w-auto">
                                  View <ArrowRight className="h-3.5 w-3.5" />
                                </Button>
                              </Link>
                              <Button
                                size="sm"
                                variant={confirmDeleteId === plan.id ? "destructive" : "ghost"}
                                onClick={() => handleDeletePlan(plan.id)}
                                disabled={deletingId === plan.id}
                                className="gap-1 shrink-0"
                              >
                                {deletingId === plan.id ? (
                                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                ) : (
                                  <Trash2 className="h-3.5 w-3.5" />
                                )}
                                {confirmDeleteId === plan.id ? "Confirm?" : ""}
                              </Button>
                              {confirmDeleteId === plan.id && (
                                <Button
                                  size="sm"
                                  variant="ghost"
                                  onClick={() => setConfirmDeleteId(null)}
                                  className="shrink-0 text-xs"
                                >
                                  Cancel
                                </Button>
                              )}
                            </div>
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
