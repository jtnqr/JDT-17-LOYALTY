package com.jdt17.loyalty.dto.transaction;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarnPointsResponse {
    private UUID transactionId;
    private UUID memberId;
    private String partner;
    private Long trxAmountIDR;
    private Long pointsEarned;
    private Long newBalance;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
