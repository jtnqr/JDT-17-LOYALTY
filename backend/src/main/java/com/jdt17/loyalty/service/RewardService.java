package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.reward.CreateRewardRequest;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.reward.UpdateRewardRequest;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class RewardService {

    private final RewardRepository rewardRepository;
    private final PartnerRepository partnerRepository;
    private final ImageStorageService imageStorageService;
    private final AuditTrailService auditTrailService;

    private UUID getActorId() {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        try {
            return UUID.fromString(authentication.getName());
        } catch (Exception e) {
            return null;
        }
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse createReward(CreateRewardRequest request) {
        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Partner does not exist", "PARTNER_NOT_FOUND"));

        Reward reward = Reward.builder()
                .partner(partner)
                .name(request.getName())
                .pointCost(request.getPointCost())
                .status("ACTIVE")
                .imageUrl(request.getImageUrl())
                .build();

        Reward saved = rewardRepository.save(reward);

        // Audit Trail
        auditTrailService.logEvent("REWARD_CREATED", getActorId(), "ADMIN", "REWARD", saved.getId(), null);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse updateReward(UUID id, UpdateRewardRequest request) {
        Reward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Reward does not exist", "REWARD_NOT_FOUND"));

        if (request.getName() != null) {
            reward.setName(request.getName());
        }
        if (request.getPointCost() != null) {
            reward.setPointCost(request.getPointCost());
        }
        if (request.getStatus() != null) {
            reward.setStatus(request.getStatus());
        }
        if (request.getImageUrl() != null) {
            reward.setImageUrl(request.getImageUrl());
        }

        Reward updated = rewardRepository.save(reward);

        // Audit Trail
        auditTrailService.logEvent("REWARD_UPDATED", getActorId(), "ADMIN", "REWARD", updated.getId(), null);

        return mapToResponse(updated);
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse uploadRewardImage(UUID id, MultipartFile file) throws IOException {
        Reward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Reward does not exist", "REWARD_NOT_FOUND"));

        // Delete old image if exists
        if (reward.getImageUrl() != null) {
            imageStorageService.delete(reward.getImageUrl());
        }

        // Store new image
        String imageUrl = imageStorageService.store(file, "rewards");
        reward.setImageUrl(imageUrl);
        Reward updated = rewardRepository.save(reward);

        // Audit Trail
        auditTrailService.logEvent("REWARD_IMAGE_UPLOADED", getActorId(), "ADMIN", "REWARD", updated.getId(), null);

        return mapToResponse(updated);
    }

    private RewardResponse mapToResponse(Reward reward) {
        return RewardResponse.builder()
                .id(reward.getId())
                .partnerId(reward.getPartner().getId())
                .partnerName(reward.getPartner().getName())
                .partnerCode(reward.getPartner().getCode())
                .name(reward.getName())
                .pointCost(reward.getPointCost())
                .status(reward.getStatus())
                .imageUrl(reward.getImageUrl())
                .build();
    }
}
