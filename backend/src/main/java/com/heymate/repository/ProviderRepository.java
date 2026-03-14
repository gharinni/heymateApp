package com.heymate.repository;

import com.heymate.entity.Provider;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ProviderRepository extends JpaRepository<Provider, Long> {

    Optional<Provider> findByUserId(Long userId);

    List<Provider> findByServiceTypeAndIsOnline(String serviceType, boolean isOnline);

    // Simple distance calculation using lat/lng (no PostGIS needed)
    @Query(value = """
        SELECT p.* FROM providers p
        WHERE p.is_online = true
          AND (:serviceType IS NULL OR p.service_type = :serviceType)
          AND p.latitude IS NOT NULL
          AND p.longitude IS NOT NULL
          AND (
            6371000 * acos(
              cos(radians(:lat)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(p.latitude))
            )
          ) <= :radiusMeters
        ORDER BY (
            6371000 * acos(
              cos(radians(:lat)) * cos(radians(p.latitude)) *
              cos(radians(p.longitude) - radians(:lng)) +
              sin(radians(:lat)) * sin(radians(p.latitude))
            )
        ) ASC
        LIMIT :limitCount
        """, nativeQuery = true)
    List<Provider> findNearbyProviders(
        @Param("lat") double lat,
        @Param("lng") double lng,
        @Param("serviceType") String serviceType,
        @Param("radiusMeters") double radiusMeters,
        @Param("limitCount") int limitCount
    );

    @Modifying
    @Query("UPDATE Provider p SET p.latitude = :lat, p.longitude = :lng WHERE p.id = :providerId")
    void updateLocation(
        @Param("providerId") Long providerId,
        @Param("lat") double lat,
        @Param("lng") double lng
    );

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId")
    Double getAverageRating(@Param("providerId") Long providerId);
}
