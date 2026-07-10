package com.jdt17.loyalty.dto.rate;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotNull;
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
public class CreateExchangeRateRequest {
    @NotNull(message = "From partner ID is required")
    private UUID fromPartnerId;

    @NotNull(message = "To partner ID is required")
    private UUID toPartnerId;

    @NotNull(message = "Rate is required")
    @DecimalMin(value = "0.0001", message = "Rate must be greater than 0")
    private BigDecimal rate;

    @NotNull(message = "Effective from date is required")
    private OffsetDateTime effectiveFrom;
}
