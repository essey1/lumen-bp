import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";
import { DEMO_EMAIL, DEMO_PASSWORD, DEMO_USER, isDemoCredentials } from "@/lib/demo-data";

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {
        email:       { label: "Email",    type: "email" },
        password:    { label: "Password", type: "password" },
        otpVerified: { type: "hidden" },
        token:       { type: "hidden" },
      },
      async authorize(credentials) {
        const email = String(credentials?.email ?? "").trim().toLowerCase();
        const password = String(credentials?.password ?? "");

        if (!email || !password) return null;

        try {
          if (isDemoCredentials(email, password)) {
            return { id: DEMO_USER.id, email: DEMO_EMAIL, name: DEMO_USER.name };
          }

          // Sign-up flow: OTP was verified, token is the userId
          if ((credentials as any).otpVerified && (credentials as any).token) {
            const userId = (credentials as any).token as string;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.email !== email) return null;
            return { id: user.id, email: user.email, name: user.name };
          }

          // Sign-in flow: verify password directly, no OTP
          if (credentials.password) {
            const user = await prisma.user.findUnique({ where: { email: email as string } });
            if (!user || !user.password) return null;
            const valid = await compare(credentials.password as string, user.password);
            if (!valid) return null;
            return { id: user.id, email: user.email, name: user.name };
          }

          return null;
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 90 * 60, // 90 min — matches client-side idle timeout
  },
  jwt: {
    maxAge: 90 * 60, // 90 min
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
