import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;
let customTransporterInjected = false;
let lastSentEmail = null; // Exposed for test assertions

function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export function categorizeEmailError(err) {
  if (!err) {
    const error = new Error('Email delivery service is currently unavailable.');
    error.statusCode = 503;
    error.code = 'SMTP_UNAVAILABLE';
    return error;
  }

  const msg = String(err.message || '');
  const code = String(err.code || '');

  if (
    code === 'ETIMEDOUT' ||
    code === 'ESOCKET' ||
    code === 'ESOCKETTIMEDOUT' ||
    msg.toLowerCase().includes('timeout') ||
    msg.toLowerCase().includes('timed out')
  ) {
    const error = new Error('Email delivery timed out. Please try again.');
    error.statusCode = 504;
    error.code = 'EMAIL_TIMEOUT';
    return error;
  }

  if (
    code === 'EAUTH' ||
    code === '535' ||
    msg.includes('535') ||
    msg.toLowerCase().includes('invalid credentials') ||
    msg.toLowerCase().includes('bad auth') ||
    msg.toLowerCase().includes('username and password not accepted')
  ) {
    const error = new Error('Email service authentication failed. Please contact support.');
    error.statusCode = 503;
    error.code = 'SMTP_UNAVAILABLE';
    return error;
  }

  if (
    code === 'ECONNREFUSED' ||
    code === 'ENOTFOUND' ||
    code === 'ECONNRESET' ||
    code === 'EHOSTUNREACH' ||
    msg.toLowerCase().includes('connection refused')
  ) {
    const error = new Error('Email delivery service is currently unreachable. Please try again later.');
    error.statusCode = 503;
    error.code = 'SMTP_UNAVAILABLE';
    return error;
  }

  const error = new Error('Email delivery service is currently unavailable. Please try again later.');
  error.statusCode = err.statusCode || 503;
  error.code = 'SMTP_UNAVAILABLE';
  return error;
}

export function setTransporter(customTransporter) {
  transporter = customTransporter;
  customTransporterInjected = customTransporter !== null;
}

export function getTransporter() {
  return transporter;
}

export function initTransporter() {
  if (config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') {
    transporter = null;
    return null;
  }

  if (!config.smtp.user || !config.smtp.pass) {
    if (config.nodeEnv === 'production') {
      console.error('[LinkTest Email] FATAL: SMTP credentials not set in production.');
    } else {
      console.info('[LinkTest Email] Notice: Gmail SMTP credentials not configured. Local fallback active.');
    }
    transporter = null;
    return null;
  }

  if (transporter) {
    return transporter;
  }

  try {
    transporter = nodemailer.createTransport({
      host: config.smtp.host,
      port: config.smtp.port,
      secure: config.smtp.secure, // false for 587 (STARTTLS)
      requireTLS: true,           // Enforce STARTTLS
      auth: {
        user: config.smtp.user,
        pass: config.smtp.pass
      },
      tls: {
        rejectUnauthorized: true
      },
      connectionTimeout: 15000, // 15s connection timeout
      greetingTimeout: 15000,   // 15s greeting timeout
      socketTimeout: 20000      // 20s socket inactivity timeout
    });
    console.log(`[LinkTest Email] Gmail SMTP transport configured for ${config.smtp.user} (${config.smtp.host}:${config.smtp.port})`);
  } catch (err) {
    console.error('[LinkTest Email] Failed to initialize nodemailer transporter pool:', err.message);
    transporter = null;
  }
  return transporter;
}

