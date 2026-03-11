package com.heymate.service;

import com.heymate.dto.AuthDTO;
import com.heymate.entity.Provider;
import com.heymate.entity.User;
import com.heymate.repository.ProviderRepository;
import com.heymate.repository.UserRepository;
import com.heymate.security.JwtUtil;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtUtil jwtUtil;

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

        // If registering as provider, create provider profile
        if ("PROVIDER".equals(req.getRole()) || "BOTH".equals(req.getRole())) {
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
        User user = userRepository.findByPhone(req.getPhone())
                .orElseThrow(() -> new RuntimeException("Invalid credentials"));

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

    private AuthDTO.AuthResponse buildResponse(User user, String token) {
        AuthDTO.AuthResponse res = new AuthDTO.AuthResponse();
        res.setToken(token);
        res.setRole(user.getRole().name());
        res.setUserId(user.getId());
        res.setName(user.getName());
        res.setPhone(user.getPhone());
        return res;
    }
}
