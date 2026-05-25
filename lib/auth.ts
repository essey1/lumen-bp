import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
import { prisma } from "@/lib/prisma";
import { compare } from "bcryptjs";

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
        if (!credentials?.email) return null;

        try {
          // Sign-up flow: OTP was verified, token is the userId
          if ((credentials as any).otpVerified && (credentials as any).token) {
            const userId = (credentials as any).token as string;
            const user = await prisma.user.findUnique({ where: { id: userId } });
            if (!user || user.email !== credentials.email) return null;
            return { id: user.id, email: user.email, name: user.name };
          }

          // Sign-in flow: verify password directly, no OTP
          if (credentials.password) {
            const user = await prisma.user.findUnique({ where: { email: credentials.email as string } });
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
    maxAge: 60 * 60, // 1 hour — matches client-side idle timeout
  },
  jwt: {
    maxAge: 60 * 60, // 1 hour
  },
  trustHost: true,
  secret: process.env.AUTH_SECRET ?? process.env.NEXTAUTH_SECRET,
});
