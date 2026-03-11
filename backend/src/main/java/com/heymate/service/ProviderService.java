package com.heymate.service;

import com.heymate.entity.Provider;
import com.heymate.repository.ProviderRepository;
import com.heymate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
public class ProviderService {

    private final ProviderRepository providerRepository;
    private final UserRepository userRepository;

    public List<Provider> getNearbyProviders(double lat, double lng,
                                              String serviceType, double radiusKm) {
        return providerRepository.findNearbyProviders(lat, lng, serviceType, radiusKm * 1000, 20);
    }

    @Transactional
    public void updateLocation(String phone, double lat, double lng) {
        userRepository.findByPhone(phone).ifPresent(user ->
            providerRepository.findByUserId(user.getId()).ifPresent(provider ->
                providerRepository.updateLocation(provider.getId(), lat, lng)
            )
        );
    }

    @Transactional
    public Provider toggleOnline(String phone, boolean online) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider profile not found"));
        provider.setOnline(online);
        return providerRepository.save(provider);
    }

    public Provider getProviderProfile(Long providerId) {
        return providerRepository.findById(providerId)
                .orElseThrow(() -> new RuntimeException("Provider not found"));
    }

    @Transactional
    public void refreshRating(Long providerId) {
        providerRepository.findById(providerId).ifPresent(provider -> {
            Double avg = providerRepository.getAverageRating(providerId);
            if (avg != null) {
                provider.setRating(Math.round(avg * 10.0) / 10.0);
                providerRepository.save(provider);
            }
        });
    }

    public Map<String, Object> getProviderStats(String phone) {
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        var provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        return Map.of(
            "providerId", provider.getId(),
            "rating", provider.getRating(),
            "totalOrders", provider.getTotalOrders(),
            "isOnline", provider.isOnline()
        );
    }
}
