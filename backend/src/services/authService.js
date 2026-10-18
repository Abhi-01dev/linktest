import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';
import { OAuth2Client } from 'google-auth-library';
import { config } from '../config/env.js';
import { userRepository } from '../repositories/userRepository.js';
import { tokenRepository } from '../repositories/tokenRepository.js';
import { invitationRepository, passwordResetRepository } from '../repositories/invitationRepository.js';
import { generateOtp, hashOtp, verifyOtpHash } from '../utils/cryptoOtp.js';
import { emailService } from './emailService.js';
import { logAudit } from '../repositories/auditRepository.js';
import { securityLogRepository } from '../repositories/securityLogRepository.js';

let googleOAuthClient = new OAuth2Client(config.google?.clientId || '');

export function setGoogleOAuthClient(client) {
  googleOAuthClient = client;
}

export function getGoogleOAuthClient() {
  return googleOAuthClient;
}

function generateSecureToken() {
  return crypto.randomBytes(32).toString('hex');
}

function hashToken(token) {
  return crypto.createHash('sha256').update(token).digest('hex');
}

function issueJwt(user) {
  return jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    config.jwtSecret,
    { expiresIn: config.jwtExpiresIn }
  );
}

// 10-minute OTP TTL as required by Issue #1
const OTP_TTL_MS = 10 * 60 * 1000;

