package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.Transaction;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.UUID;

public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    @Query("SELECT t FROM Transaction t WHERE t.member.id = :memberId AND (:type IS NULL OR t.type = :type)")
    Page<Transaction> findByMemberIdAndType(
            @Param("memberId") UUID memberId,
            @Param("type") String type,
            Pageable pageable
    );
}
