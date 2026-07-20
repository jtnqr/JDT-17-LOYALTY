package com.jdt17.loyalty.service;

import com.jdt17.loyalty.constant.*;
import com.jdt17.loyalty.dto.reward.CreateRewardRequest;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.reward.UpdateRewardRequest;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import com.jdt17.loyalty.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.http.HttpStatus;
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
        return SecurityUtils.getCurrentUserId();
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse createReward(CreateRewardRequest request) {
        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        Reward reward = Reward.builder()
                .partner(partner)
                .name(request.getName())
                .pointCost(request.getPointCost())
                .status(StatusConstant.ACTIVE)
                .imageUrl(request.getImageUrl())
                .build();

        Reward saved = rewardRepository.save(reward);

        // Audit Trail
        auditTrailService.logEvent(AuditEventConstant.REWARD_CREATED, getActorId(), RoleConstant.ADMIN, AuditEventConstant.ENTITY_REWARD, saved.getId(), null);

        return mapToResponse(saved);
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse updateReward(UUID id, UpdateRewardRequest request) {
        Reward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.REWARD_NOT_FOUND, ErrorCodeConstant.REWARD_NOT_FOUND));

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
        auditTrailService.logEvent(AuditEventConstant.REWARD_UPDATED, getActorId(), RoleConstant.ADMIN, AuditEventConstant.ENTITY_REWARD, updated.getId(), null);

        return mapToResponse(updated);
    }

    @Transactional
    @CacheEvict(value = "rewards", allEntries = true)
    public RewardResponse uploadRewardImage(UUID id, MultipartFile file) throws IOException {
        Reward reward = rewardRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.REWARD_NOT_FOUND, ErrorCodeConstant.REWARD_NOT_FOUND));

        // Delete old image if exists
        if (reward.getImageUrl() != null) {
            imageStorageService.delete(reward.getImageUrl());
        }

        // Store new image
        String imageUrl = imageStorageService.store(file, "rewards");
        reward.setImageUrl(imageUrl);
        Reward updated = rewardRepository.save(reward);

        // Audit Trail
        auditTrailService.logEvent(AuditEventConstant.REWARD_IMAGE_UPLOADED, getActorId(), RoleConstant.ADMIN, AuditEventConstant.ENTITY_REWARD, updated.getId(), null);

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
