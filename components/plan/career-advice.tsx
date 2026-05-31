"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2, BookOpen, Zap, Building2, Users, Compass } from "lucide-react";

interface CareerAdviceProps {
  planId: string;
  careerGoals: string[];
  majors: string[];
  courses: { code: string; name: string }[];
  interests: string[];
}

const CACHE_KEY = (id: string) => `career-advice-${id}`;

const SECTION_META: Record<string, { Icon: React.ComponentType<{ className?: string }>, accent: string }> = {
  "COURSES TO PRIORITIZE":               { Icon: BookOpen,  accent: "#f5a623" },
  "SKILLS TO DEVELOP":                   { Icon: Zap,       accent: "#6fcf97" },
  "COMPANIES TO PURSUE":                 { Icon: Building2, accent: "#56b4e9" },
  "BEREA COLLEGE ALUMNI TO NETWORK WITH":{ Icon: Users,     accent: "#e07d60" },
  "EXPERIENCE OUTSIDE CLASSROOM":        { Icon: Compass,   accent: "#b49be8" },
};

function parseSections(raw: string): { title: string; content: string }[] {
  const sections: { title: string; content: string }[] = [];
  let title = "";
  let lines: string[] = [];
  for (const line of raw.split("\n")) {
    // Match **TITLE** or ## Title (both bold and markdown heading formats)
    const m = line.match(/^\*\*([^*]+)\*\*\s*$/) ?? line.match(/^#{1,3}\s+(.+)$/);
    if (m) {
      if (title) sections.push({ title: title.trim(), content: lines.join("\n").trim() });
      title = m[1].trim().replace(/\*\*/g, "");
      lines = [];
    } else {
      lines.push(line);
    }
  }
  if (title) sections.push({ title: title.trim(), content: lines.join("\n").trim() });
  return sections;
}

function renderInline(text: string) {
  // Handle **bold** and *italic* inline markers
  return text.split(/(\*\*[^*]+\*\*|\*[^*]+\*)/).map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**"))
      return <strong key={i} className="font-semibold text-foreground">{part.slice(2, -2)}</strong>;
    if (part.startsWith("*") && part.endsWith("*"))
      return <em key={i}>{part.slice(1, -1)}</em>;
    return <span key={i}>{part}</span>;
  });
}

// Keep backward-compatible alias
const renderBold = renderInline;

function normalizeContent(content: string): string {
  // Merge a bare number line ("1.") with the following content line
  const merged = content.replace(/^(\d+\.)\s*\n([^\n])/gm, "$1 $2");
  return merged
    // Skip --- dividers
    .replace(/^---+\s*$/gm, "")
    // Only break truly inline numbered items (space-separated, not already on new lines)
    .replace(/([.!?:,])[ \t]+(?=\d+\.\s)/g, "$1\n")
    // Only break truly inline * bullets (not ones already after a newline)
    .replace(/(?<=[^*\n])[ \t]+(?=\*\s)/g, "\n")
    .trim();
}

function SectionContent({ content }: { content: string }) {
  const lines = normalizeContent(content).split("\n").map(l => l.trim()).filter(Boolean);

  const elements: React.ReactNode[] = [];
  let listType: "ol" | "ul" | null = null;
  let listItems: string[] = [];

  const flush = () => {
    if (!listItems.length) return;
    if (listType === "ol") {
      elements.push(
        <ol key={elements.length} className="space-y-2">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
              <span className="shrink-0 font-bold text-[currentColor] opacity-50 w-4 text-right">{j + 1}.</span>
              <span>{renderBold(item)}</span>
            </li>
          ))}
        </ol>
      );
    } else {
      elements.push(
        <ul key={elements.length} className="space-y-2">
          {listItems.map((item, j) => (
            <li key={j} className="flex gap-2.5 text-sm leading-relaxed text-foreground/85">
              <span className="shrink-0 mt-1.5 h-1.5 w-1.5 rounded-full bg-current opacity-40" />
              <span>{renderBold(item)}</span>
            </li>
          ))}
        </ul>
      );
    }
    listType = null;
    listItems = [];
  };

  for (const line of lines) {
    if (/^\d+\.\s/.test(line)) {
      if (listType !== "ol") flush();
      listType = "ol";
      listItems.push(line.replace(/^\d+\.\s*/, ""));
    } else if (/^[-•*]\s/.test(line)) {
      if (listType !== "ul") flush();
      listType = "ul";
      listItems.push(line.replace(/^[-•*]\s*/, ""));
    } else {
      flush();
      elements.push(
        <p key={elements.length} className="text-sm leading-relaxed text-foreground/80">
          {renderBold(line)}
        </p>
      );
    }
  }
  flush();

  return <div className="space-y-3">{elements}</div>;
}

