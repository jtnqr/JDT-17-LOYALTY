package com.jdt17.loyalty.dto.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;
import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MemberPointsResponse {
    private UUID memberId;
    private String memberName;
    private List<PointBalanceDetail> balances;

    @Data
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class PointBalanceDetail {
        private UUID partnerId;
        private String partnerName;
        private Long balance;
    }
}
