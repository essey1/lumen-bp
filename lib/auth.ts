import NextAuth from "next-auth";
import { authConfig } from "@/lib/auth.config";
import CredentialsProvider from "next-auth/providers/credentials";
export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  providers: [
    CredentialsProvider({
      credentials: {
        email: { label: "Email", type: "email" },
        password: { label: "Password", type: "password" },
        otpVerified: { type: "hidden" }, // Custom credential to indicate OTP is verified
        token: { type: "hidden" }, // Custom credential for the session token from backend
      },
      async authorize(credentials) {
        // This authorize function is now called *after* OTP verification
        // It expects 'otpVerified: true' and a 'token' from the backend
        if (!credentials?.email || !(credentials as any).otpVerified || !(credentials as any).token) {
          console.warn("[Auth] Authorization failed: Missing email, otpVerified flag, or token.");
          return null;
        }

        try {
          // In a real app, you might want to validate the token with your backend here
          // For now, we'll trust the 'otpVerified' flag and the presence of the token
          // and construct a user object.
          const email = credentials.email as string;
          const token = (credentials as any).token as string;

          console.log(`[Auth] NextAuth session established for: ${email}`);
          return {
            id: email, // Use email as ID
            email: email,
            name: email.split('@')[0], // Derive name from email
            token: token, // Store the backend session token in the user object
          } as any; // Cast to any to allow custom properties like 'token'
        } catch (error) {
          console.error("Auth error:", error);
          return null;
        }
      },
    }),
  ],
  session: {
    strategy: "jwt",
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  jwt: {
    maxAge: 30 * 24 * 60 * 60,
  },
  trustHost: true,
  secret: process.env.NEXTAUTH_SECRET,
});