export function CareerAdvice({ planId, careerGoals, majors, courses, interests }: CareerAdviceProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [provider, setProvider] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async (force = false) => {
    if (!force) {
      const cached = localStorage.getItem(CACHE_KEY(planId));
      if (cached) {
        const { advice: a, provider: p } = JSON.parse(cached);
        setAdvice(a); setProvider(p);
        return;
      }
    }
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/career-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ careerGoals, majors, courses, interests }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.details || "Failed to get career advice");
      setAdvice(data.advice);
      setProvider(data.provider ?? null);
      localStorage.setItem(CACHE_KEY(planId), JSON.stringify({ advice: data.advice, provider: data.provider ?? null }));
    } catch (err) {
      setError(`Unable to generate career advice: ${err instanceof Error ? err.message : String(err)}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (careerGoals.length > 0) fetchAdvice(false);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (careerGoals.length === 0) return null;

  const sections = advice ? parseSections(advice) : [];

  return (
    <div className="mt-8">
      {/* Header */}
      <div className="mb-5 flex items-center gap-2.5">
        <Sparkles className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-semibold text-foreground">
          Career Advice — {careerGoals.join(", ")}
        </h2>
      </div>

      {loading && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-card px-6 py-8 text-muted-foreground">
          <Loader2 className="h-5 w-5 animate-spin shrink-0" />
          <span className="text-sm">Generating personalized advice based on your goals…</span>
        </div>
      )}

      {error && (
        <div className="rounded-2xl border border-destructive/30 bg-destructive/5 px-6 py-5">
          <p className="text-sm text-destructive mb-3">{error}</p>
          <Button variant="outline" size="sm" onClick={() => fetchAdvice(true)} className="gap-2">
            <RefreshCw className="h-4 w-4" /> Try Again
          </Button>
        </div>
      )}

      {advice && !loading && (
        <>
          <div className="grid gap-4 lg:grid-cols-2">
            {sections.map(({ title, content }, i) => {
              const meta = SECTION_META[title];
              const Icon = meta?.Icon ?? Sparkles;
              const accent = meta?.accent ?? "#f5a623";
              const isWide = title === "COMPANIES TO PURSUE" || title === "BEREA COLLEGE ALUMNI TO NETWORK WITH";
              return (
                <div
                  key={i}
                  className={`rounded-2xl border border-border bg-card p-5 ${isWide ? "lg:col-span-2" : ""}`}
                >
                  <div className="mb-3.5 flex items-center gap-2.5">
                    <span
                      className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg"
                      style={{ background: `${accent}18` }}
                    >
                      <Icon className="h-3.5 w-3.5" style={{ color: accent }} />
                    </span>
                    <h3 className="text-sm font-semibold tracking-wide uppercase" style={{ color: accent }}>
                      {title}
                    </h3>
                  </div>
                  <SectionContent content={content} />
                </div>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-between">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => fetchAdvice(true)}
              className="gap-2 text-muted-foreground hover:text-foreground"
            >
              <RefreshCw className="h-4 w-4" /> Regenerate Advice
            </Button>
            {provider && (
              <span className="text-xs text-muted-foreground/50">Generated by {provider}</span>
            )}
          </div>
        </>
      )}
    </div>
  );
}
