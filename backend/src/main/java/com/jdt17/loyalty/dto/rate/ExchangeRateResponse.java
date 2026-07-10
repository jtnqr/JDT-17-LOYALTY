package com.jdt17.loyalty.dto.rate;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRateResponse {
    private UUID id;
    private UUID fromPartnerId;
    private String fromPartnerName;
    private String fromPartnerCode;
    private UUID toPartnerId;
    private String toPartnerName;
    private String toPartnerCode;
    private BigDecimal rate;
    private OffsetDateTime effectiveFrom;
}
