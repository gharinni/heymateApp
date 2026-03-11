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
        @NotBlank private String role; // USER or PROVIDER
        // Provider-only fields
        private String serviceType;
        private String description;
        private String pricePerUnit;
    }

    @Data
    public static class LoginRequest {
        @NotBlank private String phone;
        @NotBlank private String password;
    }

    @Data
    public static class AuthResponse {
        private String token;
        private String role;
        private Long userId;
        private String name;
        private String phone;
    }

    @Data
    public static class FcmTokenRequest {
        @NotBlank private String fcmToken;
    }
}
