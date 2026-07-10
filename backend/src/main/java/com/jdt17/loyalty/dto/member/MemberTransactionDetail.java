package com.jdt17.loyalty.dto.member;

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
public class MemberTransactionDetail {
    private UUID id;
    private String type;
    private UUID partnerId;
    private String partnerName;
    private Long points;
    private Long trxAmountIDR;
    private OffsetDateTime expiresAt;
    private OffsetDateTime createdAt;
}
