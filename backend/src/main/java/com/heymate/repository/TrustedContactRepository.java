package com.heymate.repository;

import com.heymate.entity.TrustedContact;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface TrustedContactRepository extends JpaRepository<TrustedContact, Long> {
    List<TrustedContact> findByUserId(Long userId);
    void deleteByUserIdAndId(Long userId, Long id);
}
