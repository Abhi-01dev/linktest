package com.linktest.service;

import com.google.api.client.googleapis.auth.oauth2.GoogleIdToken;
import com.google.api.client.googleapis.auth.oauth2.GoogleIdTokenVerifier;
import com.google.api.client.http.javanet.NetHttpTransport;
import com.google.api.client.json.gson.GsonFactory;
import com.linktest.dto.AuthDto;
import com.linktest.entity.EmailVerificationToken;
import com.linktest.entity.User;
import com.linktest.repository.EmailVerificationTokenRepository;
import com.linktest.repository.UserRepository;
import com.linktest.security.JwtTokenProvider;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.security.SecureRandom;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.*;

@Service
public class AuthService {

    private static final Logger log = LoggerFactory.getLogger(AuthService.class);
    private static final SecureRandom random = new SecureRandom();

    private final UserRepository userRepository;
    private final EmailVerificationTokenRepository tokenRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtTokenProvider jwtTokenProvider;
    private final LoggingService loggingService;

    @Value("${app.google.client-id:310975061442-3j9q7h2jhqc0a4najjp8u3a1s0ftnuqb.apps.googleusercontent.com}")
    private String googleClientId;

    public AuthService(UserRepository userRepository,
                       EmailVerificationTokenRepository tokenRepository,
                       PasswordEncoder passwordEncoder,
                       JwtTokenProvider jwtTokenProvider,
                       LoggingService loggingService) {
        this.userRepository = userRepository;
        this.tokenRepository = tokenRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtTokenProvider = jwtTokenProvider;
        this.loggingService = loggingService;
    }

