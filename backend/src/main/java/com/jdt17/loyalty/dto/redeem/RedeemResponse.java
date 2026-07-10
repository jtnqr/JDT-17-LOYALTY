package com.jdt17.loyalty.dto.redeem;

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
public class RedeemResponse {
    private UUID transactionId;
    private String rewardName;
    private UUID partnerId;
    private String partnerName;
    private Long pointsDeducted;
    private Long newBalance;
    private OffsetDateTime redeemedAt;
}
