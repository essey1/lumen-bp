import { hash } from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { NextRequest, NextResponse } from "next/server";

// ── error classifiers ────────────────────────────────────────────────────────

function isSchemaMismatchError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const message = "message" in error && typeof error.message === "string" ? error.message : "";
  const code    = "code"    in error && typeof error.code    === "string" ? error.code    : "";
  return (
    code === "P2022" ||
    code === "P2021" ||
    message.includes("Unknown argument") ||
    message.includes("does not exist in the current database") ||
    message.includes("does not exist on type") ||
    message.includes("Invalid value for argument")
  );
}

function isReadOnlyDatabaseError(error: unknown) {
  if (typeof error !== "object" || error === null) return false;
  const message = "message" in error && typeof error.message === "string"
    ? error.message.toLowerCase() : "";
  return (
    message.includes("readonly database") ||
    message.includes("read-only database") ||
    message.includes("attempt to write a readonly database") ||
    message.includes("unable to open database file")
  );
}

/** Extracts a short, safe debug string from any Prisma or JS error. */
function errorSummary(error: unknown): string {
  if (typeof error !== "object" || error === null) return String(error);
  const code    = "code"    in error ? String((error as Record<string,unknown>).code)    : null;
  const message = "message" in error ? String((error as Record<string,unknown>).message) : null;
  const parts: string[] = [];
  if (code)    parts.push(`[${code}]`);
  if (message) parts.push(message.split("\n")[0].slice(0, 200)); // first line only, truncated
  return parts.join(" ") || "unknown error";
}

// ── route ────────────────────────────────────────────────────────────────────

export async function POST(request: NextRequest) {
  // ── 1. Parse & validate request ─────────────────────────────────────────
  let body: Record<string, unknown>;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const { name, email, password, major, year, bio, completedSemesters, mathPlacement, waivedCourses } = body as {
    name?: string; email?: string; password?: string; major?: string;
    year?: string; bio?: string; completedSemesters?: unknown;
    mathPlacement?: string; waivedCourses?: string[];
  };

  if (!email || !password || !name) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  if (!email.endsWith("@berea.edu")) {
    return NextResponse.json(
      { error: "Only Berea College email addresses (@berea.edu) are allowed." },
      { status: 400 }
    );
  }

  if (
    password.length < 8 ||
    !/[A-Z]/.test(password) ||
    !/[a-z]/.test(password) ||
    !/[0-9]/.test(password) ||
    !/[^A-Za-z0-9]/.test(password)
  ) {
    return NextResponse.json(
      { error: "Password does not meet the required strength criteria." },
      { status: 400 }
    );
  }

  // ── 2. Check for existing account ───────────────────────────────────────
  try {
    const existingUser = await prisma.user.findUnique({
      where: { email },
      select: { id: true },
    });
    if (existingUser) {
      return NextResponse.json({ error: "Email already in use" }, { status: 400 });
    }
  } catch (dbError) {
    const summary = errorSummary(dbError);
    console.error("[Signup] DB lookup failed:", dbError);

    if (isReadOnlyDatabaseError(dbError)) {
      return NextResponse.json(
        { error: "Database is read-only. Check Vercel environment variables." },
        { status: 503 }
      );
    }

    return NextResponse.json(
      { error: `Database connection failed. ${summary}` },
      { status: 503 }
    );
  }

  // ── 3. Hash password ─────────────────────────────────────────────────────
  const hashedPassword = await hash(password, 10);

  const baseUserData = {
    name,
    email,
    password: hashedPassword,
    otpEnabled: true,
  };

  // ── 4. Create user (with profile fields, fall back to base if schema mismatch) ──
  let user: { id: string; name: string | null; email: string | null };

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    user = await (prisma.user as any).create({
      data: {
        ...baseUserData,
        major:              major              || null,
        year:               year               ? parseInt(year) : null,
        bio:                bio                || null,
        completedSemesters: completedSemesters ? JSON.stringify(completedSemesters) : null,
        mathPlacement:      mathPlacement      || "none",
        waivedCourses:      waivedCourses && waivedCourses.length > 0
                              ? JSON.stringify(waivedCourses) : null,
      },
      select: { id: true, name: true, email: true },
    });
  } catch (profileError) {
    if (!isSchemaMismatchError(profileError)) {
      // Something other than a missing-column error — log it and surface the code
      const summary = errorSummary(profileError);
      console.error("[Signup] User create (full) failed:", profileError);

      if (isReadOnlyDatabaseError(profileError)) {
        return NextResponse.json(
          { error: "Database is read-only. Check Vercel environment variables." },
          { status: 503 }
        );
      }

      return NextResponse.json(
        { error: `Failed to create account. ${summary}` },
        { status: 500 }
      );
    }

    // Schema mismatch — columns missing in DB; fall back to base fields only
    console.warn("[Signup] Profile columns missing in DB; creating account with base fields only.");
    try {
      user = await prisma.user.create({
        data: baseUserData,
        select: { id: true, name: true, email: true },
      });
    } catch (fallbackError) {
      const summary = errorSummary(fallbackError);
      console.error("[Signup] Base-field fallback create failed:", fallbackError);
      return NextResponse.json(
        { error: `Failed to create account (fallback). ${summary}` },
        { status: 500 }
      );
    }
  }

  return NextResponse.json(
    { user: { id: user.id, name: user.name, email: user.email } },
    { status: 201 }
  );
}
