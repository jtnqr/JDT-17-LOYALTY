package com.jdt17.loyalty.dto.reward;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;
import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ListRewardResponse {
    private List<RewardResponse> data;
    private Long total;
}
