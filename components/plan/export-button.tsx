"use client"

import { Button } from "@/components/ui/button"
import { Download } from "lucide-react"

export function ExportButton() {
  return (
    <Button size="sm" className="gap-2" onClick={() => window.print()}>
      <Download className="h-4 w-4" />
      Export PDF
    </Button>
  )
}
