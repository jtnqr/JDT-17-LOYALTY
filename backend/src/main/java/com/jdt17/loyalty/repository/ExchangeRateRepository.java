package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.ExchangeRate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ExchangeRateRepository extends JpaRepository<ExchangeRate, UUID> {

    @Query(value = """
        SELECT DISTINCT ON (from_partner_id, to_partner_id) *
        FROM mst_exchange_rate
        WHERE effective_from <= :now
        ORDER BY from_partner_id, to_partner_id, effective_from DESC
        """, nativeQuery = true)
    List<ExchangeRate> findAllActiveRates(@Param("now") OffsetDateTime now);

    @Query(value = """
        SELECT * FROM mst_exchange_rate
        WHERE from_partner_id = :fromId AND to_partner_id = :toId AND effective_from <= :now
        ORDER BY effective_from DESC
        LIMIT 1
        """, nativeQuery = true)
    Optional<ExchangeRate> findLatestRate(
            @Param("fromId") UUID fromId,
            @Param("toId") UUID toId,
            @Param("now") OffsetDateTime now
    );

    boolean existsByFromPartnerIdAndToPartnerIdAndEffectiveFrom(UUID fromId, UUID toId, OffsetDateTime effectiveFrom);
}
