import Link from "next/link"
import Image from "next/image"
import { BookOpen, CheckCircle2, GraduationCap, Leaf, Map, Sparkles } from "lucide-react"
import { LumenFireflies, LumenGuideBear } from "@/components/lumen-ambience"

const steps = [
  {
    num: "01",
    icon: Leaf,
    title: "Tell us about yourself",
    desc: "Share your major, goals, interests, and hobbies. Lumen learns what makes your path unique.",
  },
  {
    num: "02",
    icon: Map,
    title: "Map your roadmap",
    desc: "Get a personalized 4-year plan shaped around Berea requirements and your academic direction.",
  },
  {
    num: "03",
    icon: CheckCircle2,
    title: "Follow the light",
    desc: "Move semester by semester with a clear view of credits, courses, and next steps.",
  },
]

const features = [
  {
    tag: "Roadmap",
    title: "A full 4-year view",
    desc: "See how your courses can fit together from first year through graduation.",
  },
  {
    tag: "Berea",
    title: "Requirements-aware planning",
    desc: "Plans are built around the structure of Berea course pathways and credit needs.",
  },
  {
    tag: "Goals",
    title: "Personalized to your direction",
    desc: "Your academic interests, career goals, and activities shape the recommendations.",
  },
  {
    tag: "Progress",
    title: "A plan you can revisit",
    desc: "Use your plan as a living guide as your goals become clearer over time.",
  },
]

