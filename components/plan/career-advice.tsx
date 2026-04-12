"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Sparkles, RefreshCw, Loader2 } from "lucide-react";

interface CareerAdviceProps {
  careerGoals: string[];
  majors: string[];
  courses: { code: string; name: string }[];
  interests: string[];
}

export function CareerAdvice({
  careerGoals,
  majors,
  courses,
  interests,
}: CareerAdviceProps) {
  const [advice, setAdvice] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAdvice = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/career-advice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          careerGoals,
          majors,
          courses,
          interests,
        }),
      });

      const data = await response.json();
      
      if (!response.ok) {
        console.error("[v0] API Error:", data);
        throw new Error(data.details || "Failed to get career advice");
      }

      setAdvice(data.advice);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Unknown error";
      setError(`Unable to generate career advice: ${errorMessage}`);
      console.error("[v0] Career advice fetch error:", err);
    } finally {
      setLoading(false);
    }
  };

  // Auto-fetch on mount
  useEffect(() => {
    if (careerGoals.length > 0) {
      fetchAdvice();
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  if (careerGoals.length === 0) {
    return null;
  }

  return (
    <Card className="mt-8 border-primary/20 bg-gradient-to-br from-card to-primary/5">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-lg">
          <Sparkles className="h-5 w-5 text-primary" />
          Career Advice for {careerGoals.join(", ")}
        </CardTitle>
      </CardHeader>
      <CardContent>
        {loading && (
          <div className="flex items-center gap-3 py-6 text-muted-foreground">
            <Loader2 className="h-5 w-5 animate-spin" />
            <span>Generating personalized advice based on your goals...</span>
          </div>
        )}

        {error && (
          <div className="py-4">
            <p className="text-destructive mb-3">{error}</p>
            <Button
              variant="outline"
              size="sm"
              onClick={fetchAdvice}
              className="gap-2"
            >
              <RefreshCw className="h-4 w-4" />
              Try Again
            </Button>
          </div>
        )}

        {advice && !loading && (
          <div className="space-y-4">
            <div className="prose prose-sm max-w-none text-foreground">
              {advice.split("\n\n").map((paragraph, idx) => (
                <p key={idx} className="text-sm leading-relaxed">
                  {paragraph}
                </p>
              ))}
            </div>
            <div className="pt-2 border-t border-border">
              <Button
                variant="ghost"
                size="sm"
                onClick={fetchAdvice}
                className="gap-2 text-muted-foreground hover:text-foreground"
              >
                <RefreshCw className="h-4 w-4" />
                Regenerate Advice
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
