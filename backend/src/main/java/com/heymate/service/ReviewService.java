package com.heymate.service;

import com.heymate.entity.Review;
import com.heymate.repository.BookingRepository;
import com.heymate.repository.ProviderRepository;
import com.heymate.repository.ReviewRepository;
import com.heymate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final BookingRepository bookingRepository;
    private final UserRepository userRepository;
    private final ProviderRepository providerRepository;

    @Transactional
    public Review submitReview(String phone, Long bookingId, int rating, String comment) {
        if (reviewRepository.existsByBookingId(bookingId)) {
            throw new RuntimeException("Review already submitted for this booking");
        }

        var booking = bookingRepository.findById(bookingId)
                .orElseThrow(() -> new RuntimeException("Booking not found"));
        var user = userRepository.findByPhone(phone)
                .orElseThrow(() -> new RuntimeException("User not found"));

        if (!booking.getUser().getId().equals(user.getId())) {
            throw new RuntimeException("Unauthorized");
        }

        Review review = Review.builder()
                .booking(booking)
                .user(user)
                .provider(booking.getProvider())
                .rating(rating)
                .comment(comment)
                .build();
        review = reviewRepository.save(review);

        // Update provider rating
        Long providerId = booking.getProvider().getId();
        Double avg = providerRepository.getAverageRating(providerId);
        if (avg != null) {
            providerRepository.findById(providerId).ifPresent(p -> {
                p.setRating(Math.round(avg * 10.0) / 10.0);
                providerRepository.save(p);
            });
        }
        return review;
    }

    public List<Review> getProviderReviews(Long providerId) {
        return reviewRepository.findByProviderIdOrderByCreatedAtDesc(providerId);
    }
}