    private String hashToken(String text) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] encodedhash = digest.digest(text.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder(2 * encodedhash.length);
            for (byte b : encodedhash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    @Transactional
    public Map<String, Object> register(AuthDto.RegisterRequest req, String ip, String ua) {
        if (req.getEmail() == null || req.getEmail().isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }
        if (req.getPassword() == null || req.getPassword().length() < 6) {
            throw new IllegalArgumentException("Password must be at least 6 characters.");
        }

        String email = req.getEmail().trim().toLowerCase();
        Optional<User> existingUser = userRepository.findByEmailIgnoreCase(email);

        User user;
        if (existingUser.isPresent()) {
            user = existingUser.get();
            if (Boolean.TRUE.equals(user.getEmailVerified())) {
                throw new IllegalStateException("An account with this email address already exists.");
            }
            // Update unverified user's credentials
            user.setFullName(req.getFull_name() != null ? req.getFull_name().trim() : user.getFullName());
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            userRepository.save(user);
        } else {
            user = new User();
            user.setId("usr-" + UUID.randomUUID().toString().substring(0, 12));
            user.setFullName(req.getFull_name() != null ? req.getFull_name().trim() : "Student");
            user.setEmail(email);
            user.setPasswordHash(passwordEncoder.encode(req.getPassword()));
            user.setRole(req.getRole() != null ? req.getRole().toUpperCase() : "STUDENT");
            user.setStatus("active");
            user.setEmailVerified(false);
            user.setAuthProvider("local");
            user.setCreatedAt(Instant.now());
            userRepository.save(user);
        }

        // Generate 6-digit OTP
        int otpInt = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpInt);
        String otpHash = hashToken(otp);

        tokenRepository.deleteByUserId(user.getId());

        EmailVerificationToken token = new EmailVerificationToken(
                UUID.randomUUID().toString(),
                user.getId(),
                otpHash,
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );
        tokenRepository.save(token);

        log.info("[LinkTest Email] Verification OTP for {}: {}", email, otp);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("message", "Registration successful. Please verify your email with the 6-digit verification code sent.");
        res.put("email", email);
        res.put("requiresVerification", true);
        return res;
    }

    @Transactional
    public Map<String, Object> verifyEmail(AuthDto.VerifyEmailRequest req, String ip, String ua) {
        if (req.getEmail() == null || req.getOtp() == null) {
            throw new IllegalArgumentException("Email and OTP verification code are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new IllegalArgumentException("No registration found for email: " + email));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalStateException("Email address is already verified. Please log in.");
        }

        EmailVerificationToken token = tokenRepository.findTopByUserIdOrderByCreatedAtDesc(user.getId())
                .orElseThrow(() -> new IllegalArgumentException("No verification code found. Please request a new one."));

        if (token.getExpiresAt().isBefore(Instant.now())) {
            throw new IllegalArgumentException("Verification code has expired. Please request a new code.");
        }

        if (token.getAttempts() >= 5) {
            throw new IllegalArgumentException("Maximum verification attempts exceeded. Please request a new code.");
        }

        String inputHash = hashToken(req.getOtp().trim());
        if (!inputHash.equals(token.getTokenHash())) {
            token.setAttempts(token.getAttempts() + 1);
            tokenRepository.save(token);
            throw new IllegalArgumentException("Invalid verification code. Please check your email.");
        }

        // Mark user verified
        user.setEmailVerified(true);
        user.setEmailVerifiedAt(Instant.now());
        userRepository.save(user);

        tokenRepository.deleteByUserId(user.getId());

        loggingService.logSecurity("EMAIL_VERIFIED", "INFO", user.getId(), user.getEmail(), ip, ua, "Email verified via OTP", "{}");

        String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", jwt);
        res.put("user", AuthDto.UserProfile.from(user));
        res.put("message", "Email successfully verified. Welcome to LinkTest!");
        return res;
    }

    @Transactional
    public Map<String, Object> resendVerification(String email) {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Email address is required.");
        }

        String normalizedEmail = email.trim().toLowerCase();
        User user = userRepository.findByEmailIgnoreCase(normalizedEmail)
                .orElseThrow(() -> new IllegalArgumentException("No user found with email: " + normalizedEmail));

        if (Boolean.TRUE.equals(user.getEmailVerified())) {
            throw new IllegalStateException("Email address is already verified.");
        }

        int otpInt = 100000 + random.nextInt(900000);
        String otp = String.valueOf(otpInt);
        String otpHash = hashToken(otp);

        tokenRepository.deleteByUserId(user.getId());

        EmailVerificationToken token = new EmailVerificationToken(
                UUID.randomUUID().toString(),
                user.getId(),
                otpHash,
                Instant.now().plus(15, ChronoUnit.MINUTES)
        );
        tokenRepository.save(token);

        log.info("[LinkTest Email] Resent verification OTP for {}: {}", normalizedEmail, otp);

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("message", "A new verification code has been generated and sent.");
        return res;
    }

    public Map<String, Object> login(AuthDto.LoginRequest req, String ip, String ua) {
        if (req.getEmail() == null || req.getPassword() == null) {
            throw new IllegalArgumentException("Email and password are required.");
        }

        String email = req.getEmail().trim().toLowerCase();
        Optional<User> userOpt = userRepository.findByEmailIgnoreCase(email);

        if (userOpt.isEmpty()) {
            loggingService.logSecurity("FAILED_LOGIN", "WARNING", null, email, ip, ua, "Account does not exist", "{}");
            throw new SecurityException("Invalid email or password.");
        }

        User user = userOpt.get();

        if ("suspended".equalsIgnoreCase(user.getStatus())) {
            loggingService.logSecurity("SUSPENDED_LOGIN_ATTEMPT", "HIGH", user.getId(), user.getEmail(), ip, ua, "Suspended user attempted login", "{}");
            throw new IllegalStateException("Your account has been suspended. Please contact an administrator.");
        }

        if ("deactivated".equalsIgnoreCase(user.getStatus())) {
            loggingService.logSecurity("DEACTIVATED_LOGIN_ATTEMPT", "HIGH", user.getId(), user.getEmail(), ip, ua, "Deactivated user attempted login", "{}");
            throw new IllegalStateException("This account has been deactivated.");
        }

        if (user.getPasswordHash() == null || !passwordEncoder.matches(req.getPassword(), user.getPasswordHash())) {
            loggingService.logSecurity("FAILED_LOGIN", "WARNING", user.getId(), user.getEmail(), ip, ua, "Invalid password credentials", "{}");
            throw new SecurityException("Invalid email or password.");
        }

        if (!Boolean.TRUE.equals(user.getEmailVerified())) {
            Map<String, Object> unverifiedRes = new LinkedHashMap<>();
            unverifiedRes.put("error", "EMAIL_NOT_VERIFIED");
            unverifiedRes.put("message", "Please verify your email address before logging in.");
            unverifiedRes.put("email", user.getEmail());
            throw new IllegalStateException("Please verify your email address before logging in.");
        }

        user.setLastLoginAt(Instant.now());
        userRepository.save(user);

        loggingService.logSecurity("LOGIN_SUCCESS", "INFO", user.getId(), user.getEmail(), ip, ua, "Successful login via local credentials", "{}");

        String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());

        Map<String, Object> res = new LinkedHashMap<>();
        res.put("token", jwt);
        res.put("user", AuthDto.UserProfile.from(user));
        return res;
    }

    public Map<String, Object> googleLogin(String idTokenString, String ip, String ua) {
        if (idTokenString == null || idTokenString.isBlank()) {
            throw new IllegalArgumentException("Google ID token credential is required.");
        }

        try {
            GoogleIdTokenVerifier verifier = new GoogleIdTokenVerifier.Builder(new NetHttpTransport(), new GsonFactory())
                    .setAudience(Collections.singletonList(googleClientId))
                    .build();

            GoogleIdToken idToken = verifier.verify(idTokenString);
            if (idToken == null) {
                throw new SecurityException("Invalid or expired Google credential token.");
            }

            GoogleIdToken.Payload payload = idToken.getPayload();
            String email = payload.getEmail().toLowerCase().trim();
            String name = (String) payload.get("name");
            String pictureUrl = (String) payload.get("picture");
            String googleSub = payload.getSubject();

            Optional<User> existingUser = userRepository.findByEmailIgnoreCase(email);
            User user;

            if (existingUser.isPresent()) {
                user = existingUser.get();
                if (user.getGoogleId() == null) {
                    user.setGoogleId(googleSub);
                    user.setAccountLinkedAt(Instant.now());
                }
                user.setEmailVerified(true);
                user.setLastLoginAt(Instant.now());
                userRepository.save(user);
            } else {
                user = new User();
                user.setId("usr-" + UUID.randomUUID().toString().substring(0, 12));
                user.setFullName(name != null ? name : "Google User");
                user.setEmail(email);
                user.setGoogleId(googleSub);
                user.setRole("STUDENT");
                user.setStatus("active");
                user.setEmailVerified(true);
                user.setEmailVerifiedAt(Instant.now());
                user.setAvatarUrl(pictureUrl);
                user.setAuthProvider("google");
                user.setAccountLinkedAt(Instant.now());
                user.setCreatedAt(Instant.now());
                user.setLastLoginAt(Instant.now());
                userRepository.save(user);
            }

            loggingService.logSecurity("GOOGLE_LOGIN_SUCCESS", "INFO", user.getId(), user.getEmail(), ip, ua, "Successful login via Google OAuth", "{}");

            String jwt = jwtTokenProvider.generateToken(user.getId(), user.getEmail(), user.getRole(), user.getFullName());

            Map<String, Object> res = new LinkedHashMap<>();
            res.put("token", jwt);
            res.put("user", AuthDto.UserProfile.from(user));
            return res;
        } catch (Exception ex) {
            log.error("Google authentication error: {}", ex.getMessage());
            throw new SecurityException("Google authentication failed: " + ex.getMessage());
        }
    }

    public AuthDto.UserProfile getMe(String userId) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        return AuthDto.UserProfile.from(user);
    }
}
