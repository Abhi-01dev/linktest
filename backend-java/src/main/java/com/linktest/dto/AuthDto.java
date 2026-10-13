package com.linktest.dto;

import com.linktest.entity.User;
import java.time.Instant;

public class AuthDto {

    public static class LoginRequest {
        private String email;
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    public static class RegisterRequest {
        private String full_name;
        private String email;
        private String password;
        private String role = "STUDENT";

        public String getFull_name() { return full_name; }
        public void setFull_name(String full_name) { this.full_name = full_name; }
        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
        public String getRole() { return role; }
        public void setRole(String role) { this.role = role; }
    }

    public static class VerifyEmailRequest {
        private String email;
        private String otp;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getOtp() { return otp; }
        public void setOtp(String otp) { this.otp = otp; }
    }

    public static class ResendVerificationRequest {
        private String email;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
    }

    public static class GoogleAuthRequest {
        private String credential;

        public String getCredential() { return credential; }
        public void setCredential(String credential) { this.credential = credential; }
    }

    public static class ChangePasswordRequest {
        private String current_password;
        private String new_password;

        public String getCurrent_password() { return current_password; }
        public void setCurrent_password(String current_password) { this.current_password = current_password; }
        public String getNew_password() { return new_password; }
        public void setNew_password(String new_password) { this.new_password = new_password; }
    }

    public static class UserProfile {
        private String id;
        private String full_name;
        private String email;
        private String role;
        private String status;
        private Boolean email_verified;
        private String phone;
        private String avatar_url;
        private String auth_provider;
        private Instant created_at;

        public static UserProfile from(User user) {
            UserProfile p = new UserProfile();
            p.id = user.getId();
            p.full_name = user.getFullName();
            p.email = user.getEmail();
            p.role = user.getRole();
            p.status = user.getStatus();
            p.email_verified = user.getEmailVerified();
            p.phone = user.getPhone();
            p.avatar_url = user.getAvatarUrl();
            p.auth_provider = user.getAuthProvider();
            p.created_at = user.getCreatedAt();
            return p;
        }

        public String getId() { return id; }
        public String getFull_name() { return full_name; }
        public String getEmail() { return email; }
        public String getRole() { return role; }
        public String getStatus() { return status; }
        public Boolean getEmail_verified() { return email_verified; }
        public String getPhone() { return phone; }
        public String getAvatar_url() { return avatar_url; }
        public String getAuth_provider() { return auth_provider; }
        public Instant getCreated_at() { return created_at; }
    }
}
