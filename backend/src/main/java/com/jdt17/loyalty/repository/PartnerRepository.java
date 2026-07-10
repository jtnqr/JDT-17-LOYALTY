package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.Partner;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PartnerRepository extends JpaRepository<Partner, UUID> {
    List<Partner> findByStatus(String status);
    Optional<Partner> findByCode(String code);
    boolean existsByCode(String code);
}
