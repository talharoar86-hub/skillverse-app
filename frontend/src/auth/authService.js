import { getData, setData, addData, updateData } from '../utils/storage';

const MAX_FAILED_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 mins
const SESSION_EXPIRY = 24 * 60 * 60 * 1000; // 1 day

class AuthService {
  constructor() {
    this.sessionCache = null;
  }

  // Helper to hash password mock
  async _hashPassword(password) {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  }

  async signup({ name, email, password }) {
    const emailLower = email.toLowerCase();
    const users = getData('users') || [];
    
    if (users.find(u => u.email === emailLower)) {
      throw new Error("Email already registered");
    }

    const hashedPassword = await this._hashPassword(password);
    
    const newUser = {
      name,
      email: emailLower,
      password: hashedPassword,
      failedLoginAttempts: 0,
      lockedUntil: null,
      onboardingComplete: false,
    };

    const addedUser = addData('users', newUser);
    // Don't log them in yet, they need onboarding maybe, or auto log in
    return this._createSession(addedUser);
  }

  async login(email, password) {
    const emailLower = email.toLowerCase();
    const users = getData('users') || [];
    const user = users.find(u => u.email === emailLower);

    if (!user) {
      throw new Error("Invalid credentials");
    }

    // Check rate limit
    if (user.lockedUntil && Date.now() < user.lockedUntil) {
      throw new Error("Account is temporarily locked due to too many failed attempts. Try again later.");
    }

    const hashedPassword = await this._hashPassword(password);
    
    if (user.password !== hashedPassword) {
      // Handle failed attempt
      const attempts = (user.failedLoginAttempts || 0) + 1;
      let updates = { failedLoginAttempts: attempts };
      
      if (attempts >= MAX_FAILED_ATTEMPTS) {
        updates.lockedUntil = Date.now() + LOCKOUT_DURATION;
        updates.failedLoginAttempts = 0; // reset for after lockout
      }
      
      updateData('users', user.id, updates);
      throw new Error("Invalid credentials");
    }

    // Success
    updateData('users', user.id, { failedLoginAttempts: 0, lockedUntil: null });
    return this._createSession(user);
  }

  _createSession(user) {
    const session = {
      userId: user.id,
      email: user.email,
      name: user.name,
      onboardingComplete: user.onboardingComplete,
      expiresAt: Date.now() + SESSION_EXPIRY
    };
    setData('session', session);
    this.sessionCache = session;
    return session;
  }

  getSession() {
    if (this.sessionCache) {
      if (Date.now() > this.sessionCache.expiresAt) {
        this.logout();
        return null;
      }
      return this.sessionCache;
    }

    const session = getData('session');
    if (!session) return null;

    if (Date.now() > session.expiresAt) {
      this.logout();
      return null;
    }
    this.sessionCache = session;
    return session;
  }

  logout() {
    setData('session', null);
    this.sessionCache = null;
  }

  async simulateOAuth(provider) {
    // Generate a mock OAuth user
    const fakeEmail = `oauth.${provider}.${Date.now()}@example.com`.toLowerCase();
    const fakeName = `${provider} User`;

    const newUser = {
      name: fakeName,
      email: fakeEmail,
      password: await this._hashPassword(crypto.randomUUID()), // Random password
      failedLoginAttempts: 0,
      lockedUntil: null,
      onboardingComplete: false,
      oauthProvider: provider
    };

    const addedUser = addData('users', newUser);
    return this._createSession(addedUser);
  }

  resetPasswordRequest(email) {
    const users = getData('users') || [];
    const user = users.find(u => u.email === email.toLowerCase());
    if (!user) return false; // Mock sending
    // MOCK: In real life we'd send an email with a token.
    return true;
  }

  async updatePassword(email, newPassword) {
    const users = getData('users') || [];
    const user = users.find(u => u.email === email.toLowerCase());
    if(!user) throw new Error("User not found");
    const newHash = await this._hashPassword(newPassword);
    updateData('users', user.id, { password: newHash });
    return true;
  }
}

export const authService = new AuthService();
