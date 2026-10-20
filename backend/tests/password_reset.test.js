import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import crypto from 'crypto';
import app from '../src/app.js';
import { initDb, pool, isPostgresConnected, memoryStore } from '../src/db/index.js';
import { emailService } from '../src/services/emailService.js';
import { passwordResetRepository } from '../src/repositories/passwordResetRepository.js';
import { userRepository } from '../src/repositories/userRepository.js';
import { securityLogRepository } from '../src/repositories/securityLogRepository.js';

let server;
let baseUrl;

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

describe('GitHub Issue #4: Password Recovery / Password Reset Suite', () => {
  before(async () => {
    process.env.MOCK_EMAIL = 'true';
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
    if (server) {
      await new Promise((resolve) => server.close(resolve));
    }
  });

  test('A. Existing registered email returns generic success and sends reset link with 15-minute TTL', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.a.${Date.now()}@linktest.io`;

    // Create a verified student
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Reset Student A',
        email,
        password: 'InitialPassword123!'
      })
    });
    assert.strictEqual(regRes.status, 201);

    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    // Request password reset
    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'If an account exists for this email, a password reset link has been sent.');
    assert.strictEqual(body.data.message, 'If an account exists for this email, a password reset link has been sent.');
    assert.strictEqual(body.data.dev_reset_url, undefined, 'Must not leak dev_reset_url to prevent user enumeration');

    // Verify email was dispatched
    const lastEmail = emailService.getLastSentEmail();
    assert.ok(lastEmail, 'Password reset email must be sent');
    assert.strictEqual(lastEmail.to, email);
    assert.strictEqual(lastEmail.subject, 'Reset your LinkTest password');
    assert.ok(lastEmail.resetUrl, 'Reset URL must be present in dispatched email');

    const parsedUrl = new URL(lastEmail.resetUrl);
    const rawToken = parsedUrl.searchParams.get('token');
    assert.ok(rawToken, 'Reset URL must contain token parameter');
    assert.strictEqual(rawToken.length, 64, 'Token must be a 64-character hex string (32 random bytes)');

    // Verify SHA-256 token hashing in storage
    const tokenHash = hashToken(rawToken);
    const record = await passwordResetRepository.findByTokenHash(tokenHash);
    assert.ok(record, 'Record must be found by token hash');
    assert.strictEqual(record.user_id, user.id);
    assert.strictEqual(record.token_hash, tokenHash);
    assert.strictEqual(record.used, false);

    // Verify 15-minute TTL
    const now = Date.now();
    const expiresAtMs = new Date(record.expires_at).getTime();
    const ttlMs = expiresAtMs - now;
    assert.ok(ttlMs > 14 * 60 * 1000 && ttlMs <= 15 * 60 * 1000 + 5000, `Expected 15-minute TTL, got ${ttlMs}ms`);
  });

  test('B. Unknown email returns identical generic success and does NOT send email (prevents user enumeration)', async () => {
    emailService.clearLastSentEmail();
    const nonExistentEmail = `unknown.user.${Date.now()}@linktest.io`;

    const res = await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: nonExistentEmail })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.message, 'If an account exists for this email, a password reset link has been sent.');
    assert.strictEqual(body.data.message, 'If an account exists for this email, a password reset link has been sent.');
    assert.strictEqual(body.data.dev_reset_url, undefined);

    // No email dispatched
    const lastEmail = emailService.getLastSentEmail();
    assert.strictEqual(lastEmail, null, 'No email should be dispatched for non-existent account');
  });

  test('C. Valid token resets password, updates password_hash, marks token unusable, and enables immediate login', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.c.${Date.now()}@linktest.io`;
    const initialPassword = 'InitialPassword123!';
    const newPassword = 'NewSecurePassword123!';

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student C', email, password: initialPassword })
    });

    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    const oldHash = user.password_hash;
    emailService.clearLastSentEmail();

    // 1. Request reset
    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const lastEmail = emailService.getLastSentEmail();
    const rawToken = new URL(lastEmail.resetUrl).searchParams.get('token');

    // 2. Perform reset
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        new_password: newPassword
      })
    });

    assert.strictEqual(resetRes.status, 200);
    const resetBody = await resetRes.json();
    assert.strictEqual(resetBody.success, true);
    assert.match(resetBody.message, /Password has been reset successfully/i);

    // 3. Verify password_hash changed in database
    const updatedUser = await userRepository.findByEmail(email);
    assert.notStrictEqual(updatedUser.password_hash, oldHash, 'password_hash must change in database');

    // 4. Verify token became unusable
    const tokenHash = hashToken(rawToken);
    const tokenRecord = await passwordResetRepository.findByTokenHash(tokenHash);
    assert.strictEqual(tokenRecord.used, true, 'Token must be marked as used');

    // 5. Verify user can immediately log in with new password
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: newPassword })
    });

    assert.strictEqual(loginRes.status, 200);
    const loginBody = await loginRes.json();
    assert.strictEqual(loginBody.success, true);
    assert.ok(loginBody.data.token, 'Must receive a valid session token upon immediate login');

    // 6. Old password must be rejected
    const oldLoginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: initialPassword })
    });
    assert.strictEqual(oldLoginRes.status, 401);
  });

  test('D. Invalid token returns HTTP 400 INVALID_OR_EXPIRED_TOKEN without exposing why', async () => {
    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: 'invalid_token_9999999999999999999999999999999999999999999999999999999999999999',
        new_password: 'ValidPassword123!'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_OR_EXPIRED_TOKEN');
    assert.strictEqual(body.error.message, 'Invalid or expired password reset token.');
  });

  test('E. Expired token returns HTTP 400 INVALID_OR_EXPIRED_TOKEN', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.e.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student E', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const rawToken = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');
    const tokenHash = hashToken(rawToken);

    // Manually expire the token in database
    await passwordResetRepository.setTokenExpiredForTest(tokenHash);

    const res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        token: rawToken,
        new_password: 'NewValidPassword123!'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_OR_EXPIRED_TOKEN');
    assert.strictEqual(body.error.message, 'Invalid or expired password reset token.');
  });

  test('F. Reused token: first reset succeeds, second use returns HTTP 400 INVALID_OR_EXPIRED_TOKEN', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.f.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student F', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const rawToken = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    // 1st use -> Succeeds
    const res1 = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'FirstResetPassword123!' })
    });
    assert.strictEqual(res1.status, 200);

    // 2nd use -> Fails
    const res2 = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'SecondResetPassword123!' })
    });
    assert.strictEqual(res2.status, 400);
    const body2 = await res2.json();
    assert.strictEqual(body2.success, false);
    assert.strictEqual(body2.error.code, 'INVALID_OR_EXPIRED_TOKEN');
  });

  test('G. Password validation: invalid new passwords are rejected according to existing validation rules', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.g.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student G', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const rawToken = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    // Password too short (< 8 characters)
    const shortRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'short' })
    });

    assert.strictEqual(shortRes.status, 400);
    const shortBody = await shortRes.json();
    assert.strictEqual(shortBody.success, false);
    assert.strictEqual(shortBody.error.code, 'VALIDATION_ERROR');

    // Token must NOT be consumed by a validation failure; now reset with valid password
    const validRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'ValidPassword123!' })
    });
    assert.strictEqual(validRes.status, 200);
  });

  test('H. Multiple reset tokens: after successful reset, all previous/active reset tokens for that user are invalidated', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.h.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student H', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);

    // Generate Token 1
    emailService.clearLastSentEmail();
    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const token1 = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    // Generate Token 2
    emailService.clearLastSentEmail();
    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const token2 = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    assert.notStrictEqual(token1, token2, 'Two requests must produce two unique tokens');

    // Reset password using Token 2
    const resetRes = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token2, new_password: 'NewPasswordH123!' })
    });
    assert.strictEqual(resetRes.status, 200);

    // Token 1 must now be invalidated as well!
    const token1Res = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token1, new_password: 'AnotherPasswordH123!' })
    });
    assert.strictEqual(token1Res.status, 400);
    const body1 = await token1Res.json();
    assert.strictEqual(body1.error.code, 'INVALID_OR_EXPIRED_TOKEN');

    // Token 2 reuse must also be rejected
    const token2Reuse = await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: token2, new_password: 'YetAnotherPasswordH123!' })
    });
    assert.strictEqual(token2Reuse.status, 400);
    const body2 = await token2Reuse.json();
    assert.strictEqual(body2.error.code, 'INVALID_OR_EXPIRED_TOKEN');
  });

  test('I. Security: raw reset token is not stored in DB and PASSWORD_RESET_SUCCESS security event is recorded', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.i.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student I', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const rawToken = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    // Inspect database: raw token must NOT be present in token_hash or anywhere
    if (isPostgresConnected && pool) {
      const dbCheck = await pool.query('SELECT * FROM password_reset_tokens WHERE token_hash = $1', [rawToken]);
      assert.strictEqual(dbCheck.rows.length, 0, 'Raw token must NEVER exist in PostgreSQL');
    }
    const memCheck = (memoryStore.password_reset_tokens || []).find(t => t.token_hash === rawToken);
    assert.strictEqual(memCheck, undefined, 'Raw token must NEVER exist in MemoryStore');

    // Complete reset
    await fetch(`${baseUrl}/api/auth/reset-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ token: rawToken, new_password: 'NewPasswordI123!' })
    });

    // Check security event log
    const securityLogs = await securityLogRepository.getLogs({ eventType: 'PASSWORD_RESET_SUCCESS' });
    const logFound = (securityLogs.logs || []).some(l => l.user_email === email || l.user_id === user.id);
    assert.ok(logFound, 'A PASSWORD_RESET_SUCCESS event must be recorded for this user');
  });

  test('J. Concurrent/repeated token use: exact same reset token cannot reset password twice', async () => {
    emailService.clearLastSentEmail();
    const email = `pwd.student.j.${Date.now()}@linktest.io`;

    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Student J', email, password: 'Password123!' })
    });
    const user = await userRepository.findByEmail(email);
    await userRepository.markEmailVerified(user.id);
    emailService.clearLastSentEmail();

    await fetch(`${baseUrl}/api/auth/forgot-password`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    const rawToken = new URL(emailService.getLastSentEmail().resetUrl).searchParams.get('token');

    // Fire 2 concurrent requests with the exact same token
    const [resA, resB] = await Promise.all([
      fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken, new_password: 'PasswordWinnerA123!' })
      }),
      fetch(`${baseUrl}/api/auth/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token: rawToken, new_password: 'PasswordWinnerB123!' })
      })
    ]);

    const statuses = [resA.status, resB.status].sort();
    assert.deepStrictEqual(statuses, [200, 400], 'Exactly one concurrent request must succeed (200) and the other fail (400)');

    const failureRes = resA.status === 400 ? resA : resB;
    const failBody = await failureRes.json();
    assert.strictEqual(failBody.error.code, 'INVALID_OR_EXPIRED_TOKEN');

    // The user can authenticate with the winning password
    const winningPass = resA.status === 200 ? 'PasswordWinnerA123!' : 'PasswordWinnerB123!';
    const losingPass = resA.status === 200 ? 'PasswordWinnerB123!' : 'PasswordWinnerA123!';

    const winLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: winningPass })
    });
    assert.strictEqual(winLogin.status, 200);

    const loseLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password: losingPass })
    });
    assert.strictEqual(loseLogin.status, 401);
  });
});
