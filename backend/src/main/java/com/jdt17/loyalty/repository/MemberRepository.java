package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.Member;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;
import java.util.UUID;

public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByEmail(String email);
    Optional<Member> findByPhone(String phone);
    boolean existsByEmail(String email);
    boolean existsByPhone(String phone);
    Page<Member> findByStatus(String status, Pageable pageable);
    long countByStatus(String status);
    long countByCreatedAtAfter(java.time.OffsetDateTime dateTime);
}
