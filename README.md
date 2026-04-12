# Lumen
> An AI-powered 4-year academic planner built for Berea College students.

**Topic: Solve a Campus Problem**

---

## The Problem Statement

Planning four years of college at Berea is genuinely difficult. Students must satisfy GEM requirements (Ways of Knowing, Richnesses, the Learning & Inquiry sequence), fulfill major prerequisites in the right order, stay within Berea's 4-credit-per-semester structure, and keep their career goals in mind — all at the same time. Most students do this manually with a spreadsheet or rely on sporadic advisor check-ins. Mistakes are easy to make and costly to fix.

---

## The Solution

Lumen generates a complete, constraint-satisfying 8-semester course plan in under a minute, then layers on personalized AI career advice.

**User journey:**
1. A student opens the planner and completes a 4-step form: major(s), academic interests, hobbies, and career goals.
2. Lumen runs a constraint-based scheduling algorithm and produces a full 4-year plan with real courses, GEM categories, and prerequisites correctly ordered.
3. The plan page shows each semester's courses grouped by year, with a stats summary (total credits, GEM coverage, etc.).
4. An AI career advisor (powered by Claude) analyzes the plan and provides specific advice: which courses to prioritize, skills to develop, companies to target, Berea alumni to find on LinkedIn, and concrete ways to gain experience.

---

## Tech Stack

- **Frontend:** Next.js 16 (App Router), React 19, TypeScript, Tailwind CSS
- **Components:** shadcn/ui, Radix UI, Lucide React
- **AI:** Vercel AI SDK, Anthropic Claude Sonnet 4
- **Hosting:** Vercel, Vercel Analytics
- **Tooling:** pnpm, v0 (AI-assisted UI scaffolding)

---

## Challenges We Ran Into

The scheduling algorithm was the hardest part. Satisfying all constraints simultaneously — prerequisite chains that span multiple years, GEM category coverage, credit limits per semester, major course caps, and the L&I 100 to 400 sequence gated by class year — required carefully ordering each placement pass. If prerequisites were resolved in the wrong order, the whole plan would break. We also had to build fallback placeholder logic for cases where a specific course could not be scheduled in a valid slot. Getting the output to feel intentional rather than just technically valid took many iterations.

The AI integration also required encoding Berea-specific institutional context directly into the system prompt — the labor program, the GEM framework, the alumni network — to produce advice that was actually useful rather than generic.

---

## Accomplishments We're Proud Of

- The scheduler reliably produces valid 4-year plans across multiple major combinations without any manual tuning.
- The AI career advice feels specific to Berea students because the prompt is built around Berea's actual culture, programs, and community.
- The full flow from onboarding to a complete plan with career guidance takes under a minute.

---

## Try It

**Live app:** [https://v0-lumen-berea.vercel.app/](https://v0-lumen-berea.vercel.app/)

No installation needed. Open the link and get started.

---

## The Team

| Name | Role |
|------|------|
| [Name] | [Role] |
| [Name] | [Role] |

