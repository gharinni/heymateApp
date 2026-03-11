package com.heymate.repository;

import com.heymate.entity.BloodDonor;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface BloodDonorRepository extends JpaRepository<BloodDonor, Long> {

    @Query(value = """
        SELECT bd.* FROM blood_donors bd
        JOIN users u ON bd.user_id = u.id
        WHERE bd.is_available = true
          AND bd.blood_type = :bloodType
          AND ST_DWithin(
            bd.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )
        ORDER BY ST_Distance(
            bd.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
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
