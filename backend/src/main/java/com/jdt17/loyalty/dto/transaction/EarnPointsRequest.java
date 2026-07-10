package com.jdt17.loyalty.dto.transaction;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class EarnPointsRequest {
    @NotBlank(message = "Member identifier is required")
    private String memberIdentifier;

    @NotBlank(message = "Partner code is required")
    private String partner;

    @NotNull(message = "Transaction amount is required")
    @Min(value = 1, message = "Transaction amount must be greater than 0")
    private Long trxAmount;
}