// Build branded HTML email template
function buildVerificationHtml(fullName, otp) {
  const safeName = escapeHtml(fullName || 'Learner');
  const safeOtp = escapeHtml(otp);

  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Verify your email address — LinkTest</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; background-color: #F8FAFC; color: #0F172A; line-height: 1.5;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background-color: #F8FAFC; padding: 40px 15px;">
    <tr>
      <td align="center">
        <table role="presentation" width="100%" style="max-width: 560px; background-color: #FFFFFF; border: 1px solid #E2E8F0; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 6px -1px rgba(15, 23, 42, 0.05);">
          <!-- Header -->
          <tr>
            <td style="background-color: #0A192F; padding: 28px 36px; text-align: left;">
              <table role="presentation" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="font-size: 24px; font-weight: 800; color: #FFFFFF; font-family: 'Outfit', sans-serif; letter-spacing: -0.5px;">
                    Link<span style="color: #F97316;">Test</span>
                  </td>
                </tr>
                <tr>
                  <td style="font-size: 12px; color: #94A3B8; text-transform: uppercase; letter-spacing: 1px; padding-top: 4px;">
                    AI Learning Platform
                  </td>
                </tr>
              </table>
            </td>
          </tr>

          <!-- Main Content -->
          <tr>
            <td style="padding: 36px 36px 28px 36px;">
              <h1 style="margin: 0 0 16px 0; font-size: 20px; font-weight: 700; color: #0F172A;">
                Verify Your Email Address
              </h1>
              <p style="margin: 0 0 20px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Hello <strong>${safeName}</strong>,
              </p>
              <p style="margin: 0 0 24px 0; font-size: 15px; color: #475569; line-height: 1.6;">
                Welcome to LinkTest! To complete your registration and activate your student account, please enter the following 6-digit verification code:
              </p>

              <!-- OTP Callout Box -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin: 24px 0 28px 0;">
                <tr>
                  <td align="center" style="background-color: #FFF7ED; border: 2px dashed #F97316; border-radius: 10px; padding: 20px 15px;">
                    <span style="font-size: 11px; font-weight: 700; color: #C2410C; text-transform: uppercase; letter-spacing: 1.5px; display: block; margin-bottom: 8px;">
                      Verification Code
                    </span>
                    <span style="font-family: 'Courier New', Courier, monospace, sans-serif; font-size: 36px; font-weight: 800; letter-spacing: 8px; color: #EA580C; display: block;">
                      ${safeOtp}
                    </span>
                  </td>
                </tr>
              </table>

              <!-- Expiration Warning -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="margin-bottom: 24px; background-color: #F1F5F9; border-radius: 8px; padding: 12px 16px;">
                <tr>
                  <td style="font-size: 13px; color: #334155;">
                    ⏱️ <strong>This code will expire in 10 minutes.</strong> For security purposes, never share this code with anyone. LinkTest staff will never ask for your code.
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 13px; color: #64748B; line-height: 1.5;">
                If you did not request this account or if you believe this message was sent in error, please disregard it. No account will be activated without this verification code.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="background-color: #F8FAFC; border-top: 1px solid #E2E8F0; padding: 20px 36px; text-align: center;">
              <p style="margin: 0 0 6px 0; font-size: 12px; color: #94A3B8;">
                LinkTest • Learn Smarter. Practice Better. Test Your Progress.
              </p>
              <p style="margin: 0; font-size: 11px; color: #CBD5E1;">
                Designed for Indian colleges, engineering institutes, and online learning communities.
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
}

// Build plain-text email alternative
function buildVerificationText(fullName, otp) {
  return `LinkTest — AI Learning Platform
=============================================
Verify Your Email Address

Hello ${fullName || 'Learner'},

Welcome to LinkTest! To complete your registration and activate your student account, please enter the following 6-digit verification code:

Verification Code: ${otp}

⏱️ This code will expire in 10 minutes.
For security, do not share this code with anyone.

If you did not request this registration, you can safely ignore this email.

—
LinkTest | Learn Smarter. Practice Better. Test Your Progress.`;
}

