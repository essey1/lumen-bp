// ============================================================
//  Lumen BP — Auth Server
//  Stack: Node.js + Express + Nodemailer/Gmail (email OTP)
//  Run:   node server.js   (or: nodemon server.js)
// ============================================================

require('dotenv').config();
const express      = require('express');
const cors         = require('cors');
const helmet       = require('helmet');
const rateLimit    = require('express-rate-limit');
const nodemailer   = require('nodemailer');
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const app    = express();
const prisma = new PrismaClient();

function getMailer() {
  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user: process.env.GMAIL_USER, pass: process.env.GMAIL_APP_PASSWORD },
  });
}

// ── Middleware ────────────────────────────────────────────────
app.use(express.json());
app.use(helmet());

// Allow your frontend origin — update in production
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
}));

// Rate-limit login & OTP endpoints to prevent brute-force
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many attempts. Try again in 15 minutes.' },
});

// ── In-memory OTP store ───────────────────────────────────────
// Replace with Redis or a DB table in production
const otpStore = new Map();
// Structure: otpStore.get(email) → { otp, expiresAt, attempts }

const OTP_EXPIRY_MS  = 5 * 60 * 1000; // 5 minutes
const MAX_OTP_TRIES  = 5;

// ── Helpers ───────────────────────────────────────────────────
function generateOtp() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

function maskEmail(email) {
  const [user, domain] = email.split('@');
  return user[0] + '***@' + domain;
}

async function findUser(email, password) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !user.password) return null;
  
  const isValid = await bcrypt.compare(password, user.password);
  return isValid ? user : null;
}

// ── Routes ────────────────────────────────────────────────────
let currentPort = process.env.PORT || 4000;

/**
 * GET /
 * Health check endpoint to verify the server is live and provide test instructions.
 */
app.get('/', (req, res) => {
  const host = `http://localhost:${currentPort}`;
  res.send(`
    <div style="font-family: system-ui, sans-serif; padding: 2rem; max-width: 800px; margin: auto; line-height: 1.5; color: #333;">
      <h1 style="color: #1D9E75; border-bottom: 2px solid #1D9E75; padding-bottom: 0.5rem;">Lumen BP Auth Server</h1>
      <p style="font-size: 1.25rem; font-weight: bold; color: #059669;">✔ Status: Live and Active on Port ${currentPort}</p>
      <p>This is an <strong>API Server</strong>. It doesn't have a visual interface here, but it is successfully listening for authentication requests from your planner.</p>
      
      <div style="background: #f3f4f6; border-radius: 8px; padding: 1.5rem; margin-top: 2rem; border-left: 4px solid #1D9E75;">
        <h3 style="margin-top: 0;">Test the Authenticator Now</h3>
        <p>To see the authenticator work, run this command in a <strong>new terminal</strong> window:</p>
        <code style="display: block; background: #1f2937; color: #f9fafb; padding: 1rem; border-radius: 4px; font-size: 0.85rem; overflow-x: auto; white-space: pre-wrap;">curl.exe --% -X POST ${host}/api/auth/login -H "Content-Type: application/json" -d "{\\"email\\":\\"mountaineer@berea.edu\\", \\"password\\":\\"bereacollege\\"}"</code>
        <p style="margin-bottom: 0; margin-top: 1rem;">After running that, look at your <strong>VS Code terminal logs</strong>. You will see the generated OTP code printed there!</p>
      </div>
    </div>
  `);
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 * Validates credentials, sends OTP email, returns masked email.
 */
app.post('/api/auth/login', authLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    console.log(`[Auth] Received login request for: ${email}`);

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Email and password are required.' });
    }

    const user = await findUser(email.trim().toLowerCase(), password);
    if (!user) {
      console.warn(`[Auth] Login failed: Invalid credentials for ${email}`);
      // Generic message — don't reveal which field is wrong
      return res.status(401).json({ success: false, message: 'Invalid credentials.' });
    }

    // Generate and store OTP
    const otp = generateOtp();
    otpStore.set(user.email, {
      otp,
      expiresAt: Date.now() + OTP_EXPIRY_MS,
      attempts:  0,
    });
    console.log(`[OTP] Generated for ${user.email}: ${otp}`);

    // Send email via Gmail
    try {
      const mailer = getMailer();
      await mailer.sendMail({
        from:    `"Lumen" <${process.env.GMAIL_USER}>`,
        to:      user.email,
        subject: 'Your Lumen verification code',
        html:    buildEmailHtml(otp, user.name || user.email.split('@')[0]),
      });
    } catch (err) {
      console.error('[Mail error]', err);
      return res.status(500).json({ success: false, message: 'Failed to send verification email.' });
    }

    return res.json({
      success:     true,
      maskedEmail: maskEmail(user.email),
      message:     'Verification code sent.',
    });
  } catch (error) {
    console.error('[Auth Critical Error]', error);
    return res.status(500).json({ success: false, message: 'Internal server error. Check backend logs.' });
  }
});

/**
 * POST /api/auth/verify-otp
 * Body: { email, otp }
 * Validates OTP, returns a session token on success.
 */
