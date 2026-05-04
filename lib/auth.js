// ============================================================
//  Lumen BP — auth.js
//  Drop this file into your project. It handles all auth
//  communication with your Express backend.
//
//  Usage:
//    import { LumenAuth } from './auth.js';
//    const auth = new LumenAuth();
//
//    // Or if not using ES modules, include the script tag and use:
//    const auth = new window.LumenAuth();
// ============================================================

const BACKEND_URL = 'http://localhost:4000'; // Matches your forced port

class LumenAuth {
  constructor(backendUrl = BACKEND_URL) {
    this.api = backendUrl;
    this._pendingEmail = null; // email remembered between login → OTP steps
  }

  // ── Step 1: Submit credentials ──────────────────────────────
  // Returns: { success, maskedEmail, message }
  async login(username, password) {
    const res = await this._post('/api/auth/login', { email: username, password });
    if (res.success) {
      // Store the email so we can use it in the OTP step
      // We reconstruct it from the username (backend normalises it)
      this._pendingEmail = username.includes('@')
        ? username
        : username.trim().toLowerCase() + '@berea.edu';
    }
    return res;
  }

  // ── Step 2: Submit OTP ──────────────────────────────────────
  // Returns: { success, token, user, message }
  async verifyOtp(otp) {
    if (!this._pendingEmail) {
      return { success: false, message: 'Session expired. Please log in again.' };
    }
    const res = await this._post('/api/auth/verify-otp', {
      email: this._pendingEmail,
      otp:   otp.trim(),
    });
    if (res.success) {
      this._saveSession(res.token, res.user);
      this._pendingEmail = null;
    }
    return res;
  }

  // ── Resend OTP ──────────────────────────────────────────────
  // Returns: { success, message }
  async resendOtp() {
    if (!this._pendingEmail) {
      return { success: false, message: 'Session expired. Please log in again.' };
    }
    return this._post('/api/auth/resend-otp', { email: this._pendingEmail });
  }

  // ── Sign out ────────────────────────────────────────────────
  logout() {
    localStorage.removeItem('lumenBP_token');
    localStorage.removeItem('lumenBP_user');
    this._pendingEmail = null;
  }

  // ── Check if user is currently signed in ────────────────────
  isAuthenticated() {
    return !!localStorage.getItem('lumenBP_token');
  }

  // ── Get stored user info ────────────────────────────────────
  getUser() {
    const u = localStorage.getItem('lumenBP_user');
    return u ? JSON.parse(u) : null;
  }

  // ── Get auth header for your own API calls ──────────────────
  // Usage: fetch('/api/something', { headers: auth.authHeaders() })
  authHeaders() {
    const token = localStorage.getItem('lumenBP_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  }

  // ── Internal helpers ────────────────────────────────────────
  async _post(path, body) {
    try {
      const response = await fetch(this.api + path, {
        method:  'POST',
        headers: { 'Content-Type': 'application/json' },
        body:    JSON.stringify(body),
      });
      return await response.json();
    } catch (err) {
      console.error('[LumenAuth] Network error:', err);
      return { success: false, message: 'Network error. Check your connection.' };
    }
  }

  _saveSession(token, user) {
    localStorage.setItem('lumenBP_token', token);
    localStorage.setItem('lumenBP_user', JSON.stringify(user));
  }
}

// Export for ES modules
if (typeof module !== 'undefined') module.exports = { LumenAuth };
// Expose on window for plain script-tag usage
if (typeof window !== 'undefined') window.LumenAuth = LumenAuth;
