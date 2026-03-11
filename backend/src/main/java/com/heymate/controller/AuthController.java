package com.heymate.controller;

import com.heymate.dto.AuthDTO;
import com.heymate.service.AuthService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthService authService;

    @PostMapping("/register")
    public ResponseEntity<AuthDTO.AuthResponse> register(
            @Valid @RequestBody AuthDTO.RegisterRequest req) {
        return ResponseEntity.ok(authService.register(req));
    }

    @PostMapping("/login")
    public ResponseEntity<AuthDTO.AuthResponse> login(
            @Valid @RequestBody AuthDTO.LoginRequest req) {
        return ResponseEntity.ok(authService.login(req));
    }

    @PostMapping("/fcm-token")
    public ResponseEntity<String> updateFcmToken(
            @RequestBody AuthDTO.FcmTokenRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        authService.updateFcmToken(userDetails.getUsername(), req.getFcmToken());
        return ResponseEntity.ok("FCM token updated");
    }
}
