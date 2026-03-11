package com.heymate.controller;

import com.heymate.service.PaymentService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.Map;

@RestController
@RequestMapping("/api/payments")
@RequiredArgsConstructor
public class PaymentController {

    private final PaymentService paymentService;

    @PostMapping("/initiate")
    public ResponseEntity<Map<String, String>> initiate(
            @RequestBody Map<String, Long> body) throws Exception {
        return ResponseEntity.ok(paymentService.initiatePayment(body.get("bookingId")));
    }

    @PostMapping("/verify")
    public ResponseEntity<Map<String, Boolean>> verify(
            @RequestBody Map<String, String> body) {
        boolean verified = paymentService.verifyAndCapture(
            body.get("razorpayOrderId"),
            body.get("razorpayPaymentId"),
            body.get("razorpaySignature")
        );
        return ResponseEntity.ok(Map.of("success", verified));
    }
}
