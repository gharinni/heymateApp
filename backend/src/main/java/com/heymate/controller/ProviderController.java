package com.heymate.controller;

import com.heymate.entity.Provider;
import com.heymate.service.ProviderService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/providers")
@RequiredArgsConstructor
public class ProviderController {

    private final ProviderService providerService;

    // GET /api/providers/nearby?lat=13.07&lng=80.22&service=food&radius=5
    @GetMapping("/nearby")
    public ResponseEntity<List<Provider>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(required = false) String service,
            @RequestParam(defaultValue = "5") double radius) {
        return ResponseEntity.ok(providerService.getNearbyProviders(lat, lng, service, radius));
    }

    @PutMapping("/location")
    public ResponseEntity<String> updateLocation(
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        providerService.updateLocation(userDetails.getUsername(), body.get("lat"), body.get("lng"));
        return ResponseEntity.ok("Location updated");
    }

    @PutMapping("/online")
    public ResponseEntity<Provider> toggleOnline(
            @RequestBody Map<String, Boolean> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(
            providerService.toggleOnline(userDetails.getUsername(), body.get("online"))
        );
    }

    @GetMapping("/stats")
    public ResponseEntity<Map<String, Object>> getStats(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(providerService.getProviderStats(userDetails.getUsername()));
    }

    @GetMapping("/{id}")
    public ResponseEntity<Provider> getProfile(@PathVariable Long id) {
        return ResponseEntity.ok(providerService.getProviderProfile(id));
    }
}
