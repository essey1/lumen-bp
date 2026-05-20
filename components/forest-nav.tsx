"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { signOut, useSession } from "next-auth/react"
import { LogOut } from "lucide-react"

function BearMark({ size = 26 }: { size?: number }) {
  const h = Math.round(size * 1.54)
  return (
    <svg width={size} height={h} viewBox="0 0 130 200" fill="none" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="65" cy="145" rx="40" ry="48" fill="#5ba8c7" />
      <ellipse cx="65" cy="90"  rx="34" ry="32" fill="#5ba8c7" />
      <circle  cx="38" cy="65" r="13" fill="#5ba8c7" />
      <circle  cx="92" cy="65" r="13" fill="#5ba8c7" />
      <circle  cx="38" cy="65" r="7"  fill="#7dc1dd" />
      <circle  cx="92" cy="65" r="7"  fill="#7dc1dd" />
      <ellipse cx="65" cy="100" rx="18" ry="14" fill="#f0f8ff" opacity="0.7" />
      <circle  cx="55" cy="86" r="4" fill="#2a4a5a" />
      <circle  cx="75" cy="86" r="4" fill="#2a4a5a" />
      <ellipse cx="65" cy="104" rx="6" ry="4" fill="#2a4a5a" />
      <ellipse cx="28" cy="148" rx="13" ry="30" fill="#5ba8c7" transform="rotate(-15 28 148)" />
      <ellipse cx="102" cy="148" rx="13" ry="30" fill="#5ba8c7" transform="rotate(15 102 148)" />
      <ellipse cx="48" cy="187" rx="14" ry="12" fill="#4a95b5" />
      <ellipse cx="82" cy="187" rx="14" ry="12" fill="#4a95b5" />
      <rect x="24" y="158" width="20" height="24" rx="4" fill="#c97d1a" />
      <rect x="26" y="160" width="16" height="20" rx="3" fill="#f5a623" />
      <circle cx="34" cy="170" r="7" fill="#fff3c4" opacity="0.9" />
      <circle cx="34" cy="170" r="4" fill="#f5a623" opacity="0.6" />
    </svg>
  )
}

interface ForestNavProps {
  /** Right-side action slot — defaults to Sign In / Sign Up if omitted */
  actions?: React.ReactNode
}

export function ForestNav({ actions }: ForestNavProps) {
  const { data: session, status } = useSession()
  const pathname = usePathname()

  const defaultActions = status === "authenticated" ? (
    <div className="flex items-center gap-3">
      <span className="hidden text-sm text-[#7aada0] md:inline">
        {session?.user?.name?.split(" ")[0]}
      </span>
      <Link
        href="/profile"
        className={`rounded-full border border-white/20 px-4 py-1.5 text-sm transition hover:border-white/40 ${
          pathname.startsWith("/profile") ? "text-[#f5a623]" : "text-[#c8e0d8] hover:text-white"
        }`}
      >
        Profile
      </Link>
      <button
        onClick={() => signOut({ callbackUrl: "/" })}
        className="flex items-center gap-1.5 rounded-full border border-white/15 px-3 py-1.5 text-sm text-[#7aada0] transition hover:border-white/30 hover:text-[#c8e0d8]"
      >
        <LogOut className="h-3.5 w-3.5" />
        <span className="hidden sm:inline">Sign Out</span>
      </button>
    </div>
  ) : (
    <div className="flex items-center gap-3">
      <Link
        href="/auth/login"
        className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-[#c8e0d8] transition hover:border-white/40 hover:text-white"
      >
        Sign In
      </Link>
      <Link
        href="/auth/signup"
        className="rounded-full px-4 py-1.5 text-sm font-semibold text-[#071410] transition hover:-translate-y-0.5"
        style={{ background: "#f5a623", boxShadow: "0 6px 20px rgba(245,166,35,0.28)" }}
      >
        Sign Up
      </Link>
    </div>
  )

  return (
    <nav
      className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm md:px-10"
      style={{ background: "linear-gradient(to bottom, rgba(7,20,16,0.95) 0%, rgba(7,20,16,0.80) 100%)", borderBottom: "1px solid rgba(255,255,255,0.05)" }}
    >
      <Link href="/" className="flex items-center gap-2.5" style={{ color: "#f5a623" }}>
        <BearMark size={26} />
        <span className="text-lg font-bold tracking-wide" style={{ fontFamily: "var(--font-cinzel)" }}>
          Lumen
        </span>
      </Link>

      {actions ?? defaultActions}
    </nav>
  )
}
