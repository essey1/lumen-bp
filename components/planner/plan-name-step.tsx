"use client"

import { Sparkles } from "lucide-react"

interface Props {
  value: string
  onChange: (v: string) => void
  majorName?: string
}

export function PlanNameStep({ value, onChange, majorName }: Props) {
  return (
    <div className="space-y-6">
      <p className="text-center text-sm" style={{ color: "#7aada0" }}>
        Give your academic plan a name you&apos;ll recognise — you can always rename it later.
      </p>

      <div className="space-y-2">
        <label
          htmlFor="plan-name"
          className="block text-xs font-semibold uppercase tracking-[0.12em]"
          style={{ color: "#7aada0" }}
        >
          Plan Name
        </label>
        <input
          id="plan-name"
          type="text"
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder={majorName ? `e.g. "${majorName} — 4-Year Path"` : "e.g. My Academic Journey"}
          maxLength={80}
          autoFocus
          className="w-full rounded-xl px-4 py-3 text-sm outline-none transition"
          style={{
            background: "rgba(255,255,255,0.06)",
            border: "1px solid rgba(245,166,35,0.35)",
            color: "#f0ede0",
          }}
          onFocus={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.65)")}
          onBlur={e => (e.currentTarget.style.borderColor = "rgba(245,166,35,0.35)")}
        />
        <p className="text-right text-[11px]" style={{ color: "#4a7a72" }}>
          {value.length}/80
        </p>
      </div>

      {/* Encouragement card */}
      <div className="rounded-xl p-5 text-center"
        style={{ background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.15)" }}>
        <Sparkles className="mx-auto mb-3 h-6 w-6" style={{ color: "#f5a623" }} />
        <p className="text-sm font-medium" style={{ color: "#f0ede0" }}>
          Almost there! Hit &ldquo;Generate Plan&rdquo; and we&apos;ll chart your entire four-year
          journey in seconds.
        </p>
        <p className="mt-1 text-xs italic" style={{ color: "#7aada0" }}>
          Your plan saves automatically — no extra step needed.
        </p>
      </div>
    </div>
  )
}
