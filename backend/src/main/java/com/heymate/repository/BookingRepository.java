package com.heymate.repository;

import com.heymate.entity.Booking;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BookingRepository extends JpaRepository<Booking, Long> {
    List<Booking> findByUserIdOrderByCreatedAtDesc(Long userId);
    List<Booking> findByProviderIdOrderByCreatedAtDesc(Long providerId);
    List<Booking> findByProviderIdAndStatus(Long providerId, Booking.BookingStatus status);
    List<Booking> findByUserIdAndStatus(Long userId, Booking.BookingStatus status);
}
