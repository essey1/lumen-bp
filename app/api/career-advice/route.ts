import { generateText, gateway } from "ai";

export const maxDuration = 60;

// Try Haiku first — cheaper model, may have broader gateway access.
// Sonnet is listed as fallback to test if the tier issue is model-specific.
const PROVIDERS = [
  { name: "Anthropic", model: () => gateway("anthropic/claude-haiku-4.5") },
  { name: "Groq",      model: () => gateway("groq/llama-3.3-70b-versatile") },
  { name: "Gemini",    model: () => gateway("google/gemini-2.5-pro") },
];

export async function POST(req: Request) {
  try {
    const { careerGoals, majors, courses, interests } = await req.json();

    const coursesText = courses
      .map((c: { code: string; name: string }) => `${c.code}: ${c.name}`)
      .join("\n");

    const prompt = `You are an academic and career advisor at Berea College helping a student plan their career path.

The student has the following profile:
- Major(s): ${majors.join(", ")}
- Career Goal(s): ${careerGoals.join(", ")}
- Interests: ${interests.join(", ")}

Their planned courses include:
${coursesText}

Based on their career goals, provide actionable advice in these five sections. IMPORTANT FORMATTING RULES — follow exactly:
- Use **SECTION NAME** (double asterisks, all caps) on its own line to start each section
- Number list items as "1. text" on a single line, incrementing correctly (1, 2, 3...)
- Use bullet items as "- text" on a single line
- Do NOT use ## markdown headers, --- dividers, or bold sub-headers inside sections
- Do NOT add extra sections beyond the five listed below

**COURSES TO PRIORITIZE**
Which 3-4 courses from their plan are most critical for their career goals and why they should focus extra effort on these.

**SKILLS TO DEVELOP**
Key skills or topics they should focus on during their studies that will make them competitive in their target industry.

**COMPANIES TO PURSUE**
List 5-7 specific companies that align with their career goals and interests. Include a mix of large established companies, growing mid-size companies with good entry-level programs, and companies known for hiring liberal arts graduates. For each company, include the name and a brief note on why it's a good fit.

**BEREA COLLEGE ALUMNI TO NETWORK WITH**
Suggest types of Berea College alumni the student should look for on LinkedIn who work at these companies or in their target industry. Include job titles to search for, departments or teams to look for, and tips for reaching out (mention shared Berea connection, labor program experience, etc.).

**EXPERIENCE OUTSIDE CLASSROOM**
One concrete suggestion for gaining relevant experience (internships, projects, research, labor position alignment, etc.)

Keep the tone encouraging and practical. Be specific to Berea College's unique work-study culture and their career goals.`;

    const providerErrors: Record<string, string> = {};
    for (const provider of PROVIDERS) {
      try {
        const result = await generateText({ model: provider.model(), prompt });
        return Response.json({ advice: result.text, provider: provider.name, providerErrors });
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        console.warn(`[career-advice] ${provider.name} failed:`, msg);
        providerErrors[provider.name] = msg;
      }
    }

    return Response.json(
      { error: "All providers failed", providerErrors },
      { status: 500 }
    );
  } catch (error) {
    console.error("[career-advice] Unexpected error:", error);
    return Response.json(
      { error: "Failed to generate career advice", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
