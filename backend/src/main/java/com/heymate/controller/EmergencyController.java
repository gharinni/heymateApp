package com.heymate.controller;

import com.heymate.entity.BloodDonor;
import com.heymate.entity.TrustedContact;
import com.heymate.service.EmergencyService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/emergency")
@RequiredArgsConstructor
public class EmergencyController {

    private final EmergencyService emergencyService;

    // Trigger SOS
    @PostMapping("/sos")
    public ResponseEntity<String> triggerSOS(
            @RequestBody Map<String, Double> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        emergencyService.triggerSOS(
            userDetails.getUsername(),
            body.get("lat"),
            body.get("lng")
        );
        return ResponseEntity.ok("SOS broadcast initiated");
    }

    // Find blood donors - public endpoint
    @GetMapping("/blood")
    public ResponseEntity<List<BloodDonor>> findBloodDonors(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam String bloodType,
            @RequestParam(defaultValue = "10") double radius) {
        return ResponseEntity.ok(emergencyService.findBloodDonors(lat, lng, bloodType, radius));
    }

    // Trusted contacts management
    @GetMapping("/contacts")
    public ResponseEntity<List<TrustedContact>> getContacts(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(emergencyService.getTrustedContacts(userDetails.getUsername()));
    }

    @PostMapping("/contacts")
    public ResponseEntity<TrustedContact> addContact(
            @RequestBody TrustedContact contact,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(emergencyService.addTrustedContact(userDetails.getUsername(), contact));
    }

    @DeleteMapping("/contacts/{id}")
    public ResponseEntity<String> removeContact(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails userDetails) {
        emergencyService.removeTrustedContact(userDetails.getUsername(), id);
        return ResponseEntity.ok("Contact removed");
    }
}
