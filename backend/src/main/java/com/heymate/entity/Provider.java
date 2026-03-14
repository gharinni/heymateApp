package com.heymate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "providers")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class Provider {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;

    @Column(nullable = false)
    private String serviceType;

    private String description;
    private boolean isOnline = false;

    // Store lat/lng as simple doubles instead of PostGIS Point
    private Double latitude;
    private Double longitude;

    private Double rating = 5.0;
    private Integer totalOrders = 0;
    private String pricePerUnit;
    private boolean verified = false;

    private LocalDateTime createdAt;

    @PrePersist
    protected void onCreate() { createdAt = LocalDateTime.now(); }
}
