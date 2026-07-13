package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.reward.CreateRewardRequest;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.reward.UpdateRewardRequest;
import com.jdt17.loyalty.service.RewardService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@RestController
@RequestMapping("/api/v1/rewards")
@RequiredArgsConstructor
public class RewardController {

    private final RewardService rewardService;

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RewardResponse> createReward(@Valid @RequestBody CreateRewardRequest request) {
        RewardResponse response = rewardService.createReward(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RewardResponse> updateReward(
            @PathVariable UUID id,
            @Valid @RequestBody UpdateRewardRequest request
    ) {
        RewardResponse response = rewardService.updateReward(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<RewardResponse> uploadRewardImage(
            @PathVariable UUID id,
            @RequestParam("image") MultipartFile file
    ) throws IOException {
        RewardResponse response = rewardService.uploadRewardImage(id, file);
        return ResponseEntity.ok(response);
    }
}
