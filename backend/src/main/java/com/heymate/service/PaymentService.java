package com.heymate.service;

import com.heymate.entity.Booking;
import com.heymate.entity.Payment;
import com.heymate.repository.BookingRepository;
import com.heymate.repository.PaymentRepository;
import com.razorpay.RazorpayClient;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.json.JSONObject;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import javax.crypto.Mac;
import javax.crypto.spec.SecretKeySpec;
import java.math.BigDecimal;
import java.util.HexFormat;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Slf4j
public class PaymentService {

    @Value("${razorpay.key_id}")   private String keyId;
    @Value("${razorpay.key_secret}") private String keySecret;

    private final PaymentRepository paymentRepository;
    private final BookingRepository bookingRepository;

    @Transactional
    public Map<String, String> initiatePayment(Long bookingId) throws Exception {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        RazorpayClient client = new RazorpayClient(keyId, keySecret);
        JSONObject options = new JSONObject();
        options.put("amount", booking.getPrice().multiply(BigDecimal.valueOf(100)).intValue());
        options.put("currency", "INR");
        options.put("receipt", "booking_" + bookingId);

        com.razorpay.Order razorOrder = client.orders.create(options);
        String razorOrderId = razorOrder.get("id");

        Payment payment = Payment.builder()
                .booking(booking)
                .razorpayOrder(razorOrderId)
                .amount(booking.getPrice())
                .status(Payment.PaymentStatus.PENDING)
                .build();
        paymentRepository.save(payment);

        return Map.of(
            "orderId", razorOrderId,
            "amount", String.valueOf(booking.getPrice()),
            "currency", "INR",
            "keyId", keyId
        );
    }

    @Transactional
    public boolean verifyAndCapture(String razorOrderId, String razorPaymentId, String signature) {
        try {
            String payload = razorOrderId + "|" + razorPaymentId;
            Mac mac = Mac.getInstance("HmacSHA256");
            mac.init(new SecretKeySpec(keySecret.getBytes(), "HmacSHA256"));
            String computed = HexFormat.of().formatHex(mac.doFinal(payload.getBytes()));

            if (!computed.equals(signature)) {
                log.warn("Payment signature mismatch for order {}", razorOrderId);
                return false;
            }

            paymentRepository.findByRazorpayOrder(razorOrderId).ifPresent(payment -> {
                payment.setRazorpayPayment(razorPaymentId);
                payment.setStatus(Payment.PaymentStatus.PAID);
                paymentRepository.save(payment);

                // Mark booking as completed
                Booking b = payment.getBooking();
                b.setStatus(Booking.BookingStatus.COMPLETED);
                bookingRepository.save(b);
            });
            return true;

        } catch (Exception e) {
            log.error("Payment verification failed: {}", e.getMessage());
            return false;
        }
    }
}
