import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
import type { CustomCourseEntry } from "@/lib/types";

export async function POST(request: Request) {
  const entry: CustomCourseEntry = await request.json();

  const gmailUser = process.env.GMAIL_USER;
  const gmailPass = process.env.GMAIL_APP_PASSWORD;

  // If email is not configured, still succeed — notification is best-effort.
  if (!gmailUser || !gmailPass) {
    return NextResponse.json({ ok: true });
  }

  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: { user: gmailUser, pass: gmailPass },
  });

  const row = (label: string, value: string) =>
    `<tr>
       <td style="padding:8px 14px;font-weight:600;color:#555;border-bottom:1px solid #eee;white-space:nowrap;">${label}</td>
       <td style="padding:8px 14px;color:#111;border-bottom:1px solid #eee;">${value || "<em style='color:#999'>not provided / I don't know</em>"}</td>
     </tr>`;

  const richnesses = entry.richnesses.length > 0 ? entry.richnesses.join(", ") : "";
  const additional = entry.additional.length > 0 ? entry.additional.join(", ") : "";

  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;padding:40px 24px;background:#fff;">
      <h2 style="margin:0 0 6px;font-size:20px;color:#111;">📚 New course added to Lumen</h2>
      <p style="margin:0 0 24px;color:#666;font-size:14px;">
        A student submitted a course that isn't in the catalog yet. Review the details below
        and consider adding it so future students benefit.
      </p>
      <table style="width:100%;border-collapse:collapse;border:1px solid #eee;border-radius:8px;overflow:hidden;">
        ${row("Course Code", `<strong style="font-family:monospace;font-size:16px;">${entry.code}</strong>`)}
        ${row("Course Name", entry.name)}
        ${row("Credits", entry.credits.toString())}
        ${row("Prerequisites", entry.prerequisites)}
        ${row("Way of Knowing", entry.wayOfKnowing)}
        ${row("Richnesses", richnesses)}
        ${row("Value", entry.value)}
        ${row("Additional", additional)}
      </table>
      <p style="margin:24px 0 0;font-size:12px;color:#aaa;">
        Sent automatically by Lumen when a student adds an unlisted course.
      </p>
    </div>
  `;

  await transporter.sendMail({
    from: `"Lumen" <${gmailUser}>`,
    to: "lumen.berea@gmail.com",
    subject: `[Lumen] New course submitted: ${entry.code}${entry.name ? ` – ${entry.name}` : ""}`,
    html,
  });

  return NextResponse.json({ ok: true });
}