export default function LandingPage() {
  return (
    <main className="min-h-screen overflow-x-hidden bg-[#0d2b2b] text-[#e8f4f0]">
      <nav className="fixed left-0 right-0 top-0 z-50 flex items-center justify-between bg-gradient-to-b from-[#0d2b2b]/95 to-transparent px-6 py-5 backdrop-blur-md md:px-12">
        <Link href="/" className="flex items-center gap-2 font-serif text-2xl font-bold tracking-tight text-[#f5a623]">
          <Image
            src="/berea-bear-logo.png"
            alt="Berea bear logo"
            width={160}
            height={126}
            priority
            className="h-9 w-9 object-contain"
          />
          Lumen
        </Link>
        <div className="flex items-center gap-8">
          <a href="#how" className="hidden text-sm text-[#8bb8b0] transition-colors hover:text-[#e8f4f0] md:inline">
            How it works
          </a>
          <a href="#features" className="hidden text-sm text-[#8bb8b0] transition-colors hover:text-[#e8f4f0] md:inline">
            Features
          </a>
          <a href="#story" className="hidden text-sm text-[#8bb8b0] transition-colors hover:text-[#e8f4f0] md:inline">
            Your story
          </a>
          <Link
            href="/planner"
            className="rounded-full bg-[#f5a623] px-5 py-2 text-sm font-medium text-[#0d2b2b] shadow-[0_8px_24px_rgba(245,166,35,0.22)] transition hover:-translate-y-0.5 hover:shadow-[0_8px_24px_rgba(245,166,35,0.35)]"
          >
            Start Your Journey
          </Link>
        </div>
      </nav>

      <section className="relative flex min-h-screen items-center justify-center overflow-hidden px-6 pt-24">
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_60%_40%_at_50%_80%,rgba(245,166,35,0.12)_0%,transparent_70%),radial-gradient(ellipse_80%_50%_at_30%_110%,rgba(19,58,56,0.9)_0%,transparent_60%),radial-gradient(ellipse_80%_50%_at_70%_110%,rgba(13,43,43,0.9)_0%,transparent_60%),linear-gradient(180deg,#0d1f1f_0%,#0d2b2b_40%,#133a38_70%,#1e4a40_100%)]" />
        <div className="absolute bottom-0 left-1/2 h-[300px] w-[200px] -translate-x-1/2 bg-[radial-gradient(ellipse_100%_60%_at_50%_80%,rgba(245,166,35,0.22)_0%,transparent_70%)]" />

        <LumenFireflies className="absolute" />

        <div className="pointer-events-none absolute inset-0">
          <div className="absolute bottom-0 left-[2%] h-[75vh] w-20 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[7%] h-[55vh] w-12 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 left-[18%] h-[42vh] w-10 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[3%] h-[80vh] w-24 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[9%] h-[60vh] w-14 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
          <div className="absolute bottom-0 right-[20%] h-[38vh] w-9 bg-[#071a1a] [clip-path:polygon(50%_0%,0%_100%,100%_100%)]" />
        </div>

        <div className="lumen-fade-up relative z-10 mx-auto max-w-4xl px-2 text-center">
          <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-[#f5a623]/25 bg-[#f5a623]/12 px-4 py-1.5 text-xs font-medium uppercase tracking-[0.16em] text-[#f5a623]">
            <Sparkles className="h-4 w-4" />
            Berea College · Class Journey Planner
          </div>
          <h1 className="font-serif text-5xl font-black leading-[1.05] tracking-tight text-[#fdf6e3] sm:text-7xl lg:text-8xl">
            Plan today.
            <br />
            <em className="text-[#f5a623] drop-shadow-[0_0_40px_rgba(245,166,35,0.4)]">
              Graduate tomorrow
            </em>
          </h1>
          <p className="mx-auto mt-6 max-w-xl text-lg font-light leading-8 text-[#8bb8b0]">
            A personalized 4-year journey, crafted for every Berea College
            student. Let your guide light the way.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link
              href="/planner"
              className="rounded-full bg-[#f5a623] px-8 py-3.5 text-base font-medium text-[#0d2b2b] shadow-[0_12px_32px_rgba(245,166,35,0.24)] transition hover:-translate-y-0.5 hover:shadow-[0_12px_32px_rgba(245,166,35,0.4)]"
            >
              Start Your Journey
            </Link>
            <a
              href="#how"
              className="rounded-full border border-white/20 px-8 py-3.5 text-base text-[#e8f4f0] transition hover:border-white/35 hover:bg-white/6"
            >
              See how it works
            </a>
          </div>
          <div className="mx-auto mt-16 flex max-w-xl justify-center gap-8 border-t border-white/10 pt-8 sm:gap-12">
            <div>
              <span className="block font-serif text-4xl font-bold text-[#f5a623]">4</span>
              <span className="text-xs uppercase tracking-widest text-[#8bb8b0]">Year Roadmap</span>
            </div>
            <div>
              <span className="block font-serif text-4xl font-bold text-[#f5a623]">100%</span>
              <span className="text-xs uppercase tracking-widest text-[#8bb8b0]">Personalized</span>
            </div>
            <div>
              <span className="block font-serif text-4xl font-bold text-[#f5a623]">Free</span>
              <span className="text-xs uppercase tracking-widest text-[#8bb8b0]">For Berea</span>
            </div>
          </div>
        </div>

        <LumenGuideBear />

        <div className="lumen-float-card pointer-events-none absolute left-[14%] top-[18%] z-10 hidden rotate-[-8deg] rounded-xl border border-[#fdf6e3]/20 bg-[#fdf6e3]/12 p-3 backdrop-blur md:block">
          <BookOpen className="h-7 w-7 text-[#fdf6e3]" />
        </div>
        <div className="lumen-float-card pointer-events-none absolute right-[12%] top-[20%] z-10 hidden rotate-[8deg] rounded-xl border border-[#fdf6e3]/20 bg-[#fdf6e3]/12 p-3 backdrop-blur [animation-delay:0.3s] md:block">
          <GraduationCap className="h-7 w-7 text-[#fdf6e3]" />
        </div>
      </section>

      <section id="how" className="mx-auto max-w-6xl px-6 py-24">
        <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#f5a623]">How it works</p>
        <div className="flex flex-wrap items-end justify-between gap-6">
          <h2 className="font-serif text-4xl font-bold leading-tight tracking-tight text-[#fdf6e3] md:text-5xl">
            Four years.
            <br />
            One clear path.
          </h2>
          <p className="max-w-xl leading-7 text-[#8bb8b0]">
            Lumen maps your academic journey, from freshman orientation to
            graduation day. Every step stays illuminated.
          </p>
        </div>
        <div className="mt-14 grid gap-6 md:grid-cols-3">
          {steps.map((step) => {
            const Icon = step.icon
            return (
              <article key={step.num} className="group relative overflow-hidden rounded-[20px] border border-white/12 bg-white/6 p-7 transition hover:-translate-y-1 hover:border-[#f5a623]/30 hover:bg-white/9">
                <div className="absolute inset-0 opacity-0 transition group-hover:opacity-100 bg-[radial-gradient(circle_at_30%_20%,rgba(245,166,35,0.08)_0%,transparent_60%)]" />
                <div className="relative">
                  <div className="mb-4 font-serif text-6xl font-black leading-none text-[#f5a623]/15">{step.num}</div>
                  <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-xl border border-[#f5a623]/20 bg-[#f5a623]/12">
                    <Icon className="h-5 w-5 text-[#f5a623]" />
                  </div>
                  <h3 className="mb-2 text-base font-medium text-[#fdf6e3]">{step.title}</h3>
                  <p className="text-sm leading-6 text-[#8bb8b0]">{step.desc}</p>
                </div>
              </article>
            )
          })}
        </div>
      </section>

      <section id="features" className="bg-white/[0.02] px-6 py-24">
        <div className="mx-auto max-w-6xl">
          <p className="mb-4 text-xs font-medium uppercase tracking-[0.18em] text-[#f5a623]">Features</p>
          <h2 className="font-serif text-4xl font-bold tracking-tight text-[#fdf6e3] md:text-5xl">
            Academic planning that feels guided.
          </h2>
          <div className="mt-14 grid overflow-hidden rounded-[24px] border border-white/12 md:grid-cols-2">
            <article className="flex flex-col gap-8 border-b border-white/12 bg-[#0f3030] p-8 md:col-span-2 md:flex-row md:items-center">
              <div className="flex h-36 w-full shrink-0 items-center justify-center rounded-2xl border border-[#f5a623]/15 bg-gradient-to-br from-[#f5a623]/12 to-[#133a38]/60 text-[#f5a623] md:w-52">
                <Map className="h-16 w-16" />
              </div>
              <div>
                <span className="mb-4 inline-block rounded-full bg-[#f5a623]/12 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#f5a623]">
                  Guided
                </span>
                <h3 className="mb-3 text-xl font-medium text-[#fdf6e3]">A clear path from the first click</h3>
                <p className="leading-7 text-[#8bb8b0]">
                  Start with your goals and end with a semester-by-semester
                  plan you can actually talk through with an advisor.
                </p>
              </div>
            </article>
            {features.map((feature) => (
              <article key={feature.title} className="border-b border-white/12 bg-[#0f3030] p-8 transition hover:bg-[#153838] md:border-r odd:md:border-r">
                <span className="mb-4 inline-block rounded-full bg-[#f5a623]/12 px-3 py-1 text-xs font-medium uppercase tracking-widest text-[#f5a623]">
                  {feature.tag}
                </span>
                <h3 className="mb-3 text-lg font-medium text-[#fdf6e3]">{feature.title}</h3>
                <p className="text-sm leading-7 text-[#8bb8b0]">{feature.desc}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="story" className="mx-auto max-w-3xl px-6 py-24 text-center">
        <p className="mb-6 text-xs font-medium uppercase tracking-[0.18em] text-[#f5a623]">Your story</p>
        <blockquote className="font-serif text-3xl font-bold leading-snug tracking-tight text-[#fdf6e3] md:text-4xl">
          “A course plan should feel less like a maze and more like a lantern on the path.”
        </blockquote>
        <div className="mt-8 flex items-center justify-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-[#f5a623] to-[#e8880c] text-sm font-medium text-[#0d2b2b]">
            L
          </div>
          <div className="text-left">
            <p className="text-sm font-medium text-[#fdf6e3]">Lumen</p>
            <p className="text-xs text-[#8bb8b0]">Built for Berea students</p>
          </div>
        </div>
      </section>

      <section className="bg-[radial-gradient(ellipse_60%_80%_at_50%_50%,rgba(245,166,35,0.06)_0%,transparent_70%)] px-6 py-32 text-center">
        <h2 className="font-serif text-5xl font-black tracking-tight text-[#fdf6e3] md:text-6xl">
          Ready to <span className="text-[#f5a623]">begin?</span>
        </h2>
        <p className="mx-auto mt-5 max-w-xl text-lg text-[#8bb8b0]">
          Build your academic roadmap and let Lumen light the way.
        </p>
        <div className="mt-10 flex flex-wrap justify-center gap-4">
          <Link href="/planner" className="rounded-full bg-[#f5a623] px-8 py-3.5 font-medium text-[#0d2b2b] transition hover:-translate-y-0.5">
            Start Your Journey
          </Link>
          <Link href="/plan" className="rounded-full border border-white/20 px-8 py-3.5 text-[#e8f4f0] transition hover:bg-white/6">
            View Sample Plan
          </Link>
        </div>
      </section>

      <footer className="flex flex-col items-center justify-between gap-4 border-t border-white/6 px-6 py-8 text-center md:flex-row md:px-12 md:text-left">
        <div className="flex items-center gap-2 font-serif text-lg font-bold text-[#f5a623]">
          <Image
            src="/berea-bear-logo.png"
            alt="Berea bear logo"
            width={160}
            height={126}
            className="h-8 w-8 object-contain"
          />
          Lumen
        </div>
        <p className="text-xs text-[#8bb8b0]">Made with care for Berea College students.</p>
      </footer>
    </main>
  )
}
