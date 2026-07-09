package com.jdt17.loyalty.dto.member;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.util.List;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class PagedMemberResponse {
    private List<MemberResponse> data;
    private int page;
    private int size;
    private long total;
}
