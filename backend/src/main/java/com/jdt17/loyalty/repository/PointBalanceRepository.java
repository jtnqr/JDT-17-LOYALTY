package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.PointBalance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface PointBalanceRepository extends JpaRepository<PointBalance, UUID> {
    List<PointBalance> findByMemberId(UUID memberId);
    Optional<PointBalance> findByMemberIdAndPartnerId(UUID memberId, UUID partnerId);

    @Modifying
    @Query(value = "INSERT INTO trx_point_balance (id, member_id, partner_id, balance, version, updated_at) " +
            "SELECT gen_random_uuid(), m.id, :partnerId, 0, 0, now() " +
            "FROM mst_member m WHERE m.status = 'ACTIVE'", nativeQuery = true)
    void bulkInitPointBalances(@Param("partnerId") UUID partnerId);
}
