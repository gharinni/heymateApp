package com.heymate.repository;

import com.heymate.entity.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {
    List<Review> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    List<Review> findByUserIdOrderByCreatedAtDesc(Long userId);
    boolean existsByBookingId(Long bookingId);
}
