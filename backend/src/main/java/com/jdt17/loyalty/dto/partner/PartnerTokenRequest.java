package com.jdt17.loyalty.dto.partner;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerTokenRequest {
    @NotNull(message = "Partner ID is required")
    private UUID partnerId;

    @NotBlank(message = "API Key is required")
    private String apiKey;
}
