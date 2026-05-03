import { auth } from "@/lib/auth";
import { redirect } from "next/navigation";

/**
 * Protect a server component or API route - redirects to login if not authenticated
 */
export async function requireAuth() {
  const session = await auth();
  if (!session) {
    redirect("/auth/login");
  }
  return session;
}

/**
 * Get the current user - returns null if not authenticated
 */
export async function getCurrentUser() {
  const session = await auth();
  return session?.user;
}
