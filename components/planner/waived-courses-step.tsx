"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { COURSE_CATALOG } from "@/lib/course-catalog"

interface Props {
  selected: string[]
  onChange: (value: string[]) => void
}

function parseCourseCodes(text: string): { known: string[]; custom: string[] } {
  const matches = text.toUpperCase().match(/\b[A-Z&]{2,5}\s*\d{3}[A-Z]?\b/g) ?? []
  const normalized = Array.from(
    new Set(matches.map((code) => code.replace(/\s+/, " ").trim()))
  )
  const known: string[] = []
  const custom: string[] = []
  for (const code of normalized) {
    if (COURSE_CATALOG[code]) known.push(code)
    else custom.push(code)  // not in our catalog yet, but still valid input
  }
  return { known, custom }
}

export function WaivedCoursesStep({ selected, onChange }: Props) {
  const [rawText, setRawText] = useState(() => selected.join(", "))

  const { known, custom } = useMemo(() => parseCourseCodes(rawText), [rawText])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRawText(text)
    // Pass ALL recognized codes (both known and custom) to the parent.
    // Custom courses won't match catalog entries but they will still be
    // treated as waived/completed, which is the user's intent.
    const { known: k, custom: c } = parseCourseCodes(text)
    onChange([...k, ...c])
  }

  const totalCount = known.length + custom.length

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Enter any courses you have already completed or been waived from,
        separated by commas or new lines. Use course codes like{" "}
        <span className="font-medium text-foreground">CHM 101</span>,{" "}
        <span className="font-medium text-foreground">BIO 101</span>, or{" "}
        <span className="font-medium text-foreground">CSC 226</span>.
        New or unlisted courses are accepted too.
      </p>

      <Textarea
        value={rawText}
        onChange={handleChange}
        placeholder={"Examples:\nCHM 101, BIO 101\nCSC 226\nPHY 120"}
        className="min-h-32"
      />

      {totalCount > 0 && (
        <div className="space-y-3">
          {known.length > 0 && (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                {known.length} course{known.length === 1 ? "" : "s"} recognized in catalog
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {known.map((code) => (
                  <Badge key={code} variant="secondary" className="px-3 py-1.5 text-sm">
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {custom.length > 0 && (
            <div className="space-y-2">
              <p className="text-center text-sm text-muted-foreground">
                {custom.length} custom/new course{custom.length === 1 ? "" : "s"} — not yet in our catalog, but accepted
              </p>
              <div className="flex flex-wrap justify-center gap-2">
                {custom.map((code) => (
                  <Badge
                    key={code}
                    variant="outline"
                    className="px-3 py-1.5 text-sm border-dashed"
                  >
                    {code}
                  </Badge>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
