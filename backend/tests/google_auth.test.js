import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { userRepository } from '../src/repositories/userRepository.js';
import { authService, setGoogleOAuthClient, getGoogleOAuthClient } from '../src/services/authService.js';
import { config } from '../src/config/env.js';

let server;
let baseUrl;
let originalClient;

describe('LinkTest Google OAuth 2.0 & OpenID Connect Suite', () => {
  before(async () => {
    process.env.MOCK_EMAIL = 'true';
    originalClient = getGoogleOAuthClient();
    await initDb();
    await new Promise((resolve) => {
      server = app.listen(0, () => {
        const port = server.address().port;
        baseUrl = `http://127.0.0.1:${port}`;
        resolve();
      });
    });
  });

  after(async () => {
    setGoogleOAuthClient(originalClient);
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('1. Reject missing or empty Google credential token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({})
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  test('2. Reject Google token with invalid signature or verification failure', async () => {
    setGoogleOAuthClient({
      verifyIdToken: async () => {
        throw new Error('Invalid token signature');
      }
    });

    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'invalid.jwt.token' })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'GOOGLE_AUTH_FAILED');
  });

  test('3. Reject Google token with untrusted issuer', async () => {
    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://evil-issuer.com',
          sub: 'google-sub-123',
          email: 'user@example.com',
          email_verified: true
        })
      })
    });

    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake.untrusted.issuer' })
    });

    assert.strictEqual(res.status, 401);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'INVALID_ISSUER');
  });

  test('4. Reject Google token with mismatched audience when client ID is configured', async () => {
    const prevClientId = config.google.clientId;
    config.google.clientId = 'expected-linktest-client-id.apps.googleusercontent.com';

    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: 'different-client-id.apps.googleusercontent.com',
          sub: 'google-sub-123',
          email: 'user@example.com',
          email_verified: true
        })
      })
    });

    try {
      const res = await fetch(`${baseUrl}/api/auth/google`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential: 'fake.mismatched.audience' })
      });

      assert.strictEqual(res.status, 401);
      const body = await res.json();
      assert.strictEqual(body.error.code, 'AUDIENCE_MISMATCH');
    } finally {
      config.google.clientId = prevClientId;
    }
  });

  test('5. Reject Google account if email is NOT verified by Google', async () => {
    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: 'google-sub-unverified',
          email: 'unverified-gmail@example.com',
          email_verified: false
        })
      })
    });

    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'fake.unverified.email' })
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.error.code, 'GOOGLE_EMAIL_NOT_VERIFIED');
  });

  test('6. New user registration via Google creates STUDENT account with verified status', async () => {
    const uniqueSub = `sub-${Date.now()}`;
    const uniqueEmail = `google.newuser.${Date.now()}@example.com`;

    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: uniqueSub,
          email: uniqueEmail,
          email_verified: true,
          name: 'Priya Sharma',
          picture: 'https://lh3.googleusercontent.com/a/photo.jpg'
        })
      })
    });

    const res = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid.newuser.token' })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.is_new_user, true);
    assert.strictEqual(body.data.user.role, 'STUDENT', 'Google registration MUST strictly assign STUDENT role');
    assert.strictEqual(body.data.user.email, uniqueEmail);
    assert.strictEqual(body.data.user.email_verified, true, 'Google verified email should be marked verified');
    assert.strictEqual(body.data.user.google_id, uniqueSub);
    assert.ok(body.data.token, 'Must issue LinkTest session JWT');

    // Verify user can be fetched via /api/auth/me
    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${body.data.token}` }
    });
    assert.strictEqual(meRes.status, 200);
    const meBody = await meRes.json();
    assert.strictEqual(meBody.data.user.email, uniqueEmail);
  });

  test('7. Existing user login with linked Google identity succeeds seamlessly', async () => {
    const uniqueSub = `sub-returning-${Date.now()}`;
    const uniqueEmail = `google.returning.${Date.now()}@example.com`;

    // Mock payload
    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: uniqueSub,
          email: uniqueEmail,
          email_verified: true,
          name: 'Returning User'
        })
      })
    });

    // 1st time: registers
    await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid.token.1' })
    });

    // 2nd time: returns existing account
    const secondRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid.token.2' })
    });

    assert.strictEqual(secondRes.status, 200);
    const body = await secondRes.json();
    assert.strictEqual(body.data.is_new_user, false);
    assert.strictEqual(body.data.user.google_id, uniqueSub);
    assert.ok(body.data.token);
  });

  test('8. Secure Account Linking: Existing email/password user links Google without privilege loss', async () => {
    const email = `local.student.${Date.now()}@linktest.io`;

    // 1. Register local user with password
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Local Student',
        email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(regRes.status, 201);

    // 2. Sign in with Google using same email
    const linkSub = `sub-link-${Date.now()}`;
    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: linkSub,
          email,
          email_verified: true,
          name: 'Local Student (Google)'
        })
      })
    });

    const linkRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid.link.token' })
    });

    assert.strictEqual(linkRes.status, 200);
    const body = await linkRes.json();
    assert.strictEqual(body.data.account_linked, true);
    assert.strictEqual(body.data.user.google_id, linkSub);
    assert.strictEqual(body.data.user.email_verified, true);

    // 3. Verify local login STILL WORKS (password was not erased)
    const localLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Password123!'
      })
    });

    assert.strictEqual(localLoginRes.status, 200);
    const localLoginBody = await localLoginRes.json();
    assert.strictEqual(localLoginBody.data.user.email, email);
  });

  test('9. Unlink Google requires local password and prevents lockout', async () => {
    // 9a. Google-only user with no password cannot unlink Google (lockout prevention)
    const googleOnlySub = `sub-no-pass-${Date.now()}`;
    const googleOnlyEmail = `google.only.${Date.now()}@example.com`;

    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: googleOnlySub,
          email: googleOnlyEmail,
          email_verified: true,
          name: 'Google Only'
        })
      })
    });

    const gRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'valid.google.only' })
    });
    const gToken = (await gRes.json()).data.token;

    // Attempt unlink without password
    const failUnlinkRes = await fetch(`${baseUrl}/api/auth/google/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${gToken}`
      },
      body: JSON.stringify({})
    });

    assert.strictEqual(failUnlinkRes.status, 400);
    const failBody = await failUnlinkRes.json();
    assert.strictEqual(failBody.error.code, 'PASSWORD_REQUIRED');

    // 9b. User with password can unlink Google
    const userWithPassEmail = `unlink.test.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Unlink Tester',
        email: userWithPassEmail,
        password: 'Password123!'
      })
    });

    // Link Google
    const unlinkSub = `sub-to-unlink-${Date.now()}`;
    setGoogleOAuthClient({
      verifyIdToken: async () => ({
        getPayload: () => ({
          iss: 'https://accounts.google.com',
          aud: config.google.clientId || undefined,
          sub: unlinkSub,
          email: userWithPassEmail,
          email_verified: true
        })
      })
    });

    const linkedRes = await fetch(`${baseUrl}/api/auth/google`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ credential: 'token.to.unlink' })
    });
    const linkedToken = (await linkedRes.json()).data.token;

    // Successfully unlink with password
    const successUnlinkRes = await fetch(`${baseUrl}/api/auth/google/unlink`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${linkedToken}`
      },
      body: JSON.stringify({ password: 'Password123!' })
    });

    assert.strictEqual(successUnlinkRes.status, 200);
    const successBody = await successUnlinkRes.json();
    assert.strictEqual(successBody.success, true);
    assert.strictEqual(successBody.data.user.google_id, null);
  });

  test('10. Health check endpoint reports Google auth operational status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.auth_methods.includes('google_oauth2'));
  });
});
