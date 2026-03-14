package com.heymate.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

public class AuthDTO {

    @Data
    public static class RegisterRequest {
        @NotBlank private String name;
        @NotBlank @Size(min = 10, max = 15) private String phone;
        private String email;
        @NotBlank @Size(min = 6) private String password;
        @NotBlank private String role;
        private String serviceType;
        private String description;
        private String pricePerUnit;
    }

    @Data
    public static class LoginRequest {
        private String phone;
        private String email;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String role;
        private Long userId;
        private String name;
        private String phone;
        private String email;
        private boolean success = true;
    }

    @Data
    public static class FcmTokenRequest {
        @NotBlank private String fcmToken;
    }

    @Data
    public static class ForgotPasswordRequest {
        @NotBlank private String email;
    }

    @Data
    public static class ResetPasswordRequest {
        @NotBlank private String email;
        @NotBlank private String otp;
        @NotBlank @Size(min = 6) private String password;
    }
}