export const emailService = {
  async sendVerificationOtp({ email, fullName, otp }) {
    const subject = 'Verify your email address — LinkTest';
    const html = buildVerificationHtml(fullName, otp);
    const text = buildVerificationText(fullName, otp);

    const emailPayload = {
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: email,
      subject,
      text,
      html
    };

    // Ensure transporter is initialized if credentials exist and not in mock/test mode
    if (!transporter && config.smtp?.user && config.smtp?.pass && config.nodeEnv !== 'test' && process.env.MOCK_EMAIL !== 'true') {
      initTransporter();
    }

    // In-memory capture when mock/test mode is active without a custom injected transporter
    if ((config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') && !customTransporterInjected) {
      lastSentEmail = { ...emailPayload, otp, sentAt: new Date() };
      return { success: true, sent: true, mocked: true, messageId: 'test-mock-id' };
    }

    // 1. Transporter active (Real Gmail SMTP with connection pooling & timeouts, or injected mock/test transporter)
    if (transporter) {
      let timer;
      try {
        const timeoutMs = config.smtp?.timeoutMs || 15000;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            const timeoutErr = new Error(`SMTP connection timed out after ${timeoutMs}ms`);
            timeoutErr.code = 'ETIMEDOUT';
            reject(timeoutErr);
          }, timeoutMs);
        });

        const sendMailPromise = transporter.sendMail(emailPayload);
        // Prevent unhandled promise rejection if provider fails/rejects after timeout fires
        sendMailPromise.catch(() => {});

        const info = await Promise.race([
          sendMailPromise,
          timeoutPromise
        ]);
        clearTimeout(timer);

        if (config.nodeEnv !== 'production') {
          console.log(`[LinkTest Email] Verification OTP successfully sent to ${email} (MessageId: ${info.messageId})`);
        } else {
          console.log(`[LinkTest Email] Verification email dispatched to ${email}`);
        }
        lastSentEmail = { ...emailPayload, otp, sentAt: new Date() };
        return { success: true, sent: true, messageId: info.messageId };
      } catch (rawErr) {
        clearTimeout(timer);
        if (!customTransporterInjected) {
          transporter = null;
        }
        console.error(`[LinkTest Email] Failed sending verification email to ${email}:`, rawErr.code || rawErr.message);
        throw categorizeEmailError(rawErr);
      }
    }

    // 2. Test Mode (In-memory capture when no transporter is explicitly configured/injected)
    if (config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') {
      lastSentEmail = { ...emailPayload, otp, sentAt: new Date() };
      return { success: true, sent: true, mocked: true, messageId: 'test-mock-id' };
    }

    // 3. Development Fallback (Log OTP to console only in dev/test, NEVER in production)
    if (config.nodeEnv === 'production') {
      const err = new Error('Email delivery service is currently unavailable.');
      err.statusCode = 503;
      err.code = 'SMTP_UNAVAILABLE';
      throw err;
    }

    console.log('================================================================');
    console.log('  [LinkTest Email Simulator] VERIFICATION CODE SENT            ');
    console.log('----------------------------------------------------------------');
    console.log(`  To:       ${email} (${fullName})`);
    console.log(`  Code:     ${otp}`);
    console.log(`  Expires:  In 10 minutes`);
    console.log('================================================================');

    lastSentEmail = { ...emailPayload, otp, sentAt: new Date() };
    return { success: true, sent: true, simulated: true };
  },

  getLastSentEmail() {
    return lastSentEmail;
  },

  clearLastSentEmail() {
    lastSentEmail = null;
  },

  async sendTeacherInvitation({ email, fullName, inviterName, inviteUrl, expiresAt }) {
    const subject = `You're invited to join LinkTest as a Teacher`;
    const expireStr = new Date(expiresAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#F8FAFC;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #E2E8F0">
<div style="text-align:center;margin-bottom:24px"><span style="font-size:24px;font-weight:800;color:#0A192F">Link<span style="color:#F97316">Test</span></span></div>
<h2 style="color:#0F172A;margin-bottom:8px">Welcome to LinkTest!</h2>
<p style="color:#475569">Hi ${escapeHtml(fullName)},</p>
<p style="color:#475569">${escapeHtml(inviterName)} has invited you to join <strong>LinkTest</strong> as a Teacher. Click the button below to set up your account.</p>
<div style="text-align:center;margin:32px 0">
<a href="${inviteUrl}" style="background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Accept Invitation</a>
</div>
<p style="color:#64748B;font-size:13px">This invitation expires on <strong>${expireStr}</strong>. If you did not expect this, you can safely ignore it.</p>
<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
<p style="color:#94A3B8;font-size:12px;text-align:center">LinkTest | Learn Smarter. Practice Better. Test Your Progress.</p>
</div></body></html>`;
    const text = `You're invited to join LinkTest as a Teacher!\n\nHi ${fullName},\n\n${inviterName} has invited you. Click below to accept:\n${inviteUrl}\n\nExpires: ${expireStr}\n\n— LinkTest`;

    if ((config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') && !customTransporterInjected) {
      lastSentEmail = { from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`, to: email, subject, html, text, sentAt: new Date() };
      return { success: true, mocked: true };
    }

    const payload = { from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`, to: email, subject, html, text };

    if (transporter) {
      let timer;
      try {
        const timeoutMs = config.smtp?.timeoutMs || 15000;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            const timeoutErr = new Error(`SMTP connection timed out after ${timeoutMs}ms`);
            timeoutErr.code = 'ETIMEDOUT';
            reject(timeoutErr);
          }, timeoutMs);
        });
        const sendMailPromise = transporter.sendMail(payload);
        sendMailPromise.catch(() => {});
        const info = await Promise.race([
          sendMailPromise,
          timeoutPromise
        ]);
        clearTimeout(timer);
        console.log(`[LinkTest Email] Teacher invitation sent to ${email}`);
        lastSentEmail = { ...payload, sentAt: new Date() };
        return { success: true, sent: true, messageId: info.messageId };
      } catch (err) {
        clearTimeout(timer);
        throw categorizeEmailError(err);
      }
    }

    if (config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') {
      lastSentEmail = { ...payload, sentAt: new Date() };
      return { success: true, mocked: true };
    }

    if (config.nodeEnv === 'production') {
      const err = new Error('Teacher invitation email delivery is unavailable.');
      err.statusCode = 503;
      err.code = 'SMTP_UNAVAILABLE';
      throw err;
    }
    console.log('================================================================');
    console.log('  [LinkTest Email Simulator] TEACHER INVITATION SENT');
    console.log('----------------------------------------------------------------');
    console.log(`  To:         ${email} (${fullName})`);
    console.log(`  Invite URL: ${inviteUrl}`);
    console.log(`  Expires:    ${expireStr}`);
    console.log('================================================================');
    lastSentEmail = { ...payload, sentAt: new Date() };
    return { success: true, simulated: true };
  },

  async sendPasswordReset({ email, fullName, resetUrl, expiresAt }) {
    const subject = 'Reset your LinkTest password';
    const expireStr = new Date(expiresAt).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
    const html = `<!DOCTYPE html><html><body style="font-family:sans-serif;background:#F8FAFC;padding:20px">
<div style="max-width:560px;margin:0 auto;background:#fff;border-radius:12px;padding:32px;border:1px solid #E2E8F0">
<div style="text-align:center;margin-bottom:24px"><span style="font-size:24px;font-weight:800;color:#0A192F">Link<span style="color:#F97316">Test</span></span></div>
<h2 style="color:#0F172A">Reset Your Password</h2>
<p style="color:#475569">Hi ${escapeHtml(fullName)},</p>
<p style="color:#475569">You requested to reset your password. Click below to set a new one.</p>
<div style="text-align:center;margin:32px 0">
<a href="${resetUrl}" style="background:linear-gradient(135deg,#F97316,#EA580C);color:#fff;padding:14px 32px;border-radius:10px;text-decoration:none;font-weight:700;font-size:16px">Reset Password</a>
</div>
<p style="color:#64748B;font-size:13px">This link expires at <strong>${expireStr}</strong>. If you didn't request a reset, ignore this email.</p>
<hr style="border:none;border-top:1px solid #E2E8F0;margin:24px 0">
<p style="color:#94A3B8;font-size:12px;text-align:center">LinkTest | Learn Smarter. Practice Better. Test Your Progress.</p>
</div></body></html>`;
    const text = `Reset your LinkTest password\n\nHi ${fullName},\n\nVisit: ${resetUrl}\n\nExpires at: ${expireStr}\n\n— LinkTest`;

    if ((config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') && !customTransporterInjected) {
      lastSentEmail = { from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`, to: email, subject, html, text, sentAt: new Date() };
      return { success: true, mocked: true };
    }

    const payload = { from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`, to: email, subject, html, text };

    if (transporter) {
      let timer;
      try {
        const timeoutMs = config.smtp?.timeoutMs || 15000;
        const timeoutPromise = new Promise((_, reject) => {
          timer = setTimeout(() => {
            const timeoutErr = new Error(`SMTP connection timed out after ${timeoutMs}ms`);
            timeoutErr.code = 'ETIMEDOUT';
            reject(timeoutErr);
          }, timeoutMs);
        });
        const sendMailPromise = transporter.sendMail(payload);
        sendMailPromise.catch(() => {});
        const info = await Promise.race([
          sendMailPromise,
          timeoutPromise
        ]);
        clearTimeout(timer);
        lastSentEmail = { ...payload, sentAt: new Date() };
        return { success: true, sent: true, messageId: info.messageId };
      } catch (err) {
        clearTimeout(timer);
        throw categorizeEmailError(err);
      }
    }

    if (config.nodeEnv === 'test' || process.env.MOCK_EMAIL === 'true') {
      lastSentEmail = { ...payload, sentAt: new Date() };
      return { success: true, mocked: true };
    }
    if (config.nodeEnv === 'production') {
      const err = new Error('Password reset email cannot be sent because SMTP is not configured.');
      err.statusCode = 503;
      err.code = 'SMTP_UNAVAILABLE';
      throw err;
    }
    console.log('================================================================');
    console.log('  [LinkTest Email Simulator] PASSWORD RESET LINK');
    console.log('----------------------------------------------------------------');
    console.log(`  To:         ${email} (${fullName})`);
    console.log(`  Reset URL:  ${resetUrl}`);
    console.log('================================================================');
    lastSentEmail = { ...payload, sentAt: new Date() };
    return { success: true, simulated: true };
  }
};

// Initialize transporter on module load
initTransporter();