app.post('/api/auth/verify-otp', authLimiter, (req, res) => {
  const { email, otp } = req.body;

  if (!email || !otp) {
    return res.status(400).json({ success: false, message: 'Email and OTP are required.' });
  }

  const record = otpStore.get(email);

  if (!record) {
    return res.status(400).json({ success: false, message: 'No verification code found. Please log in again.' });
  }

  if (Date.now() > record.expiresAt) {
    otpStore.delete(email);
    return res.status(400).json({ success: false, message: 'Code expired. Please log in again.' });
  }

  if (record.attempts >= MAX_OTP_TRIES) {
    otpStore.delete(email);
    return res.status(429).json({ success: false, message: 'Too many incorrect attempts. Please log in again.' });
  }

  if (record.otp !== otp.trim()) {
    record.attempts++;
    return res.status(401).json({ success: false, message: 'Incorrect code. Try again.' });
  }

  // OTP is valid — clean up store
  otpStore.delete(email);

  // Create a simple session token
  // In production: use JWT (jsonwebtoken) or a proper session library
  const sessionToken = generateSessionToken(email);

  return res.json({
    success: true,
    message: 'Verified successfully.',
    token:   sessionToken, // Return the session token
    user:    { email },
  });
});

/**
 * POST /api/auth/resend-otp
 * Body: { email }
 * Resends a fresh OTP to the same email.
 */
app.post('/api/auth/resend-otp', authLimiter, async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  // Only allow resend if a session was started for this email
  if (!otpStore.has(email)) {
    return res.status(400).json({ success: false, message: 'Session not found. Please log in again.' });
  }

  const otp = generateOtp();
  otpStore.set(email, {
    otp,
    expiresAt: Date.now() + OTP_EXPIRY_MS,
    attempts:  0,
  });

  try {
    const mailer = getMailer();
    await mailer.sendMail({
      from:    `"Lumen" <${process.env.GMAIL_USER}>`,
      to:      email,
      subject: 'Your new Lumen verification code',
      html:    buildEmailHtml(otp, email.split('@')[0]),
    });
  } catch (err) {
    console.error('[Mail error]', err);
    return res.status(500).json({ success: false, message: 'Failed to resend email.' });
  }

  return res.json({ success: true, message: 'New code sent.' });
});

/**
 * GET /api/auth/me  (protected route example)
 * Shows how to protect routes using the session token.
 */
app.get('/api/auth/me', requireAuth, (req, res) => {
  res.json({ success: true, user: req.user });
});

// ── Session token helpers ─────────────────────────────────────
// Simple signed token — replace with JWT in production
const SESSION_SECRET = process.env.SESSION_SECRET || 'change-this-secret-in-production';
const sessionTokens  = new Map(); // token → { email, createdAt }

function generateSessionToken(email) {
  const token = require('crypto').randomBytes(32).toString('hex');
  sessionTokens.set(token, { email, createdAt: Date.now() });
  return token;
}

function requireAuth(req, res, next) {
  const authHeader = req.headers['authorization'] || '';
  const token = authHeader.replace('Bearer ', '').trim();

  if (!token || !sessionTokens.has(token)) {
    return res.status(401).json({ success: false, message: 'Unauthorized.' });
  }

  req.user = sessionTokens.get(token);
  next();
}

// ── Email template ────────────────────────────────────────────
function buildEmailHtml(otp, username) {
  return `
<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head>
<body style="margin:0;padding:0;background:#f4f4f4;font-family:sans-serif">
  <table width="100%" cellpadding="0" cellspacing="0" style="padding:40px 0">
    <tr><td align="center">
      <table width="480" cellpadding="0" cellspacing="0" style="background:#fff;border-radius:12px;overflow:hidden;border:1px solid #e5e7eb">
        <!-- Header -->
        <tr>
          <td style="background:#1D9E75;padding:28px 32px">
            <p style="margin:0;font-size:20px;font-weight:600;color:#fff">Lumen BP</p>
            <p style="margin:4px 0 0;font-size:12px;color:#9FE1CB;letter-spacing:.06em;text-transform:uppercase">Berea College Planner</p>
          </td>
        </tr>
        <!-- Body -->
        <tr>
          <td style="padding:32px">
            <p style="margin:0 0 8px;font-size:15px;color:#374151">Hi <strong>${username}</strong>,</p>
            <p style="margin:0 0 24px;font-size:14px;color:#6b7280;line-height:1.6">
              Here is your verification code. It expires in <strong>5 minutes</strong>.
            </p>
            <!-- OTP box -->
            <div style="text-align:center;margin:0 0 28px">
              <span style="display:inline-block;background:#f0fdf9;border:2px dashed #1D9E75;border-radius:12px;padding:18px 40px;font-size:36px;font-weight:700;color:#0F6E56;letter-spacing:10px">${otp}</span>
            </div>
            <p style="margin:0 0 4px;font-size:13px;color:#6b7280">
              Enter this code on the Lumen BP sign-in page. Do not share it with anyone.
            </p>
            <p style="margin:16px 0 0;font-size:13px;color:#6b7280">
              If you did not request this code, you can safely ignore this email.
            </p>
          </td>
        </tr>
        <!-- Footer -->
        <tr>
          <td style="background:#f9fafb;padding:16px 32px;border-top:1px solid #f3f4f6">
            <p style="margin:0;font-size:12px;color:#9ca3af">
              Lumen BP — Berea College Planner &nbsp;·&nbsp; This is an automated message.
            </p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ── Start server ──────────────────────────────────────────────
const startServer = (port) => {
  currentPort = port;
  app.listen(port, () => {
    console.log(`\x1b[32m[Lumen BP] Auth server is LIVE on http://localhost:${port}\x1b[0m`);
  }).on('error', (err) => {
    console.error('[Error] Server failed to start:', err);
    process.exit(1);
  });
};

startServer(currentPort);
