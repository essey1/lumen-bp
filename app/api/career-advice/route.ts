import { generateText } from "ai";
import { google } from "@ai-sdk/google";

export async function POST(req: Request) {
  try {
    const { careerGoals, majors, courses, interests } = await req.json();

    // Build a prompt for career advice
    const coursesText = courses
      .map((c: { code: string; name: string }) => `${c.code}: ${c.name}`)
      .join("\n");

    const prompt = `You are an academic advisor at Berea College helping a student plan their career path.

The student has the following profile:
- Major(s): ${majors.join(", ")}
- Career Goal(s): ${careerGoals.join(", ")}
- Interests: ${interests.join(", ")}

Their planned courses include:
${coursesText}

Based on their career goals, provide brief, actionable advice (2-3 paragraphs) on:
1. Which courses from their plan are most critical for their career goals and why
2. Any skills or topics they should focus on during these courses
3. One suggestion for how they might gain relevant experience outside the classroom (internships, projects, etc.)

Keep the tone encouraging and practical. Be specific to their career goals.`;

    const result = await generateText({
      model: google("gemini-1.5-flash"),
      prompt,
    });

    return Response.json({ advice: result.text });
  } catch (error) {
    console.error("Career advice API error:", error);
    return Response.json(
      { error: "Failed to generate career advice" },
      { status: 500 }
    );
  }
}
