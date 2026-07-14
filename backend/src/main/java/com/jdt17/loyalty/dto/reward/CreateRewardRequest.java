package com.jdt17.loyalty.dto.reward;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreateRewardRequest {
    @NotBlank(message = "Reward name is required")
    private String name;

    @NotNull(message = "Point cost is required")
    @Positive(message = "Point cost must be positive")
    private Integer pointCost;

    @NotNull(message = "Partner ID is required")
    private UUID partnerId;

    private String imageUrl;
}
