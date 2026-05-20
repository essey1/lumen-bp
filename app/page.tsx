import Link from "next/link"
import { Leaf, Map, CheckCircle2 } from "lucide-react"
import { LumenFireflies, LumenGuideBear } from "@/components/lumen-ambience"

/* ── tiny inline bear SVG (same design as the guide bear, used in nav) ── */
function BearMark({ size = 28 }: { size?: number }) {
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

const steps = [
  { num: "01", icon: Leaf,         title: "Tell us who you are"   },
  { num: "02", icon: Map,          title: "Map your semesters"    },
  { num: "03", icon: CheckCircle2, title: "Follow the light"      },
]

const features = [
  { tag: "Roadmap",  title: "Full 4-year view"             },
  { tag: "Berea",    title: "Requirements-aware"           },
  { tag: "Goals",    title: "Shaped by your direction"     },
  { tag: "Progress", title: "Revisit as you grow"          },
]

export default function LandingPage() {
  return (
    <main
      className="min-h-screen overflow-x-hidden bg-[#071410] text-[#e2ede8]"
      style={{ fontFamily: "var(--font-lora), Georgia, serif" }}
    >

      {/* ── Nav ──────────────────────────────────────────────────────────── */}
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between px-6 py-4 backdrop-blur-sm md:px-10"
           style={{ background: "linear-gradient(to bottom, rgba(7,20,16,0.92) 0%, transparent 100%)" }}>

        <Link href="/" className="flex items-center gap-2.5" style={{ color: "#f5a623" }}>
          <BearMark size={26} />
          <span className="text-lg font-bold tracking-wide" style={{ fontFamily: "var(--font-cinzel)" }}>
            Lumen
          </span>
        </Link>

        <div className="flex items-center gap-3">
          <Link href="/auth/login"
            className="rounded-full border border-white/20 px-4 py-1.5 text-sm text-[#c8e0d8] transition hover:border-white/40 hover:text-white">
            Sign In
          </Link>
          <Link href="/auth/signup"
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-[#071410] transition hover:-translate-y-0.5"
            style={{ background: "#f5a623", boxShadow: "0 6px 20px rgba(245,166,35,0.28)" }}>
            Sign Up
          </Link>
        </div>
      </nav>

      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-16">

        {/* Sky-to-earth gradient */}
        <div className="absolute inset-0"
          style={{ background: "linear-gradient(180deg, #050e0b 0%, #071410 25%, #0b1f18 55%, #0f2a1f 80%, #122e22 100%)" }} />

        {/* Moon glow top */}
        <div className="absolute right-[18%] top-[8%] h-24 w-24 rounded-full opacity-30"
          style={{ background: "radial-gradient(circle, #fffde0 0%, rgba(245,220,100,0.3) 50%, transparent 70%)", filter: "blur(2px)" }} />
        <div className="absolute right-[18%] top-[8%] h-14 w-14 translate-x-5 translate-y-5 rounded-full bg-[#fffbea] opacity-15" style={{ filter: "blur(1px)" }} />

        {/* Ground lantern glow */}
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{ width: 360, height: 260, background: "radial-gradient(ellipse 100% 55% at 50% 85%, rgba(245,166,35,0.20) 0%, transparent 70%)" }} />

        {/* Fireflies */}
        <LumenFireflies className="absolute" />

        {/* ── Dense forest silhouettes ── */}
        <div className="pointer-events-none absolute inset-0 overflow-hidden">
          {/* Far-back layer (tallest, slightly lighter dark) */}
          <div className="absolute bottom-0 left-[-2%] h-[90vh] w-[70px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[4%]  h-[72vh] w-[52px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[9%]  h-[84vh] w-[60px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[0%]  h-[88vh] w-[66px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[5%]  h-[70vh] w-[50px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[11%] h-[80vh] w-[58px] bg-[#040d0a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />

          {/* Mid layer */}
          <div className="absolute bottom-0 left-[14%] h-[52vh] w-[44px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[20%] h-[38vh] w-[34px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[26%] h-[46vh] w-[40px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[17%] h-[48vh] w-[42px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[23%] h-[34vh] w-[30px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[29%] h-[42vh] w-[36px] bg-[#060e0b] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />

          {/* Front layer (darkest) */}
          <div className="absolute bottom-0 left-[0%]   h-[26vh] w-[60px]  bg-[#030808] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[30%]  h-[22vh] w-[40px]  bg-[#030808] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[30%] h-[24vh] w-[44px]  bg-[#030808] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[0%]  h-[28vh] w-[62px]  bg-[#030808] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />

          {/* Ground fog strip */}
          <div className="absolute bottom-0 left-0 right-0 h-[12vh]"
            style={{ background: "linear-gradient(to top, rgba(11,31,24,0.85) 0%, transparent 100%)" }} />
        </div>

        {/* Hero text */}
        <div className="lumen-fade-up relative z-10 mx-auto max-w-3xl px-2 text-center">

          <h1 className="leading-[1.06] tracking-tight text-[#f0ede0]"
            style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(2.6rem, 7vw, 5.2rem)", fontWeight: 900 }}>
            Let the light
            <br />
            <em className="not-italic" style={{ color: "#f5a623", textShadow: "0 0 60px rgba(245,166,35,0.4)" }}>
              guide your path.
            </em>
          </h1>

          <p className="mx-auto mt-6 max-w-md text-base leading-7"
            style={{ color: "#7aada0", fontStyle: "italic" }}>
            Your personalized 4-year academic roadmap,<br />
            built for Berea College.
          </p>

          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/auth/signup"
              className="rounded-full px-8 py-3.5 text-sm font-bold tracking-wide transition hover:-translate-y-0.5"
              style={{
                background: "#f5a623",
                color: "#071410",
                fontFamily: "var(--font-cinzel)",
                boxShadow: "0 12px 32px rgba(245,166,35,0.28)",
              }}>
              Begin Your Journey
            </Link>
            <a href="#how"
              className="rounded-full border border-white/20 px-8 py-3.5 text-sm text-[#c8e0d8] transition hover:border-white/40 hover:bg-white/5">
              How it works
            </a>
          </div>
        </div>

        {/* Fixed bear guide — stays on screen while scrolling */}
        <LumenGuideBear fixed={true} />
      </section>

      {/* ── How it works ─────────────────────────────────────────────────── */}
      <section id="how" className="mx-auto max-w-5xl px-6 py-28">
        <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em]"
          style={{ color: "#f5a623", fontFamily: "var(--font-cinzel)" }}>
          The path
        </p>
        <h2 className="mb-14 text-3xl font-bold tracking-tight text-[#f0ede0] md:text-4xl"
          style={{ fontFamily: "var(--font-cinzel)" }}>
          Three steps through the forest.
        </h2>

        <div className="grid gap-5 sm:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.num}
                className="group relative overflow-hidden rounded-2xl border border-white/8 p-7 transition duration-300 hover:-translate-y-1 hover:border-[#f5a623]/25"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100"
                  style={{ background: "radial-gradient(circle at 30% 20%, rgba(245,166,35,0.06) 0%, transparent 65%)" }} />
                <div className="relative">
                  <p className="mb-5 select-none text-5xl font-black leading-none"
                    style={{ fontFamily: "var(--font-cinzel)", color: "rgba(245,166,35,0.12)" }}>
                    {step.num}
                  </p>
                  <div className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl border"
                    style={{ borderColor: "rgba(245,166,35,0.2)", background: "rgba(245,166,35,0.08)" }}>
                    <Icon className="h-4 w-4" style={{ color: "#f5a623" }} />
                  </div>
                  <h3 className="text-sm font-semibold text-[#e2ede8]"
                    style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.04em" }}>
                    {step.title}
                  </h3>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      {/* ── Features ─────────────────────────────────────────────────────── */}
      <section id="features" className="px-6 py-24"
        style={{ background: "rgba(255,255,255,0.015)" }}>
        <div className="mx-auto max-w-5xl">
          <p className="mb-3 text-[11px] font-bold uppercase tracking-[0.22em]"
            style={{ color: "#f5a623", fontFamily: "var(--font-cinzel)" }}>
            What Lumen offers
          </p>
          <h2 className="mb-14 text-3xl font-bold tracking-tight text-[#f0ede0] md:text-4xl"
            style={{ fontFamily: "var(--font-cinzel)" }}>
            Every tree, every trail — mapped.
          </h2>

          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f) => (
              <article key={f.title}
                className="rounded-2xl border border-white/8 p-6 transition hover:-translate-y-1 hover:border-[#f5a623]/20"
                style={{ background: "rgba(255,255,255,0.03)" }}>
                <span className="mb-3 inline-block rounded-full px-3 py-0.5 text-[10px] font-bold uppercase tracking-widest"
                  style={{ background: "rgba(245,166,35,0.10)", color: "#f5a623", fontFamily: "var(--font-cinzel)" }}>
                  {f.tag}
                </span>
                <h3 className="text-sm font-semibold text-[#e2ede8]"
                  style={{ fontFamily: "var(--font-cinzel)", letterSpacing: "0.03em" }}>
                  {f.title}
                </h3>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden px-6 py-36 text-center">
        <div className="absolute inset-0"
          style={{ background: "radial-gradient(ellipse 60% 70% at 50% 50%, rgba(245,166,35,0.06) 0%, transparent 70%)" }} />
        <LumenFireflies className="absolute opacity-50" />
        <div className="relative z-10">
          <h2 className="font-black tracking-tight text-[#f0ede0]"
            style={{ fontFamily: "var(--font-cinzel)", fontSize: "clamp(2rem, 5vw, 3.5rem)" }}>
            Ready to{" "}
            <span style={{ color: "#f5a623", textShadow: "0 0 40px rgba(245,166,35,0.35)" }}>begin?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-sm text-[#7aada0]" style={{ fontStyle: "italic" }}>
            Your guide is already waiting in the forest.
          </p>
          <div className="mt-10 flex flex-wrap justify-center gap-4">
            <Link href="/auth/signup"
              className="rounded-full px-8 py-3.5 text-sm font-bold tracking-wide transition hover:-translate-y-0.5"
              style={{
                background: "#f5a623",
                color: "#071410",
                fontFamily: "var(--font-cinzel)",
                boxShadow: "0 12px 32px rgba(245,166,35,0.26)",
              }}>
              Get Started — Free
            </Link>
            <Link href="/auth/login"
              className="rounded-full border border-white/20 px-8 py-3.5 text-sm text-[#c8e0d8] transition hover:bg-white/6">
              Sign In
            </Link>
          </div>
        </div>
      </section>

      {/* ── Footer ───────────────────────────────────────────────────────── */}
      <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/6 px-6 py-8 text-center md:flex-row md:px-12 md:text-left">
        <div className="flex items-center gap-2" style={{ color: "#f5a623" }}>
          <BearMark size={22} />
          <span className="text-base font-bold" style={{ fontFamily: "var(--font-cinzel)" }}>Lumen</span>
        </div>
        <p className="text-xs" style={{ color: "#4a7a72" }}>Made with care for Berea College students.</p>
        <div className="flex gap-5 text-xs" style={{ color: "#4a7a72" }}>
          <Link href="/planner" className="transition hover:text-[#e2ede8]">Plan</Link>
          <Link href="/auth/login" className="transition hover:text-[#e2ede8]">Sign In</Link>
          <Link href="/auth/signup" className="transition hover:text-[#e2ede8]">Sign Up</Link>
        </div>
      </footer>

    </main>
  )
}
