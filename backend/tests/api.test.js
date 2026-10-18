import { test, describe, before, after } from 'node:test';
import assert from 'node:assert/strict';
import app from '../src/app.js';
import { initDb } from '../src/db/index.js';
import { emailService } from '../src/services/emailService.js';
import { tokenRepository } from '../src/repositories/tokenRepository.js';
import { userRepository } from '../src/repositories/userRepository.js';
import { securityLogRepository } from '../src/repositories/securityLogRepository.js';

let server;
let baseUrl;
let studentToken;
let adminToken;

describe('LinkTest API End-to-End Suite', () => {
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

  test('1. Health Check returns operational status', async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.status, 'operational');
  });

  test('2. Student Registration creates unverified account & triggers email OTP', async () => {
    emailService.clearLastSentEmail();
    const uniqueEmail = `test.student.${Date.now()}@linktest.io`;

    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Rahul Verma',
        email: uniqueEmail,
        password: 'Password123!'
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, 'STUDENT');
    assert.strictEqual(body.data.user.email_verified, false, 'New registrations must be unverified');
    assert.strictEqual(body.data.token, undefined, 'Unverified accounts must NOT receive a session token');

    // Verify mock email delivery
    const lastEmail = emailService.getLastSentEmail();
    assert.ok(lastEmail, 'A verification email must be dispatched');
    assert.strictEqual(lastEmail.to, uniqueEmail);
    assert.strictEqual(lastEmail.subject, 'Verify your email address — LinkTest');
    assert.match(lastEmail.otp, /^\d{6}$/, 'OTP must be a 6-digit numeric code');

    // Verify token stored securely (hashed) and TTL is 10 minutes
    const regUser = await userRepository.findByEmail(uniqueEmail);
    const tokenRecord = await tokenRepository.findByUserId(regUser.id);
    assert.ok(tokenRecord, 'A token record must be persisted');
    assert.notStrictEqual(tokenRecord.token_hash, lastEmail.otp, 'Token must be stored as hash, not plaintext');
    const ttlMs = new Date(tokenRecord.expires_at).getTime() - Date.now();
    assert.ok(ttlMs > 9 * 60 * 1000 && ttlMs <= 10 * 60 * 1000 + 5000, 'OTP must have a 10-minute TTL');
  });

  test('3. Invalid email format is rejected by validation', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Invalid Email User',
        email: 'not-an-email',
        password: 'Password123!'
      })
    });

    assert.strictEqual(res.status, 400);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'VALIDATION_ERROR');
  });

  test('4. Login rejected for unverified account (EMAIL_NOT_VERIFIED)', async () => {
    const unverifiedEmail = `unverified.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Unverified Student',
        email: unverifiedEmail,
        password: 'Password123!'
      })
    });

    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: unverifiedEmail,
        password: 'Password123!'
      })
    });

    assert.strictEqual(loginRes.status, 403);
    const body = await loginRes.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'EMAIL_NOT_VERIFIED');
    assert.strictEqual(body.error.message, 'Please verify your email before logging in.');
  });

  test('5. Incorrect OTP verification is rejected and counts attempts', async () => {
    const email = `otp.test.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'OTP Test',
        email,
        password: 'Password123!'
      })
    });

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: '000000' // Intentionally wrong
      })
    });

    assert.strictEqual(verifyRes.status, 400);
    const body = await verifyRes.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'INVALID_OTP');
  });

  test('6. Correct OTP verifies account and issues authenticated session JWT', async () => {
    const email = `verified.student.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Verified Student',
        email,
        password: 'Password123!'
      })
    });

    const sentOtp = emailService.getLastSentEmail().otp;
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        otp: sentOtp
      })
    });

    assert.strictEqual(verifyRes.status, 200);
    const body = await verifyRes.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.email_verified, true);
    assert.ok(body.data.user.email_verified_at, 'email_verified_at must be populated upon verification');
    assert.ok(body.data.token, 'A valid JWT session must be issued upon email verification');
    studentToken = body.data.token;

    // Login now succeeds after verification
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(loginRes.status, 200);
  });

  test('7. OTP reuse after successful verification is rejected', async () => {
    const email = `reuse.test.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Reuse Test',
        email,
        password: 'Password123!'
      })
    });

    const otp = emailService.getLastSentEmail().otp;
    // First verification succeeds
    await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    // Second verification attempt with same OTP fails
    const secondRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    assert.strictEqual(secondRes.status, 400);
  });

  test('8. Duplicate registration of verified account is rejected with 409 CONFLICT', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Aarav Sharma Duplicate',
        email: 'student@linktest.io', // Seeded student is already verified
        password: 'Password123!'
      })
    });

    assert.strictEqual(res.status, 409);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'CONFLICT');
  });

  test('9. Resend OTP enforces 60-second cooldown', async () => {
    const email = `cooldown.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Cooldown Test',
        email,
        password: 'Password123!'
      })
    });

    // Immediate resend attempt within 60 seconds
    const resendRes = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });

    assert.strictEqual(resendRes.status, 429);
    const body = await resendRes.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'RESEND_COOLDOWN');
  });

  test('10. Max incorrect OTP attempts (5) locks verification', async () => {
    const email = `lockout.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Lockout Test',
        email,
        password: 'Password123!'
      })
    });

    // Attempt 5 incorrect OTPs
    for (let i = 0; i < 5; i++) {
      await fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp: '111111' })
      });
    }

    // 6th attempt should be rejected with MAX_ATTEMPTS_EXCEEDED (429)
    const lockRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '111111' })
    });

    assert.strictEqual(lockRes.status, 429);
    const body = await lockRes.json();
    assert.strictEqual(body.error.code, 'MAX_ATTEMPTS_EXCEEDED');
  });

  test('10b. Expired OTP is rejected with OTP_EXPIRED', async () => {
    const email = `expired.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Expired Test',
        email,
        password: 'Password123!'
      })
    });

    const user = await userRepository.findByEmail(email);
    // Artificially expire the token in database
    await tokenRepository.setTokenExpiredForTest(user.id);

    const otp = emailService.getLastSentEmail().otp;
    const verifyRes = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp })
    });

    assert.strictEqual(verifyRes.status, 400);
    const body = await verifyRes.json();
    assert.strictEqual(body.error.code, 'OTP_EXPIRED');
  });

  test('10c. Public registration cannot grant ADMIN role (tamper resistance)', async () => {
    const email = `tamper.${Date.now()}@linktest.io`;
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Tamper Tester',
        email,
        password: 'Password123!',
        role: 'ADMIN' // Malicious attempt to elevate privileges
      })
    });

    assert.strictEqual(res.status, 201);
    const body = await res.json();
    assert.strictEqual(body.data.user.role, 'STUDENT', 'Public registration MUST enforce STUDENT role');
  });

  test('10d. Concurrent OTP verification requests allow exactly one consumption', async () => {
    const email = `concurrent.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Concurrent User',
        email,
        password: 'Password123!'
      })
    });

    const otp = emailService.getLastSentEmail().otp;

    // Fire 2 simultaneous verification calls
    const [res1, res2] = await Promise.all([
      fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      }),
      fetch(`${baseUrl}/api/auth/verify-email`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, otp })
      })
    ]);

    const statuses = [res1.status, res2.status];
    // Exactly one should succeed with 200, the other should fail with 400
    assert.ok(statuses.includes(200), 'At least one request must succeed');
    assert.ok(statuses.includes(400), 'Concurrent duplicate request must be rejected');
  });

  test('10e. Protected endpoint rejects requests without verified session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: 'Bearer invalid.token.here' }
    });
    assert.strictEqual(res.status, 401);
  });

  test('10f. SMTP delivery failure returns 502 without silently succeeding', async () => {
    const email = `smtp.failure.${Date.now()}@linktest.io`;
    await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'SMTP Fail Test',
        email,
        password: 'Password123!'
      })
    });

    // Reset last sent at so cooldown doesn't trigger
    const user = await userRepository.findByEmail(email);
    await tokenRepository.setTokenLastSentAtForTest(user.id, new Date(Date.now() - 120 * 1000).toISOString());

    // Temporarily mock sendVerificationOtp to simulate Gmail rejection
    const originalSend = emailService.sendVerificationOtp;
    emailService.sendVerificationOtp = async () => {
      throw new Error('535-5.7.8 Username and Password not accepted');
    };

    try {
      const resendRes = await fetch(`${baseUrl}/api/auth/resend-verification`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });

      assert.strictEqual(resendRes.status, 502);
      const body = await resendRes.json();
      assert.strictEqual(body.error.code, 'EMAIL_DELIVERY_FAILED');
    } finally {
      emailService.sendVerificationOtp = originalSend;
    }
  });

  test('10g. Idempotent registration enforces 60-second cooldown', async () => {
    const email = `idempotent.reg.${Date.now()}@linktest.io`;
    // Initial registration
    const firstReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Idempotent User',
        email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(firstReg.status, 201);

    // Immediate second registration with same email
    const secondReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Idempotent User Updated',
        email,
        password: 'NewPassword123!'
      })
    });
    assert.strictEqual(secondReg.status, 429);
    const secondBody = await secondReg.json();
    assert.strictEqual(secondBody.error.code, 'RESEND_COOLDOWN');
    assert.ok(secondBody.error.details?.cooldown_seconds > 0);

    // After cooldown has passed, idempotent registration succeeds
    const user = await userRepository.findByEmail(email);
    await tokenRepository.setTokenLastSentAtForTest(user.id, new Date(Date.now() - 120 * 1000).toISOString());

    const thirdReg = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Idempotent User Allowed',
        email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(thirdReg.status, 201);
  });

  test('10h. Full OTP verification attempt lockout lifecycle (Manual steps A through J)', async () => {
    const email = `lifecycle.${Date.now()}@linktest.io`;
    const regRes = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        full_name: 'Lifecycle Student',
        email,
        password: 'Password123!'
      })
    });
    assert.strictEqual(regRes.status, 201);
    const user = await userRepository.findByEmail(email);

    // A. First resend allowed after cooldown
    await tokenRepository.setTokenLastSentAtForTest(user.id, new Date(Date.now() - 120 * 1000).toISOString());
    const resendA = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    assert.strictEqual(resendA.status, 200);
    const otpHolderA = emailService.getLastSentEmail().otp;
    assert.ok(otpHolderA);

    // B. Immediate second resend -> 429 RESEND_COOLDOWN
    const resendB = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    assert.strictEqual(resendB.status, 429);
    const bodyB = await resendB.json();
    assert.strictEqual(bodyB.error.code, 'RESEND_COOLDOWN');

    // C. After cooldown -> new OTP allowed and attempts reset
    await tokenRepository.setTokenLastSentAtForTest(user.id, new Date(Date.now() - 120 * 1000).toISOString());
    const resendC = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    assert.strictEqual(resendC.status, 200);
    const activeOtp = emailService.getLastSentEmail().otp;
    const tokenC = await tokenRepository.findByUserId(user.id);
    assert.strictEqual(tokenC.attempts, 0, 'Attempts counter must be 0 after fresh OTP issuance');

    // D. Wrong OTP #1 -> rejected
    const attempt1 = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000' })
    });
    assert.strictEqual(attempt1.status, 400);
    const body1 = await attempt1.json();
    assert.strictEqual(body1.error.code, 'INVALID_OTP');
    assert.ok(body1.error.message.includes('4 attempt(s) remaining'));

    // E. Wrong OTP #2 -> rejected
    const attempt2 = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000' })
    });
    assert.strictEqual(attempt2.status, 400);
    assert.strictEqual((await attempt2.json()).error.code, 'INVALID_OTP');

    // F. Wrong OTP #3 -> rejected
    const attempt3 = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000' })
    });
    assert.strictEqual(attempt3.status, 400);
    assert.strictEqual((await attempt3.json()).error.code, 'INVALID_OTP');

    // G. Wrong OTP #4 -> rejected
    const attempt4 = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000' })
    });
    assert.strictEqual(attempt4.status, 400);
    const body4 = await attempt4.json();
    assert.strictEqual(body4.error.code, 'INVALID_OTP');
    assert.ok(body4.error.message.includes('1 attempt(s) remaining'));

    // H. Wrong OTP #5 -> 429 MAX_ATTEMPTS_EXCEEDED and OTP invalidated
    const attempt5 = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: '000000' })
    });
    assert.strictEqual(attempt5.status, 429);
    const body5 = await attempt5.json();
    assert.strictEqual(body5.error.code, 'MAX_ATTEMPTS_EXCEEDED');

    // Verify OTP token is invalidated in database
    const lockedToken = await tokenRepository.findByUserId(user.id);
    assert.strictEqual(lockedToken.token_hash, 'INVALIDATED');
    assert.ok(lockedToken.attempts >= 5);

    // Verify security log recorded
    const logsRes = await securityLogRepository.getLogs({ search: email, limit: 10 });
    const lockoutLog = logsRes.logs.find(l => l.event_type === 'MAX_ATTEMPTS_EXCEEDED');
    assert.ok(lockoutLog, 'A detailed MAX_ATTEMPTS_EXCEEDED security audit log must be recorded');

    // I. Correct old OTP after lock -> rejected
    const attemptOldValid = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: activeOtp })
    });
    assert.strictEqual(attemptOldValid.status, 429);
    const bodyOldValid = await attemptOldValid.json();
    assert.strictEqual(bodyOldValid.error.code, 'MAX_ATTEMPTS_EXCEEDED');

    // J. New OTP after allowed resend -> works
    await tokenRepository.setTokenLastSentAtForTest(user.id, new Date(Date.now() - 120 * 1000).toISOString());
    const resendJ = await fetch(`${baseUrl}/api/auth/resend-verification`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    assert.strictEqual(resendJ.status, 200);

    const freshOtp = emailService.getLastSentEmail().otp;
    assert.ok(freshOtp);

    const verifySuccess = await fetch(`${baseUrl}/api/auth/verify-email`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp: freshOtp })
    });
    assert.strictEqual(verifySuccess.status, 200);
    const successBody = await verifySuccess.json();
    assert.strictEqual(successBody.success, true);
    assert.strictEqual(successBody.data.user.email_verified, true);
    assert.ok(successBody.data.token);
  });

  test('11. Seeded Admin can log in successfully', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: process.env.ADMIN_EMAIL || 'admin@linktest.io',
        password: process.env.ADMIN_PASSWORD || 'LinkTest#ProdAdmin2026!'
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.user.role, 'ADMIN');
    adminToken = body.data.token;
  });

  test('12. Student cannot access ADMIN routes (Role Protection)', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.strictEqual(res.status, 403);
    const body = await res.json();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.error.code, 'FORBIDDEN');
  });

  test('13. Admin can access ADMIN routes', async () => {
    const res = await fetch(`${baseUrl}/api/admin/dashboard`, {
      headers: { Authorization: `Bearer ${adminToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.stats.course_count >= 5);
  });

  test('14. Course Catalogue returns published courses', async () => {
    const res = await fetch(`${baseUrl}/api/courses`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.courses.length >= 5);
  });

  test('15. Quiz Question Sanitization — Answers NEVER exposed in taker endpoint', async () => {
    const res = await fetch(`${baseUrl}/api/quizzes/quiz-web-dev-01`, {
      headers: { Authorization: `Bearer ${studentToken}` }
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    const questions = body.data.quiz.questions;
    assert.ok(questions.length > 0);

    for (const q of questions) {
      assert.strictEqual(q.correct_option_index, undefined, 'correct_option_index leaked before submission!');
      assert.strictEqual(q.explanation, undefined, 'explanation leaked before submission!');
    }
  });

  test('16. Quiz Submission evaluates on server and calculates score', async () => {
    const res = await fetch(`${baseUrl}/api/quizzes/quiz-web-dev-01/attempts`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        answers: [
          { question_id: 'q-wd-1', selected_option_index: 2 }, // Correct (PUT)
          { question_id: 'q-wd-2', selected_option_index: 1 }, // Correct (mutation)
          { question_id: 'q-wd-3', selected_option_index: 1 }, // Correct (bcrypt)
          { question_id: 'q-wd-4', selected_option_index: 1 }, // Correct (parameterized)
          { question_id: 'q-wd-5', selected_option_index: 1 }  // Correct (Bearer)
        ]
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.score, 5);
    assert.strictEqual(body.data.total_questions, 5);
    assert.strictEqual(body.data.percentage, 100);
    assert.strictEqual(body.data.passed, true);
    assert.ok(body.data.results.length === 5);
  });

  test('17. Lesson Progress persistence updates course percentage', async () => {
    const res = await fetch(`${baseUrl}/api/progress`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${studentToken}`
      },
      body: JSON.stringify({
        lesson_id: 'lesson-wd-01',
        completed: true
      })
    });

    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.strictEqual(body.data.completed, true);
    assert.ok(body.data.course_progress_percentage > 0);
  });

  test('18. AI Status endpoint returns diagnostics', async () => {
    const res = await fetch(`${baseUrl}/api/ai/status`);
    assert.strictEqual(res.status, 200);
    const body = await res.json();
    assert.strictEqual(body.success, true);
    assert.ok(body.data.model);
    assert.ok(body.data.status_message);
  });
});
