package com.jdt17.loyalty.dto.admin;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.Map;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AdminDashboardStatsResponse {
    private long totalMembers;
    private long activeMembers;
    private long inactiveMembers;
    private long enrolledToday;
    private long pointsIssued;
    private long pointsRedeemed;
    private long pointsExpired;
    private long totalPartners;
    private long totalRewards;
    private Map<String, Long> redeemedPointsPerMonth;
    private List<PopularRewardDetail> popularRewards;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PopularRewardDetail {
        private String name;
        private long count;
    }
}
