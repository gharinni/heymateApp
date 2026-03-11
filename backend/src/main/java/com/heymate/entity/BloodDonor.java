package com.heymate.entity;

import jakarta.persistence.*;
import lombok.*;
import org.locationtech.jts.geom.Point;
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

    @Column(columnDefinition = "geography(Point,4326)")
    private Point location;

    private boolean isAvailable = true;
    private LocalDate lastDonated;
    private LocalDateTime updatedAt;

    @PrePersist @PreUpdate
    protected void onUpdate() { updatedAt = LocalDateTime.now(); }
}
