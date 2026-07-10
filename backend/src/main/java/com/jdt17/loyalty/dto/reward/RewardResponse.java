package com.jdt17.loyalty.dto.reward;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RewardResponse {
    private UUID id;
    private UUID partnerId;
    private String partnerName;
    private String name;
    private Integer pointCost;
    private String status;
}
