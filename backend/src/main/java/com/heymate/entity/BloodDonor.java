package com.heymate.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "blood_donors")
@Data @Builder @NoArgsConstructor @AllArgsConstructor
public class BloodDonor {

    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @OneToOne @JoinColumn(name = "user_id")
    private User user;

    @Column(nullable = false)
    private String bloodType;

    // Simple lat/lng instead of PostGIS Point
    private Double latitude;
    private Double longitude;

    private boolean isAvailable = true;
    private LocalDate lastDonated;
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
