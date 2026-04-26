"use client"

import { useState, useMemo } from "react"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"

interface Props {
  selected: string[]
  onChange: (value: string[]) => void
}

function parseCourseCodes(text: string): string[] {
  const matches = text.toUpperCase().match(/\b[A-Z]{2,5}\s*\d{3}[A-Z]?\b/g) ?? []
  const normalized = matches.map((code) => code.replace(/\s+/, " ").trim())
  return Array.from(new Set(normalized))
}

export function WaivedCoursesStep({ selected, onChange }: Props) {
  // Keep the raw text the user types; only parse it to extract course codes.
  // If the parent already has codes (e.g. navigating back), seed the textarea.
  const [rawText, setRawText] = useState(() => selected.join(", "))

  const parsed = useMemo(() => parseCourseCodes(rawText), [rawText])
  const preview = parsed.slice(0, 24)

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const text = e.target.value
    setRawText(text)
    onChange(parseCourseCodes(text))
  }

  return (
    <div className="space-y-4">
      <p className="text-center text-sm text-muted-foreground">
        Enter any other courses you have already completed or been waived from,
        separated by commas or new lines. Use course codes like{" "}
        <span className="font-medium text-foreground">GSTR 110</span> or{" "}
        <span className="font-medium text-foreground">CSC 226</span>.
      </p>

      <Textarea
        value={rawText}
        onChange={handleChange}
        placeholder={"Examples:\nGSTR 110, GSTR 210\nCSC 226\nWELL 150"}
        className="min-h-32"
      />

      {parsed.length > 0 && (
        <div className="space-y-2">
          <p className="text-center text-sm text-muted-foreground">
            {parsed.length} course{parsed.length === 1 ? "" : "s"} recognized
          </p>
          <div className="flex flex-wrap justify-center gap-2">
            {preview.map((code) => (
              <Badge key={code} variant="secondary" className="px-3 py-1.5 text-sm">
                {code}
              </Badge>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
