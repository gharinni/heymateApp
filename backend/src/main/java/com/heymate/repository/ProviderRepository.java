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

    // PostGIS: find providers within radius sorted by distance
    @Query(value = """
        SELECT p.* FROM providers p
        WHERE p.is_online = true
          AND (:serviceType IS NULL OR p.service_type = :serviceType)
          AND ST_DWithin(
            p.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography,
            :radiusMeters
          )
        ORDER BY ST_Distance(
            p.location,
            ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
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

    // Update provider location
    @Modifying
    @Query(value = """
        UPDATE providers
        SET location = ST_SetSRID(ST_MakePoint(:lng, :lat), 4326)::geography
        WHERE id = :providerId
        """, nativeQuery = true)
    void updateLocation(
        @Param("providerId") Long providerId,
        @Param("lat") double lat,
        @Param("lng") double lng
    );

    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.provider.id = :providerId")
    Double getAverageRating(@Param("providerId") Long providerId);
}
