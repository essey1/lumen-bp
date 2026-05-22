# Authentication System Setup Guide

## Overview
This project uses **NextAuth.js** with **Prisma** and **PostgreSQL** for authentication.

## What Was Created

### Files & Folders:
1. **`prisma/schema.prisma`** - Database schema for users, sessions, and accounts
2. **`lib/auth.config.ts`** - NextAuth configuration and credentials provider
3. **`lib/auth.ts`** - NextAuth export functions
4. **`lib/prisma.ts`** - Prisma client utility
5. **`lib/auth-helpers.ts`** - Helper functions for protected routes
6. **`app/api/auth/[...nextauth]/route.ts`** - NextAuth API route
7. **`app/api/auth/signup/route.ts`** - User registration endpoint
8. **`app/auth/login/page.tsx`** - Login page
9. **`app/auth/signup/page.tsx`** - Signup page
10. **`middleware.ts`** - Route protection middleware
11. **`components/logout-button.tsx`** - Logout button component
12. **`hooks/use-user.ts`** - Hook for accessing current user
13. **`.env.local.example`** - Environment variables template

## Setup Instructions

### 1. Install Dependencies
```bash
pnpm add next-auth @auth/core @auth/prisma-adapter prisma @prisma/client bcryptjs
```

### 2. Create PostgreSQL Database
```bash
# Create a new PostgreSQL database
createdb lumen_bp
```

For Vercel deployments, attach a writable Postgres database such as Vercel Postgres, Neon, or Supabase, then set the deployment environment variables:

```
DATABASE_POSTGRES_PRISMA_URL=postgresql://...
DATABASE_POSTGRES_URL_NON_POOLING=postgresql://...
```

The production build runs `prisma migrate deploy`, so the database must be reachable during deployment.

### 3. Configure Environment Variables
Copy `.env.local.example` to `.env.local`:
```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your values:
```
AUTH_TRUST_HOST=true
AUTH_SECRET=<generate-with-openssl-rand-base64-32>
NEXTAUTH_SECRET=<generate-with-openssl-rand-base64-32>
DATABASE_POSTGRES_PRISMA_URL=postgresql://user:password@localhost:5432/lumen_bp
DATABASE_POSTGRES_URL_NON_POOLING=postgresql://user:password@localhost:5432/lumen_bp
```

Leave `AUTH_URL`/`NEXTAUTH_URL` unset for localhost, Vercel, and forwarded/global dev links so Auth.js can use the current request host.

To generate a secret:
```bash
openssl rand -base64 32
```

### 4. Initialize Database
```bash
pnpm exec prisma migrate dev --name init
```

### 5. Update next.config.mjs (if needed)
Make sure your Next.js config supports the auth setup:
```javascript
// Add this to next.config.mjs if not present
export default {
  // ... existing config
};
```

### 6. Start the Development Server
```bash
pnpm dev
```

Visit `http://localhost:3000/auth/signup` to create an account.

## Usage

### Protect a Page
```typescript
// In a server component
import { requireAuth } from "@/lib/auth-helpers";

export default async function ProtectedPage() {
  const session = await requireAuth();
  return <div>Hello {session.user?.name}</div>;
}
```

### Use Current User in Client Component
```typescript
"use client";

import { useUser } from "@/hooks/use-user";

export function UserProfile() {
  const { user, isLoading } = useUser();
  
  if (isLoading) return <p>Loading...</p>;
  return <p>Welcome {user?.name}</p>;
}
```

### Add Logout Button
```typescript
import { LogoutButton } from "@/components/logout-button";

export function Navbar() {
  return (
    <nav>
      {/* ... */}
      <LogoutButton />
    </nav>
  );
}
```

## Protected Routes
Currently configured in `middleware.ts`:
- `/plan` - Requires authentication
- `/planner` - Requires authentication

To add more protected routes, update the `protectedRoutes` array in `middleware.ts`.

## Database Schema
- **User** - Stores user account info (email, password, name)
- **Account** - OAuth account links (if adding social login later)
- **Session** - Active sessions
- **VerificationToken** - Email verification tokens

## Security Features
✅ Password hashing with bcryptjs  
✅ Session-based authentication  
✅ CSRF protection (NextAuth.js built-in)  
✅ Protected routes via middleware  
✅ Secure HTTP-only cookies  

## Next Steps
1. Connect your login/signup pages to your navbar
2. Add protected routes as needed
3. (Optional) Add social login providers (Google, GitHub, etc.)
4. (Optional) Add email verification
5. (Optional) Add password reset functionality

## Troubleshooting

### "Cannot find module '@auth/prisma-adapter'"
Make sure all dependencies are installed:
```bash
pnpm install
```

### Database connection error
Check your `DATABASE_POSTGRES_PRISMA_URL` in `.env.local` and ensure PostgreSQL is running.

### "NextAuth secret is not set"
Generate and set `AUTH_SECRET` in `.env.local`:
```bash
openssl rand -base64 32
```

## Extending Authentication
See comments in files for where to add:
- Social login providers
- Email verification
- Password reset
- Two-factor authentication
- Role-based access control (RBAC)

---

# OTP (One-Time Password) Authentication Setup

## Overview
Added secure OTP-based two-factor authentication with:
- ✅ Hashed OTPs using bcryptjs
- ✅ Rate limiting (max 3 attempts per OTP)
- ✅ Resend cooldown (1 minute between resends)
- ✅ HTTP-only cookies (no localStorage)
- ✅ Auto-cleanup of expired OTPs
- ✅ Seamless integration with login flow

## What Was Added

