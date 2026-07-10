package com.jdt17.loyalty.dto.exchange;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.time.OffsetDateTime;
import java.util.Map;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeResponse {
    private UUID memberId;
    private String fromPartner;
    private String toPartner;
    private Long pointsDeducted;
    private Long pointsCredited;
    private Double exchangeRate;
    private Map<String, Long> updatedBalances;
    private UUID outTransactionId;
    private UUID inTransactionId;
    private OffsetDateTime exchangedAt;
}
