package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.Reward;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface RewardRepository extends JpaRepository<Reward, UUID> {
    List<Reward> findByPartnerId(UUID partnerId);
}
