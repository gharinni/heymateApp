package com.heymate.repository;

import com.heymate.entity.BloodDonor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodDonorRepository extends JpaRepository<BloodDonor, Long> {

    // Simple distance calculation without PostGIS
    @Query(value = """
        SELECT bd.* FROM blood_donors bd
        WHERE bd.is_available = true
          AND bd.blood_type = :bloodType
          AND bd.latitude IS NOT NULL
          AND bd.longitude IS NOT NULL
          AND (
            6371000 * acos(
              cos(radians(:lat)) * cos(radians(bd.latitude)) *
              cos(radians(bd.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(bd.latitude))
            )
          ) <= :radiusMeters
        ORDER BY (
            6371000 * acos(
              cos(radians(:lat)) * cos(radians(bd.latitude)) *
              cos(radians(bd.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(bd.latitude))
            )
        ) ASC
        LIMIT 20
        """, nativeQuery = true)
    List<BloodDonor> findNearbyDonors(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("bloodType") String bloodType,
        @Param("radiusMeters") double radiusMeters
    );
}
