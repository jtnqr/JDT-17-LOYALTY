package com.jdt17.loyalty.dto.exchange;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ExchangeRequest {
    private UUID fromPartnerId;
    private UUID toPartnerId;
    private Long points;
}
