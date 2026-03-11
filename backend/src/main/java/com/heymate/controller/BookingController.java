package com.heymate.controller;

import com.heymate.dto.BookingDTO;
import com.heymate.entity.Booking;
import com.heymate.service.BookingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import java.math.BigDecimal;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/bookings")
@RequiredArgsConstructor
public class BookingController {

    private final BookingService bookingService;

    @PostMapping
    public ResponseEntity<Booking> create(
            @Valid @RequestBody BookingDTO.CreateRequest req,
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.createBooking(userDetails.getUsername(), req));
    }

    @PutMapping("/{id}/accept")
    public ResponseEntity<Booking> accept(
            @PathVariable Long id,
            @RequestBody(required = false) Map<String, Object> body,
            @AuthenticationPrincipal UserDetails userDetails) {
        BigDecimal price = body != null && body.get("price") != null
                ? new BigDecimal(body.get("price").toString()) : null;
        return ResponseEntity.ok(bookingService.acceptBooking(userDetails.getUsername(), id, price));
    }

    @PutMapping("/{id}/status")
    public ResponseEntity<Booking> updateStatus(
            @PathVariable Long id,
            @RequestBody Map<String, String> body) {
        Booking.BookingStatus status = Booking.BookingStatus.valueOf(body.get("status"));
        return ResponseEntity.ok(bookingService.updateStatus(id, status));
    }

    @GetMapping("/my")
    public ResponseEntity<List<Booking>> myBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getUserBookings(userDetails.getUsername()));
    }

    @GetMapping("/provider")
    public ResponseEntity<List<Booking>> providerBookings(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getProviderBookings(userDetails.getUsername()));
    }

    @GetMapping("/provider/pending")
    public ResponseEntity<List<Booking>> pendingRequests(
            @AuthenticationPrincipal UserDetails userDetails) {
        return ResponseEntity.ok(bookingService.getPendingRequests(userDetails.getUsername()));
    }
}
