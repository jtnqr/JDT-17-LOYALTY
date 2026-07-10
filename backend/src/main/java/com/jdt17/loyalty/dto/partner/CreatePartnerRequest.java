package com.jdt17.loyalty.dto.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CreatePartnerRequest {
    private String name;
    private String code;
    private Integer pointsPerThousandIDR;
    private Integer expiryDays;
}