### Database Schema
- **User.otpEnabled** (Boolean) - Whether OTP is required for this user
- **OTP model** - Stores hashed OTP codes with tracking

### API Endpoints
1. **POST `/api/auth/verify-credentials`** - Verify email/password and check if OTP needed
2. **POST `/api/auth/send-otp`** - Generate and send OTP (with rate limiting)
3. **POST `/api/auth/verify-otp`** - Verify OTP with attempt tracking
4. **GET `/api/cron/cleanup-otps`** - Background cleanup of expired OTPs (optional)

### Pages
- **`/auth/login`** - Updated to handle OTP flow
- **`/auth/verify-otp`** - OTP verification page

### Utilities
- **`lib/otp.ts`** - OTP generation, hashing, and verification
- **`lib/email.ts`** - Email sending placeholder + cleanup function
- **`lib/otp-cleanup.ts`** - Cron job for cleanup

## Setup Instructions

### 1. Run Database Migration
```bash
pnpm exec prisma migrate dev --name add_otp
```

### 2. Configure Email Service
Edit `lib/email.ts` and implement email sending. Options:
- **Resend** (easiest for Next.js)
  ```bash
  pnpm add resend
  ```
  ```typescript
  import { Resend } from 'resend'
  const resend = new Resend(process.env.RESEND_API_KEY)
  await resend.emails.send({ /* ... */ })
  ```

- **SendGrid**
  ```bash
  pnpm add @sendgrid/mail
  ```

- **Mailgun**, **AWS SES**, etc.

### 3. Add Environment Variables
```bash
# .env.local
AUTH_TRUST_HOST=true
AUTH_SECRET=<your-secret>
NEXTAUTH_SECRET=<your-secret>
DATABASE_POSTGRES_PRISMA_URL=<your-pooled-database-url>
DATABASE_POSTGRES_URL_NON_POOLING=<your-direct-database-url>

# Optional: For email sending (e.g., Resend)
RESEND_API_KEY=<your-resend-key>

# Optional: For cron job cleanup
CRON_SECRET=<your-cron-secret>
```

### 4. (Optional) Setup Automated Cleanup
If using Vercel Cron or external cron service:

```bash
# Add to .env.local
CRON_SECRET=your-secret-key
```

Then call this URL periodically (e.g., every 5 minutes):
```
GET /api/cron/cleanup-otps
Authorization: Bearer <CRON_SECRET>
```

Or use node-cron for local development:
```bash
pnpm add node-cron
```

Then in `lib/otp-cleanup.ts`, uncomment and use as shown.

## How It Works

### Login Flow with OTP

1. **User enters credentials** on `/auth/login`
2. **System verifies password** via `/api/auth/verify-credentials`
3. **If OTP enabled:**
   - Generate 6-digit OTP
   - Hash it and store in DB
   - Send plain code to user's email
   - Set HTTP-only cookie with email
   - Redirect to `/auth/verify-otp`
4. **User enters code** on verify page
5. **System verifies code:**
   - Retrieve hashed code from DB
   - Compare with bcrypt
   - Allow 3 failed attempts max
   - Delete OTP after successful verification
   - Create session

## Security Features

| Feature | Implementation |
|---------|-----------------|
| **OTP Hashing** | bcryptjs (10 rounds) |
| **Email Storage** | HTTP-only cookies (not localStorage) |
| **Attempt Limiting** | Max 3 attempts per OTP |
| **Resend Cooldown** | 1 minute between resend requests |
| **Expiration** | 5 minutes per OTP |
| **Auto-Cleanup** | Expired OTPs deleted via cron |
| **Cookie Security** | httpOnly + secure flags |

## Configuration Options

Edit these in the code:

```typescript
// lib/otp.ts
export function getOTPExpiry(): Date {
  return new Date(Date.now() + 5 * 60 * 1000) // ← Change 5 min
}

export function isResendAllowed(lastResendAt: Date | null): boolean {
  const cooldown = 60 * 1000 // ← Change 1 min
  return Date.now() - lastResendAt.getTime() > cooldown
}

// app/api/auth/verify-otp/route.ts
const MAX_ATTEMPTS = 3 // ← Change max attempts
```

## Customization

### Disable OTP for Specific Users
```typescript
// In signup or user settings
await prisma.user.update({
  where: { id: userId },
  data: { otpEnabled: false }
})
```

### Get Remaining Attempts
The verify-otp endpoint returns attempts in the error message:
```json
{
  "error": "Invalid code. 2 attempts remaining."
}
```

### Monitor Failed OTP Attempts
```typescript
// Get users with many failed OTP attempts
const riskUsers = await prisma.otp.groupBy({
  by: ['userId'],
  where: {
    attempts: { gte: 2 }
  }
})
```

## Troubleshooting

### OTP not being sent
- Check email service configuration in `lib/email.ts`
- Verify `RESEND_API_KEY` or other email provider keys
- Check console logs for errors

### "Email cookie not found"
- Ensure send-otp is called before verify-otp
- Check that cookies are being set (check browser DevTools → Application → Cookies)

### OTP always fails verification
- Verify bcrypt is installed: `pnpm add bcryptjs`
- Check hashing in send-otp and comparison in verify-otp
- Ensure database is migrated: `pnpm exec prisma migrate dev`

### Too many failed attempts error
- Wait for new OTP or use resend button (1 min cooldown)
- Resend resets attempt counter to 0

## Next Steps
1. Implement email sending service
2. Test with real email or Mailtrap/Ethereal
3. Monitor OTP attempts and failed logins
4. (Optional) Add recovery codes
5. (Optional) Allow users to disable OTP
6. (Optional) Add WebAuthn/passkeys
