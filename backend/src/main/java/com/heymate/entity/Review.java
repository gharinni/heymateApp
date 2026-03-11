package com.heymate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "reviews")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Review {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne @JoinColumn(name = "booking_id")  private Booking booking;
    @ManyToOne @JoinColumn(name = "user_id")     private User user;
    @ManyToOne @JoinColumn(name = "provider_id") private Provider provider;

    @Column(nullable = false)
    private Integer rating;

    private String comment;
    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
