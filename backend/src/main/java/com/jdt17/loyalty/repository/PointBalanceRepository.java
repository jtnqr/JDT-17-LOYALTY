package com.jdt17.loyalty.repository;

import com.jdt17.loyalty.entity.PointBalance;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface PointBalanceRepository extends JpaRepository<PointBalance, UUID> {
}
