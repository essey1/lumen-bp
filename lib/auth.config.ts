import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  providers: [],
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

      if (isOnAuthPage) {
        // If the user is already logged in and tries to go to /auth/login,
        // redirect them to the planner instead of the public home page.
        if (isLoggedIn) return Response.redirect(new URL("/planner", nextUrl));
        return true;
      }

      // PRIVATE BY DEFAULT: Any other page (including '/') now requires authentication.
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
