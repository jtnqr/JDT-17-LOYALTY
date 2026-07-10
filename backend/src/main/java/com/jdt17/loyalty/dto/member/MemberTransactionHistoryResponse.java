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
public class MemberTransactionHistoryResponse {
    private UUID memberId;
    private int page;
    private int size;
    private long total;
    private List<MemberTransactionDetail> transactions;
}
