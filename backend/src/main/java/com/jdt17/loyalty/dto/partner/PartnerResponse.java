package com.jdt17.loyalty.dto.partner;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.UUID;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PartnerResponse {
    private UUID id;
    private String name;
    private String code;
    private Integer pointsPerThousandIDR;
    private Integer expiryDays;
    private String status;
}
