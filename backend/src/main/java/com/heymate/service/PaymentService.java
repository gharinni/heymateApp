package com.heymate.service;

import com.heymate.entity.Booking;
import com.heymate.entity.Payment;
import com.heymate.repository.BookingRepository;
import com.heymate.repository.PaymentRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${razorpay.key_id:placeholder}")
    private String keyId;

    @Value("${razorpay.key_secret:placeholder}")
    private String keySecret;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Map<String, String> initiatePayment(Long bookingId) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        Payment payment = Payment.builder()
                .booking(booking)
                .amount(booking.getPrice())
                .status(Payment.PaymentStatus.PENDING)
                .razorpayOrder("ORDER_" + System.currentTimeMillis())
                .build();
        paymentRepository.save(payment);

        return Map.of(
            "orderId", payment.getRazorpayOrder(),
            "amount", String.valueOf(booking.getPrice()),
            "currency", "INR",
            "keyId", keyId
        );
    }

    @Transactional
    public boolean verifyAndCapture(String razorOrderId, String razorPaymentId, String signature) {
        paymentRepository.findByRazorpayOrder(razorOrderId).ifPresent(payment -> {
            payment.setRazorpayPayment(razorPaymentId);
            payment.setStatus(Payment.PaymentStatus.PAID);
            paymentRepository.save(payment);

            Booking b = payment.getBooking();
            b.setStatus(Booking.BookingStatus.COMPLETED);
            bookingRepository.save(b);
        });
        return true;
    }
}