export const authService = {
  async register({ full_name, email, password, ipAddress = null, userAgent = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);

    let user;
    if (existing) {
      if (existing.email_verified) {
        const err = new Error('An account with this email address already exists.');
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }
      // Block TEACHER or ADMIN from re-registering through public route
      if (existing.role !== 'STUDENT') {
        const err = new Error('This email is associated with a privileged account. Use the invitation link to access your account.');
        err.statusCode = 409;
        err.code = 'CONFLICT';
        throw err;
      }

      // Check 60-second cooldown on idempotent re-registration to prevent spam bypass
      const existingToken = await tokenRepository.findByUserId(existing.id);
      if (existingToken && existingToken.last_sent_at) {
        const elapsedMs = Date.now() - new Date(existingToken.last_sent_at).getTime();
        if (elapsedMs < 60000) {
          const remainingSeconds = Math.ceil((60000 - elapsedMs) / 1000);
          const err = new Error(`Please wait ${remainingSeconds} seconds before requesting a new code.`);
          err.statusCode = 429;
          err.code = 'RESEND_COOLDOWN';
          err.details = { cooldown_seconds: remainingSeconds };
          throw err;
        }
      }

      const passwordHash = await bcrypt.hash(password, 10);
      user = await userRepository.updateUnverifiedUser(existing.id, {
        fullName: full_name,
        passwordHash
      });
    } else {
      const passwordHash = await bcrypt.hash(password, 10);
      user = await userRepository.create({
        fullName: full_name,
        email: normalizedEmail,
        passwordHash,
        role: 'STUDENT', // Public registration NEVER grants ADMIN or TEACHER
        emailVerified: false
      });
    }

    const otp = generateOtp();
    const tokenHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    if (existing) {
      await tokenRepository.createOrUpdateTokenWithCooldown({
        userId: user.id,
        tokenHash,
        expiresAt,
        cooldownMs: 60000
      });
    } else {
      await tokenRepository.createOrUpdateToken({
        userId: user.id,
        tokenHash,
        expiresAt
      });
    }

    let emailSent = true;
    try {
      await emailService.sendVerificationOtp({
        email: user.email,
        fullName: user.full_name,
        otp
      });
    } catch (err) {
      console.error('[Registration] Email sending error:', err.message);
      emailSent = false;
    }

    return {
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        role: user.role,
        email_verified: false,
        created_at: user.created_at
      },
      email_sent: emailSent,
      message: emailSent
        ? 'Account created. Please verify your email with the 6-digit code sent.'
        : 'Account created, but email delivery failed. You can request a new verification code on the verification page.'
    };
  },

  async verifyEmail({ email, otp, ipAddress = null, userAgent = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user) {
      const err = new Error('Invalid or expired verification request.');
      err.statusCode = 400;
      err.code = 'USER_NOT_FOUND';
      throw err;
    }

    if (user.email_verified) {
      const err = new Error('Email address is already verified. Please log in.');
      err.statusCode = 400;
      err.code = 'ALREADY_VERIFIED';
      throw err;
    }

    const tokenRecord = await tokenRepository.findByUserId(user.id);
    if (!tokenRecord) {
      const err = new Error('No active verification code found. Please request a new code.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    // 1. Check max attempt lockout / invalidation FIRST
    if (tokenRecord.attempts >= 5 || tokenRecord.token_hash === 'INVALIDATED') {
      await securityLogRepository.logEvent({
        eventType: 'MAX_ATTEMPTS_EXCEEDED',
        severity: 'WARNING',
        userId: user.id,
        userEmail: user.email,
        ipAddress,
        userAgent,
        details: `Blocked verification attempt on locked account for user ${user.email}. Maximum attempts (5) already exceeded.`,
        metadata: {
          userId: user.id,
          email: user.email,
          attempts: tokenRecord.attempts
        }
      }).catch(() => {});

      const err = new Error('Too many incorrect attempts. Please request a new verification code.');
      err.statusCode = 429;
      err.code = 'MAX_ATTEMPTS_EXCEEDED';
      throw err;
    }

    // 2. Check expiration
    if (new Date() > new Date(tokenRecord.expires_at)) {
      const err = new Error('Verification code has expired. Please request a new code.');
      err.statusCode = 400;
      err.code = 'OTP_EXPIRED';
      throw err;
    }

    // 3. Verify OTP hash
    const isValid = verifyOtpHash(otp, tokenRecord.token_hash);
    if (!isValid) {
      const newAttempts = await tokenRepository.incrementAttempts(user.id);
      const remainingAttempts = Math.max(0, 5 - newAttempts);

      if (newAttempts >= 5) {
        await tokenRepository.invalidateToken(user.id);

        await securityLogRepository.logEvent({
          eventType: 'MAX_ATTEMPTS_EXCEEDED',
          severity: 'HIGH',
          userId: user.id,
          userEmail: user.email,
          ipAddress,
          userAgent,
          details: `Maximum OTP verification attempts exceeded (5 failed attempts). Active OTP invalidated and verification locked for user ${user.email}.`,
          metadata: {
            userId: user.id,
            email: user.email,
            attempts: newAttempts,
            maxAttempts: 5,
            action: 'OTP_INVALIDATED'
          }
        }).catch(() => {});

        const err = new Error('Too many incorrect attempts. Please request a new verification code.');
        err.statusCode = 429;
        err.code = 'MAX_ATTEMPTS_EXCEEDED';
        throw err;
      }

      const err = new Error(
        `Incorrect verification code. ${remainingAttempts} attempt(s) remaining.`
      );
      err.statusCode = 400;
      err.code = 'INVALID_OTP';
      throw err;
    }

    const verifiedUser = await tokenRepository.consumeTokenAndVerifyUser(user.id);
    if (!verifiedUser) {
      const err = new Error('Verification code has already been consumed or is no longer valid.');
      err.statusCode = 400;
      err.code = 'OTP_ALREADY_USED';
      throw err;
    }

    const token = issueJwt(verifiedUser);

    return {
      user: verifiedUser,
      token,
      message: 'Email successfully verified. Welcome to LinkTest!'
    };
  },

  async resendVerification({ email, ipAddress = null, userAgent = null }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    if (!user || user.email_verified) {
      return {
        success: true,
        message: 'If an unverified account exists for this email, a new verification code has been sent.'
      };
    }

    const otp = generateOtp();
    const tokenHash = hashOtp(otp);
    const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

    try {
      await tokenRepository.createOrUpdateTokenWithCooldown({
        userId: user.id,
        tokenHash,
        expiresAt,
        cooldownMs: 60000
      });
    } catch (err) {
      if (err.code === 'RESEND_COOLDOWN') {
        await securityLogRepository.logEvent({
          eventType: 'RESEND_COOLDOWN_BLOCKED',
          severity: 'WARNING',
          userId: user.id,
          userEmail: user.email,
          ipAddress,
          userAgent,
          details: `Verification OTP resend requested before cooldown elapsed for ${user.email}. Remaining cooldown: ${err.details?.cooldown_seconds}s.`,
          metadata: { userId: user.id, email: user.email, cooldown_seconds: err.details?.cooldown_seconds }
        }).catch(() => {});
      }
      throw err;
    }

    try {
      await emailService.sendVerificationOtp({ email: user.email, fullName: user.full_name, otp });
    } catch (err) {
      console.error('[Resend] Email delivery error:', err.message);
      const deliveryErr = new Error(`Failed to deliver verification email: ${err.message}`);
      deliveryErr.statusCode = 502;
      deliveryErr.code = 'EMAIL_DELIVERY_FAILED';
      throw deliveryErr;
    }

    return { success: true, message: 'A new verification code has been sent to your email.' };
  },

  async login({ email, password }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);
    if (!user) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    if (!user.password_hash) {
      const err = new Error(
        user.auth_provider === 'google'
          ? 'This account was registered using Google Sign-In. Please click "Continue with Google" or reset your password to set a local password.'
          : 'No password has been set for this account. Please use Google Sign-In or reset your password.'
      );
      err.statusCode = 400;
      err.code = 'OAUTH_ACCOUNT_PASSWORD_NOT_SET';
      throw err;
    }

    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      const err = new Error('Invalid email or password.');
      err.statusCode = 401;
      err.code = 'UNAUTHORIZED';
      throw err;
    }

    if (!user.email_verified) {
      const err = new Error('Please verify your email before logging in.');
      err.statusCode = 403;
      err.code = 'EMAIL_NOT_VERIFIED';
      err.details = { email: user.email, unverified: true };
      throw err;
    }

    if (user.status === 'suspended') {
      const err = new Error('Your account has been suspended. Please contact an administrator.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_SUSPENDED';
      throw err;
    }

    if (user.status === 'deactivated') {
      const err = new Error('This account has been deactivated.');
      err.statusCode = 403;
      err.code = 'ACCOUNT_DEACTIVATED';
      throw err;
    }

    await userRepository.recordLogin(user.id);

    const token = issueJwt(user);
    const safeUser = {
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      role: user.role,
      status: user.status,
      email_verified: user.email_verified,
      email_verified_at: user.email_verified_at,
      created_at: user.created_at
    };

    return { user: safeUser, token };
  },

  // ============================================================
  // TEACHER INVITATION FLOW
  // ============================================================
  async inviteTeacher({ email, fullName, invitedBy, inviterName }) {
    const normalizedEmail = email.trim().toLowerCase();
    const existing = await userRepository.findByEmail(normalizedEmail);

    if (existing) {
      const err = new Error('A user with this email address already exists.');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    // Generate secure invitation token
    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(); // 7 days

    await invitationRepository.create({
      email: normalizedEmail,
      fullName,
      invitedBy,
      tokenHash,
      expiresAt
    });

    const inviteUrl = `${config.frontendUrl}/accept-invite?token=${rawToken}`;

    let emailSent = true;
    try {
      await emailService.sendTeacherInvitation({
        email: normalizedEmail,
        fullName,
        inviterName,
        inviteUrl,
        expiresAt
      });
    } catch (err) {
      console.error('[Invite] Email delivery error:', err.message);
      emailSent = false;
    }

    await logAudit({
      actorId: invitedBy,
      actorEmail: inviterName,
      action: 'TEACHER_INVITED',
      resourceType: 'invitation',
      resourceId: normalizedEmail,
      summary: `Teacher invitation sent to ${normalizedEmail} (${fullName})`
    });

    return {
      email: normalizedEmail,
      full_name: fullName,
      email_sent: emailSent,
      // Only return the token in dev mode for testing; production should never expose it
      ...(config.nodeEnv === 'development' ? { dev_invite_url: inviteUrl } : {})
    };
  },

  async acceptTeacherInvite({ token, password }) {
    const tokenHash = hashToken(token);
    const invitation = await invitationRepository.findByTokenHash(tokenHash);

    if (!invitation) {
      const err = new Error('Invalid or expired invitation link.');
      err.statusCode = 400;
      err.code = 'INVALID_INVITATION';
      throw err;
    }

    if (invitation.accepted_at) {
      const err = new Error('This invitation has already been accepted.');
      err.statusCode = 400;
      err.code = 'INVITATION_USED';
      throw err;
    }

    if (new Date() > new Date(invitation.expires_at)) {
      const err = new Error('This invitation link has expired. Please contact your administrator for a new invitation.');
      err.statusCode = 400;
      err.code = 'INVITATION_EXPIRED';
      throw err;
    }

    // Check if user was already created (e.g., invitation re-sent)
    const existingUser = await userRepository.findByEmail(invitation.email);
    if (existingUser) {
      const err = new Error('An account with this email already exists.');
      err.statusCode = 409;
      err.code = 'CONFLICT';
      throw err;
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const newUser = await userRepository.create({
      fullName: invitation.full_name,
      email: invitation.email,
      passwordHash,
      role: 'TEACHER',
      emailVerified: true, // Invitation link validates email
      emailVerifiedAt: new Date().toISOString(),
      status: 'active'
    });

    await invitationRepository.markAccepted(invitation.id);

    await logAudit({
      actorId: newUser.id,
      actorEmail: newUser.email,
      action: 'TEACHER_INVITE_ACCEPTED',
      resourceType: 'user',
      resourceId: newUser.id,
      summary: `Teacher account activated for ${newUser.email}`
    });

    const jwtToken = issueJwt(newUser);
    return { user: newUser, token: jwtToken };
  },

  // ============================================================
  // PASSWORD RESET
  // ============================================================
  async forgotPassword({ email }) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await userRepository.findByEmail(normalizedEmail);

    // Always return generic response to prevent account enumeration
    if (!user || !user.email_verified) {
      return { message: 'If an account exists for this email, a password reset link has been sent.' };
    }

    const rawToken = generateSecureToken();
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await passwordResetRepository.create({ userId: user.id, tokenHash, expiresAt });

    const resetUrl = `${config.frontendUrl}/reset-password?token=${rawToken}`;

    try {
      await emailService.sendPasswordReset({ email: user.email, fullName: user.full_name, resetUrl, expiresAt });
    } catch (err) {
      console.error('[PasswordReset] Email delivery error:', err.message);
    }

    return {
      message: 'If an account exists for this email, a password reset link has been sent.',
      ...(config.nodeEnv === 'development' ? { dev_reset_url: resetUrl } : {})
    };
  },

  async resetPassword({ token, newPassword }) {
    const tokenHash = hashToken(token);
    const record = await passwordResetRepository.findByTokenHash(tokenHash);

    if (!record) {
      const err = new Error('Invalid or expired password reset link.');
      err.statusCode = 400;
      err.code = 'INVALID_RESET_TOKEN';
      throw err;
    }

    if (new Date() > new Date(record.expires_at)) {
      const err = new Error('This password reset link has expired. Please request a new one.');
      err.statusCode = 400;
      err.code = 'RESET_TOKEN_EXPIRED';
      throw err;
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(record.user_id, passwordHash);
    await passwordResetRepository.markUsed(record.id);

    return { message: 'Password has been reset successfully. Please log in with your new password.' };
  },

  async changePassword({ userId, currentPassword, newPassword }) {
    const user = await userRepository.findByEmail(
      (await userRepository.findById(userId))?.email
    );

    if (!user) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (user.password_hash) {
      const isValid = await bcrypt.compare(currentPassword, user.password_hash);
      if (!isValid) {
        const err = new Error('Current password is incorrect.');
        err.statusCode = 400;
        err.code = 'INVALID_PASSWORD';
        throw err;
      }
    }

    const passwordHash = await bcrypt.hash(newPassword, 10);
    await userRepository.updatePassword(userId, passwordHash);

    return { message: 'Password changed successfully.' };
  },

  /**
   * Cryptographically verifies a Google ID Token (JWT)
   * Validates signature, issuer, audience, expiration, and email claims
   */
  async verifyGoogleIdToken(idToken) {
    if (!idToken || typeof idToken !== 'string') {
      const err = new Error('Google credential token is required.');
      err.statusCode = 400;
      err.code = 'INVALID_CREDENTIAL';
      throw err;
    }

    try {
      const client = getGoogleOAuthClient();
      const ticket = await client.verifyIdToken({
        idToken,
        audience: config.google?.clientId || undefined
      });
      const payload = ticket.getPayload();

      if (!payload) {
        const err = new Error('Invalid token payload returned from Google Identity Services.');
        err.statusCode = 401;
        err.code = 'INVALID_CREDENTIAL';
        throw err;
      }

      // 1. Verify issuer
      const validIssuers = ['accounts.google.com', 'https://accounts.google.com'];
      if (!validIssuers.includes(payload.iss)) {
        const err = new Error('Invalid token issuer.');
        err.statusCode = 401;
        err.code = 'INVALID_ISSUER';
        throw err;
      }

      // 2. Verify audience if client ID is configured
      if (config.google?.clientId && payload.aud !== config.google.clientId) {
        const err = new Error('Token audience does not match configured Google Client ID.');
        err.statusCode = 401;
        err.code = 'AUDIENCE_MISMATCH';
        throw err;
      }

      // 3. Verify stable subject identifier (sub)
      if (!payload.sub) {
        const err = new Error('Missing Google user subject identifier (sub).');
        err.statusCode = 401;
        err.code = 'INVALID_SUBJECT';
        throw err;
      }

      // 4. Verify email existence and verified status
      if (!payload.email) {
        const err = new Error('Google credential must include an email address.');
        err.statusCode = 400;
        err.code = 'MISSING_EMAIL';
        throw err;
      }

      if (payload.email_verified === false) {
        const err = new Error('Google email address must be verified by Google to sign in.');
        err.statusCode = 403;
        err.code = 'GOOGLE_EMAIL_NOT_VERIFIED';
        throw err;
      }

      return payload;
    } catch (err) {
      if (err.statusCode) throw err;
      const verifyErr = new Error(`Google authentication failed: ${err.message}`);
      verifyErr.statusCode = 401;
      verifyErr.code = 'GOOGLE_AUTH_FAILED';
      throw verifyErr;
    }
  },

  /**
   * Completes Google Sign-In with automatic account linking or safe Student registration
   */
  async loginWithGoogle({ credential }) {
    const payload = await this.verifyGoogleIdToken(credential);
    const googleId = payload.sub;
    const normalizedEmail = payload.email.trim().toLowerCase();
    const fullName = payload.name || payload.given_name || 'LinkTest Student';
    const avatarUrl = payload.picture || null;

    // Step A: Check if an account already exists with this google_id
    let user = await userRepository.findByGoogleId(googleId);

    if (user) {
      if (user.status === 'suspended') {
        const err = new Error('Your account has been suspended. Please contact an administrator.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_SUSPENDED';
        throw err;
      }
      if (user.status === 'deactivated') {
        const err = new Error('This account has been deactivated.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_DEACTIVATED';
        throw err;
      }

      await userRepository.updateLastLogin(user.id);
      const safeUser = await userRepository.findById(user.id);
      const token = issueJwt(safeUser);

      await logAudit({
        user_id: user.id,
        user_email: user.email,
        action: 'AUTH_GOOGLE_LOGIN',
        resource_type: 'USER',
        resource_id: user.id,
        details: { provider: 'google', google_id: googleId }
      });

      return {
        token,
        user: safeUser,
        is_new_user: false
      };
    }

    // Step B: Check if an account exists with the same verified email (Account Linking)
    const existingEmailUser = await userRepository.findByEmail(normalizedEmail);

    if (existingEmailUser) {
      if (existingEmailUser.status === 'suspended') {
        const err = new Error('Your account has been suspended. Please contact an administrator.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_SUSPENDED';
        throw err;
      }
      if (existingEmailUser.status === 'deactivated') {
        const err = new Error('This account has been deactivated.');
        err.statusCode = 403;
        err.code = 'ACCOUNT_DEACTIVATED';
        throw err;
      }

      // Secure Account Linking: Google email is verified, link safely while preserving existing role and data
      await userRepository.linkGoogleAccount(existingEmailUser.id, {
        googleId,
        avatarUrl
      });
      await userRepository.updateLastLogin(existingEmailUser.id);
      const safeUser = await userRepository.findById(existingEmailUser.id);
      const token = issueJwt(safeUser);

      await logAudit({
        user_id: existingEmailUser.id,
        user_email: existingEmailUser.email,
        action: 'AUTH_GOOGLE_LINKED',
        resource_type: 'USER',
        resource_id: existingEmailUser.id,
        details: { provider: 'google', google_id: googleId, linked_at: new Date().toISOString() }
      });

      return {
        token,
        user: safeUser,
        is_new_user: false,
        account_linked: true
      };
    }

    // Step C: New User Registration (Role is strictly 'STUDENT' - no escalation)
    const newUser = await userRepository.createGoogleUser({
      fullName,
      email: normalizedEmail,
      googleId,
      avatarUrl
    });

    await userRepository.updateLastLogin(newUser.id);
    const safeUser = await userRepository.findById(newUser.id);
    const token = issueJwt(safeUser);

    await logAudit({
      user_id: newUser.id,
      user_email: newUser.email,
      action: 'AUTH_GOOGLE_REGISTER',
      resource_type: 'USER',
      resource_id: newUser.id,
      details: { provider: 'google', google_id: googleId, role: 'STUDENT' }
    });

    return {
      token,
      user: safeUser,
      is_new_user: true
    };
  },

  /**
   * Unlinks Google Identity from account (requires existing local password)
   */
  async unlinkGoogle(userId, { password } = {}) {
    const rawUser = await userRepository.findByEmail(
      (await userRepository.findById(userId))?.email
    );

    if (!rawUser) {
      const err = new Error('User not found.');
      err.statusCode = 404;
      err.code = 'NOT_FOUND';
      throw err;
    }

    if (!rawUser.google_id) {
      const err = new Error('No Google account is currently linked to this user.');
      err.statusCode = 400;
      err.code = 'NOT_LINKED';
      throw err;
    }

    // Prevent account lockout: user must have a local password to unlink Google
    if (!rawUser.password_hash) {
      const err = new Error('You must set a password in your account settings before unlinking your Google account.');
      err.statusCode = 400;
      err.code = 'PASSWORD_REQUIRED';
      throw err;
    }

    // If password provided, verify it
    if (password) {
      const isValid = await bcrypt.compare(password, rawUser.password_hash);
      if (!isValid) {
        const err = new Error('Password verification failed.');
        err.statusCode = 400;
        err.code = 'INVALID_PASSWORD';
        throw err;
      }
    }

    await userRepository.unlinkGoogleAccount(userId);

    await logAudit({
      user_id: userId,
      user_email: rawUser.email,
      action: 'AUTH_GOOGLE_UNLINKED',
      resource_type: 'USER',
      resource_id: userId,
      details: { previous_google_id: rawUser.google_id }
    });

    const safeUser = await userRepository.findById(userId);
    return {
      success: true,
      message: 'Google account unlinked successfully.',
      user: safeUser
    };
  }
};
