"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { COURSE_CATALOG } from "@/lib/course-catalog"

interface Props {
  selected: string[]
  onChange: (value: string[]) => void
}

function parseCourseCodes(text: string): { valid: string[]; invalid: string[] } {
  const matches = text.toUpperCase().match(/\b[A-Z&]{2,5}\s*\d{3}[A-Z]?\b/g) ?? []
  const normalized = Array.from(
    new Set(matches.map((code) => code.replace(/\s+/, " ").trim()))
  )
  const valid: string[] = []
  const invalid: string[] = []
  for (const code of normalized) {
    if (COURSE_CATALOG[code]) valid.push(code)
    else invalid.push(code)
  }
  return { valid, invalid }
}

export function WaivedCoursesStep({ selected, onChange }: Props) {
  const [rawText, setRawText] = useState(() => selected.join(", "))

  const { valid, invalid } = useMemo(() => parseCourseCodes(rawText), [rawText])

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRawText(text)
    onChange(parseCourseCodes(text).valid)
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Enter any other courses you have already completed or been waived from,
        separated by commas or new lines. Use course codes like{" "}
        <span className="font-medium text-foreground">CHM 101</span>,{" "}
        <span className="font-medium text-foreground">BIO 101</span>, or{" "}
        <span className="font-medium text-foreground">CSC 226</span>.
      </p>

      <Textarea
        value={rawText}
        onChange={handleChange}
        placeholder={"Examples:\nCHM 101, BIO 101\nCSC 226"}
        className="min-h-32"
      />

      {valid.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            {valid.length} course{valid.length === 1 ? "" : "s"} recognized
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {valid.map((code) => (
              <Badge key={code} variant="secondary" className="px-3 py-1.5 text-sm">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}

      {invalid.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-center text-sm text-destructive">
            {invalid.length} code{invalid.length === 1 ? "" : "s"} not found in our course catalog:
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {invalid.map((code) => (
              <Badge key={code} variant="destructive" className="px-3 py-1.5 text-sm opacity-70">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
