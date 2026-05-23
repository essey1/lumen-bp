"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { BookmarkPlus, Check, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { SemesterPlan } from "@/lib/types";

interface SavePlanButtonProps {
  majors: string[];
  minors: string[];
  interests: string[];
  careerGoals: string[];
  mathPlacement: string;
  waivedCourses: string[];
  planType: string;
  semesters: SemesterPlan[];
}

export function SavePlanButton({
  majors, minors, interests, careerGoals, mathPlacement, waivedCourses, planType, semesters,
}: SavePlanButtonProps) {
  const router = useRouter();
  // Start in "naming" so the user sees the name field immediately — no extra click required.
  const [status, setStatus] = useState<"naming" | "saving" | "saved">("naming");
  const [planName, setPlanName] = useState(`Plan ${planType} – ${majors[0] ?? "Custom"}`);
  const [error, setError] = useState("");

  async function handleSave() {
    setStatus("saving");
    setError("");

    try {
      const res = await fetch("/api/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: planName.trim() || `Plan ${planType}`,
          majors,
          minors,
          interests,
          careerGoals,
          mathPlacement,
          waivedCourses,
          planType,
          semesters,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        setError(data.error || "Failed to save plan");
        setStatus("naming");
        return;
      }

      const { id } = await res.json();
      setStatus("saved");
      setTimeout(() => router.push(`/plan/${id}`), 800);
    } catch {
      setError("Something went wrong. Please try again.");
      setStatus("naming");
    }
  }

  if (status === "saved") {
    return (
      <Button variant="outline" size="sm" className="gap-2 text-green-600 border-green-300" disabled>
        <Check className="h-4 w-4" />
        Saved! Redirecting…
      </Button>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 w-full max-w-sm">
      <p className="text-xs text-center" style={{ color: "rgba(255,255,255,0.5)" }}>
        Give this plan a name, then save it to your profile.
      </p>
      <div className="flex items-center gap-2 w-full">
        <input
          type="text"
          value={planName}
          onChange={(e) => setPlanName(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSave()}
          className="flex-1 rounded-md border border-input bg-background px-3 py-1.5 text-sm shadow-sm focus:outline-none focus:ring-2 focus:ring-ring"
          placeholder="Name this plan…"
          autoFocus={false}
          disabled={status === "saving"}
        />
        <Button size="sm" onClick={handleSave} disabled={status === "saving"} className="gap-1.5 shrink-0">
          {status === "saving" ? <Loader2 className="h-4 w-4 animate-spin" /> : <BookmarkPlus className="h-4 w-4" />}
          {status === "saving" ? "Saving…" : "Save Plan"}
        </Button>
      </div>
      {error && <span className="text-xs text-destructive">{error}</span>}
    </div>
  );
}
