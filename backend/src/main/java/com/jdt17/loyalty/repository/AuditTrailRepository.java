package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.AuditTrail;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface AuditTrailRepository extends JpaRepository<AuditTrail, UUID> {
}
