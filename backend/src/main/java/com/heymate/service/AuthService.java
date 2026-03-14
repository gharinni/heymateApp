package com.heymate.service;

import com.heymate.dto.AuthDTO;
import com.heymate.entity.Provider;
import com.heymate.entity.User;
import com.heymate.repository.ProviderRepository;
import com.heymate.repository.UserRepository;
import com.heymate.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;
import java.util.Random;
import java.util.concurrent.ConcurrentHashMap;

@Service
@RequiredArgsConstructor
@Slf4j
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

    // In-memory OTP store (use Redis in production)
    private final Map<String, String> otpStore = new ConcurrentHashMap<>();

    @Transactional
    public AuthDTO.AuthResponse register(AuthDTO.RegisterRequest req) {
        if (userRepository.existsByPhone(req.getPhone())) {
            throw new RuntimeException("Phone number already registered");
        }

        User user = User.builder()
                .name(req.getName())
                .phone(req.getPhone())
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .role(User.Role.valueOf(req.getRole().toUpperCase()))
                .build();

        user = userRepository.save(user);

        if ("PROVIDER".equalsIgnoreCase(req.getRole()) || "BOTH".equalsIgnoreCase(req.getRole())) {
            Provider provider = Provider.builder()
                    .user(user)
                    .serviceType(req.getServiceType())
                    .description(req.getDescription())
                    .pricePerUnit(req.getPricePerUnit())
                    .build();
            providerRepository.save(provider);
        }

        String token = jwtUtil.generateToken(user.getPhone(), user.getRole().name());
        return buildResponse(user, token);
    }

    public AuthDTO.AuthResponse login(AuthDTO.LoginRequest req) {
        User user = null;

        // Support both phone and email login
        if (req.getPhone() != null && !req.getPhone().isBlank()) {
            user = userRepository.findByPhone(req.getPhone())
                    .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        } else if (req.getEmail() != null && !req.getEmail().isBlank()) {
            user = userRepository.findByEmail(req.getEmail().toLowerCase())
                    .orElseThrow(() -> new RuntimeException("Invalid credentials"));
        } else {
            throw new RuntimeException("Phone or email is required");
        }

        if (!passwordEncoder.matches(req.getPassword(), user.getPassword())) {
            throw new RuntimeException("Invalid credentials");
        }

        if (!user.isActive()) {
            throw new RuntimeException("Account is deactivated");
        }

        String token = jwtUtil.generateToken(user.getPhone(), user.getRole().name());
        return buildResponse(user, token);
    }

    @Transactional
    public void updateFcmToken(String phone, String fcmToken) {
        userRepository.findByPhone(phone).ifPresent(user -> {
            user.setFcmToken(fcmToken);
            userRepository.save(user);
        });
    }

    // Forgot password — generate and store OTP
    public Map<String, Object> forgotPassword(String email) {
        var user = userRepository.findByEmail(email.toLowerCase())
                .orElseThrow(() -> new RuntimeException("Email not found"));

        String otp = String.format("%06d", new Random().nextInt(999999));
        otpStore.put(email.toLowerCase(), otp);

        log.info("OTP for {} : {}", email, otp); // Remove in production — send via email/SMS

        return Map.of(
            "success", true,
            "message", "OTP sent to your email",
            "otp", otp  // Remove in production
        );
    }

    // Reset password with OTP
    @Transactional
    public Map<String, Object> resetPassword(AuthDTO.ResetPasswordRequest req) {
        String storedOtp = otpStore.get(req.getEmail().toLowerCase());
        if (storedOtp == null || !storedOtp.equals(req.getOtp())) {
            throw new RuntimeException("Invalid or expired OTP");
        }

        var user = userRepository.findByEmail(req.getEmail().toLowerCase())
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setPassword(passwordEncoder.encode(req.getPassword()));
        userRepository.save(user);
        otpStore.remove(req.getEmail().toLowerCase());

        return Map.of("success", true, "message", "Password reset successfully");
    }

    // Switch role between USER and PROVIDER
    @Transactional
    public AuthDTO.AuthResponse switchRole(String phone, String newRole) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        user.setRole(User.Role.valueOf(newRole.toUpperCase()));
        user = userRepository.save(user);

        // Create provider profile if switching to PROVIDER
        if ("PROVIDER".equalsIgnoreCase(newRole)) {
            boolean exists = providerRepository.findByUserId(user.getId()).isPresent();
            if (!exists) {
                providerRepository.save(Provider.builder().user(user).serviceType("general").build());
            }
        }

        String token = jwtUtil.generateToken(user.getPhone(), user.getRole().name());
        return buildResponse(user, token);
    }

    private AuthDTO.AuthResponse buildResponse(User user, String token) {
        AuthDTO.AuthResponse res = new AuthDTO.AuthResponse();
        res.setToken(token);
        res.setRole(user.getRole().name());
        res.setUserId(user.getId());
        res.setName(user.getName());
        res.setPhone(user.getPhone());
        res.setEmail(user.getEmail());
        res.setSuccess(true);
        return res;
    }
}
