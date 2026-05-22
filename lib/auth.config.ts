import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
  trustHost: true,
  pages: {
    signIn: "/auth/login",
    error: "/auth/login",
  },
  callbacks: {
    authorized({ auth, request }) {
      const isLoggedIn = !!auth?.user;
      const { nextUrl } = request;
      const pathname = nextUrl.pathname;
      const isOnAuthPage = pathname.startsWith("/auth");
      const isPublicPage = isOnAuthPage || pathname === "/";

      if (isOnAuthPage) {
        if (isLoggedIn) return Response.redirect(new URL("/profile", nextUrl));
        return true;
      }

      if (pathname === "/") return true;

      // Gate planner and plan pages — redirect to signup instead of login
      if (pathname.startsWith("/planner") || pathname.startsWith("/plan")) {
        if (!isLoggedIn) return Response.redirect(new URL("/auth/signup", nextUrl));
        return true;
      }

      return isLoggedIn;
    },
    async jwt({ token, user }) {
      if (user) {
        token.id = (user as any).id;
        (token as any).token = (user as any).token; // Pass backend session token
      }
      return token;
    },
    async session({ session, token }) {
      if (session.user && token.id) {
        session.user.id = token.id as string;
        (session.user as any).token = (token as any).token; // Pass backend session token to session
      }
      return session;
    },
  },
} satisfies NextAuthConfig;
