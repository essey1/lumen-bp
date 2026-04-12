import { generateText } from "ai";

export async function POST(req: Request) {
  try {
    const { careerGoals, majors, courses, interests } = await req.json();

    // Build a prompt for career advice
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

Based on their career goals, provide actionable advice in these sections:

**COURSES TO PRIORITIZE**
Which 3-4 courses from their plan are most critical for their career goals and why they should focus extra effort on these.

**SKILLS TO DEVELOP**
Key skills or topics they should focus on during their studies that will make them competitive in their target industry.

**COMPANIES TO PURSUE**
List 5-7 specific companies that align with their career goals and interests. Include a mix of:
- Large established companies in their field
- Growing mid-size companies with good entry-level programs
- Companies known for hiring liberal arts graduates
For each company, briefly note why it's a good fit.

**BEREA COLLEGE ALUMNI TO NETWORK WITH**
Suggest types of Berea College alumni the student should look for on LinkedIn who work at these companies or in their target industry. Include:
- Job titles to search for
- Departments or teams to look for
- Tips for reaching out to alumni (mention shared Berea connection, labor program experience, etc.)
- Specific advice on how Berea's work-study/labor program experience translates to their career goals

**EXPERIENCE OUTSIDE CLASSROOM**
One concrete suggestion for gaining relevant experience (internships, projects, research, labor position alignment, etc.)

Keep the tone encouraging and practical. Be specific to Berea College's unique work-study culture and their career goals.`;

    const result = await generateText({
      model: "anthropic/claude-sonnet-4",
      prompt,
    });

    return Response.json({ advice: result.text });
  } catch (error) {
    console.error("[v0] Career advice API error:", error);
    console.error("[v0] Error details:", JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return Response.json(
      { error: "Failed to generate career advice", details: error instanceof Error ? error.message : String(error) },
      { status: 500 }
    );
  }
}
