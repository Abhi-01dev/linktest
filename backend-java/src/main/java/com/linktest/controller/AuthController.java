package com.linktest.controller;

import com.linktest.dto.ApiResponse;
import com.linktest.dto.AuthDto;
import com.linktest.security.UserPrincipal;
import com.linktest.service.AuthService;
import jakarta.servlet.http.HttpServletRequest;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final AuthService authService;

    public AuthController(AuthService authService) {
        this.authService = authService;
    }

    @PostMapping("/register")
    public ResponseEntity<ApiResponse<Map<String, Object>>> register(
            @RequestBody AuthDto.RegisterRequest req,
            HttpServletRequest request) {
        Map<String, Object> data = authService.register(req, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.status(201).body(ApiResponse.of(data, (String) data.get("message")));
    }

    @PostMapping("/verify-email")
    public ResponseEntity<ApiResponse<Map<String, Object>>> verifyEmail(
            @RequestBody AuthDto.VerifyEmailRequest req,
            HttpServletRequest request) {
        Map<String, Object> data = authService.verifyEmail(req, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.of(data, (String) data.get("message")));
    }

    @PostMapping("/resend-verification")
    public ResponseEntity<ApiResponse<Map<String, Object>>> resendVerification(
            @RequestBody AuthDto.ResendVerificationRequest req) {
        Map<String, Object> data = authService.resendVerification(req.getEmail());
        return ResponseEntity.ok(ApiResponse.of(data, (String) data.get("message")));
    }

    @PostMapping("/login")
    public ResponseEntity<ApiResponse<Map<String, Object>>> login(
            @RequestBody AuthDto.LoginRequest req,
            HttpServletRequest request) {
        Map<String, Object> data = authService.login(req, request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.of(data, "Login successful."));
    }

    @GetMapping("/me")
    public ResponseEntity<ApiResponse<Map<String, Object>>> getMe(
            @AuthenticationPrincipal UserPrincipal principal) {
        if (principal == null) {
            return ResponseEntity.status(401).body(ApiResponse.error("UNAUTHORIZED", "Authentication required."));
        }
        AuthDto.UserProfile profile = authService.getMe(principal.getId());
        return ResponseEntity.ok(ApiResponse.of(Map.of("user", profile), "Profile retrieved successfully."));
    }

    @PostMapping("/google")
    public ResponseEntity<ApiResponse<Map<String, Object>>> googleLogin(
            @RequestBody AuthDto.GoogleAuthRequest req,
            HttpServletRequest request) {
        Map<String, Object> data = authService.googleLogin(req.getCredential(), request.getRemoteAddr(), request.getHeader("User-Agent"));
        return ResponseEntity.ok(ApiResponse.of(data, "Google sign-in successful."));
    }
}
