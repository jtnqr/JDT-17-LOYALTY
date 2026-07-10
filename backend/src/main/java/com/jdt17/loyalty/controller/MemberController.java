package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.member.MemberPointsResponse;
import com.jdt17.loyalty.dto.member.MemberResponse;
import com.jdt17.loyalty.dto.member.PagedMemberResponse;
import com.jdt17.loyalty.dto.member.UpdateMemberRequest;
import com.jdt17.loyalty.service.MemberService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1/members")
@RequiredArgsConstructor
public class MemberController {
    private final MemberService memberService;

    @GetMapping
    public ResponseEntity<PagedMemberResponse> getAllMembers(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size,
            @RequestParam(required = false) String status
    ) {
        PagedMemberResponse response = memberService.getAllMembers(page, size, status);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<MemberResponse> getMemberById(@PathVariable UUID id) {
        MemberResponse response = memberService.getMemberById(id);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<MemberResponse> updateMember(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateMemberRequest request
    ) {
        MemberResponse response = memberService.updateMember(id, request);

        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}/points")
    public ResponseEntity<MemberPointsResponse> getMemberPoitnts(
            @PathVariable UUID id
    ) {
        MemberPointsResponse response = memberService.getMemberPoints(id);
        return ResponseEntity.ok(response);
    }
}
