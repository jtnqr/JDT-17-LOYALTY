package com.jdt17.loyalty.dto.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UpdatePartnerRequest {
    private String name;
    private Integer pointsPerThousandIDR;
    private Integer expiryDays;
    private String status;
}
