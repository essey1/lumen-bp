import { PrismaClient } from "@prisma/client";

const globalForPrisma = global as unknown as { prisma: PrismaClient };

/**
 * Supabase's Vercel integration sets DATABASE_POSTGRES_URL to a Supavisor
 * (pgbouncer-compatible) pooler URL on port 6543.  Prisma requires the
 * ?pgbouncer=true flag on such URLs to disable prepared-statement mode,
 * which poolers running in transaction mode don't support.
 */
function buildDatasourceUrl(): string | undefined {
  const url = process.env.DATABASE_POSTGRES_URL;
  if (!url) return undefined;                       // local dev — schema.prisma env(DATABASE_URL) takes over

  // Detect Supabase Supavisor pooler URLs (port 6543 or pooler.supabase.com)
  const isPooler =
    url.includes(":6543") || url.includes("pooler.supabase.com");

  if (isPooler && !url.includes("pgbouncer=true")) {
    const sep = url.includes("?") ? "&" : "?";
    return `${url}${sep}pgbouncer=true&connection_limit=1`;
  }

  return url;
}

const datasourceUrl = buildDatasourceUrl();

export const prisma =
  globalForPrisma.prisma ||
  new PrismaClient({
    ...(datasourceUrl ? { datasources: { db: { url: datasourceUrl } } } : {}),
    log: process.env.NODE_ENV === "development" ? ["query"] : [],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;
