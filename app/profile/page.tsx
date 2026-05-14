"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Sparkles, ArrowLeft, LogOut, Save, User } from "lucide-react";

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
  year: number | null;
  bio: string | null;
};

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [form, setForm] = useState({ name: "", major: "", year: "", bio: "" });
  const [status, setStatus] = useState<"idle" | "saving" | "saved" | "error">("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    fetch("/api/profile")
      .then((r) => r.json())
      .then((data: Profile) => {
        setProfile(data);
        setForm({
          name: data.name ?? "",
          major: data.major ?? "",
          year: data.year?.toString() ?? "",
          bio: data.bio ?? "",
        });
      })
      .catch(() => router.push("/auth/login"));
  }, [router]);

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    setStatus("saving");
    setErrorMsg("");

    const res = await fetch("/api/profile", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: form.name,
        major: form.major || null,
        year: form.year ? parseInt(form.year) : null,
        bio: form.bio || null,
      }),
    });

    if (res.ok) {
      const updated: Profile = await res.json();
      setProfile(updated);
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2500);
    } else {
      const data = await res.json();
      setErrorMsg(data.error || "Failed to save changes");
      setStatus("error");
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto flex items-center justify-between px-4 py-4">
          <Link href="/planner" className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-5 w-5 text-primary-foreground" />
            </div>
            <span className="text-xl font-semibold text-foreground">Lumen</span>
          </Link>
          <button
            onClick={() => signOut({ callbackUrl: "/auth/login" })}
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </button>
        </div>
      </header>

      <main className="container mx-auto max-w-2xl px-4 py-10">
        <Link
          href="/planner"
          className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Planner
        </Link>

        <div className="mb-8 flex items-center gap-4">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10">
            <User className="h-8 w-8 text-primary" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{profile.name || "Your Profile"}</h1>
            <p className="text-sm text-muted-foreground">{profile.email}</p>
          </div>
        </div>

        <Card className="border-border">
          <CardHeader>
            <CardTitle className="text-lg">Profile Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSave} className="space-y-5">
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
                    <option key={m} value={m}>
                      {m}
                    </option>
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
                    <option key={y.value} value={y.value}>
                      {y.label}
                    </option>
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

              {status === "error" && (
                <p className="rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
                  {errorMsg}
                </p>
              )}

              <Button
                type="submit"
                disabled={status === "saving"}
                className="w-full gap-2"
                variant={status === "saved" ? "outline" : "default"}
              >
                <Save className="h-4 w-4" />
                {status === "saving"
                  ? "Saving..."
                  : status === "saved"
                  ? "Saved!"
                  : "Save Changes"}
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
}
