package com.heymate.service;

import com.heymate.dto.BookingDTO;
import com.heymate.entity.Booking;
import com.heymate.entity.Provider;
import com.heymate.entity.User;
import com.heymate.repository.BookingRepository;
import com.heymate.repository.ProviderRepository;
import com.heymate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.math.BigDecimal;
import java.util.List;

@Service
@RequiredArgsConstructor
public class BookingService {

    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;
    private final NotificationService notificationService;

    @Transactional
    public Booking createBooking(String userPhone, BookingDTO.CreateRequest req) {
        User user = userRepository.findByPhone(userPhone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Provider provider = providerRepository.findById(req.getProviderId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));

        Booking booking = Booking.builder()
                .user(user)
                .provider(provider)
                .serviceType(req.getServiceType())
                .address(req.getAddress())
                .notes(req.getNotes())
                .price(req.getPrice())
                .scheduledAt(req.getScheduledAt())
                .status(Booking.BookingStatus.PENDING)
                .build();

        booking = bookingRepository.save(booking);

        // Notify provider
        if (provider.getUser().getFcmToken() != null) {
            notificationService.sendPush(
                provider.getUser().getFcmToken(),
                "New Booking Request!",
                user.getName() + " needs " + req.getServiceType() + " at " + req.getAddress()
            );
        }
        return booking;
    }

    @Transactional
    public Booking acceptBooking(String providerPhone, Long bookingId, BigDecimal price) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));

        if (booking.getStatus() != Booking.BookingStatus.PENDING) {
            throw new RuntimeException("Booking is no longer available");
        }

        booking.setStatus(Booking.BookingStatus.ACCEPTED);
        if (price != null) booking.setPrice(price);
        booking = bookingRepository.save(booking);

        // Notify user
        String fcm = booking.getUser().getFcmToken();
        if (fcm != null) {
            notificationService.sendPush(fcm,
                "Booking Accepted!",
                booking.getProvider().getUser().getName() + " accepted your request and is on the way!"
            );
        }
        return booking;
    }

    @Transactional
    public Booking updateStatus(Long bookingId, Booking.BookingStatus newStatus) {
        Booking booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        booking.setStatus(newStatus);
        booking = bookingRepository.save(booking);

        if (newStatus == Booking.BookingStatus.COMPLETED) {
            // Increment provider total orders
            Provider provider = booking.getProvider();
            provider.setTotalOrders(provider.getTotalOrders() + 1);
            providerRepository.save(provider);

            // Notify user to pay
            String fcm = booking.getUser().getFcmToken();
            if (fcm != null) {
                notificationService.sendPush(fcm, "Service Completed!",
                    "Please pay ₹" + booking.getPrice() + " and rate your experience.");
            }
        }
        return booking;
    }

    public List<Booking> getUserBookings(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        return bookingRepository.findByUserIdOrderByCreatedAtDesc(user.getId());
    }

    public List<Booking> getProviderBookings(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        return bookingRepository.findByProviderIdOrderByCreatedAtDesc(provider.getId());
    }

    public List<Booking> getPendingRequests(String phone) {
        User user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));
        Provider provider = providerRepository.findByUserId(user.getId())
                .orElseThrow(() -> new RuntimeException("Provider not found"));
        return bookingRepository.findByProviderIdAndStatus(provider.getId(), Booking.BookingStatus.PENDING);
    }
}
