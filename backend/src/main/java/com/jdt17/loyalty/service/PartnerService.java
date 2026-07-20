package com.jdt17.loyalty.service;

import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.dto.partner.*;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.PointBalanceRepository;
import com.jdt17.loyalty.security.JWTService;
import com.jdt17.loyalty.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.CacheEvict;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class PartnerService {
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final AuditTrailService auditTrailService;
    private final JWTService jwtService;
    private final ImageStorageService imageStorageService;

    private void verifyAdmin() {
        if (!SecurityUtils.isAdmin()) {
            throw new LoyaltyException(
                    SecurityUtils.getAuthentication() == null ? HttpStatus.UNAUTHORIZED : HttpStatus.FORBIDDEN,
                    SecurityUtils.getAuthentication() == null ? ErrorMessageConstant.UNAUTHORIZED : ErrorMessageConstant.FORBIDDEN,
                    SecurityUtils.getAuthentication() == null ? ErrorCodeConstant.UNAUTHORIZED : ErrorCodeConstant.FORBIDDEN
            );
        }
    }

    private UUID getActorId() {
        return SecurityUtils.getCurrentUserId();
    }

    @Transactional
    @CacheEvict(value = "partners", allEntries = true)
    public PartnerResponse createPartner(CreatePartnerRequest request) {
        verifyAdmin();

        if (partnerRepository.existsByCode(request.getCode())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.DUPLICATE_PARTNER_CODE, ErrorCodeConstant.DUPLICATE_PARTNER_CODE);
        }

        Partner partner = Partner.builder()
                .name(request.getName())
                .code(request.getCode())
                .pointPerThousandIdr(request.getPointsPerThousandIDR())
                .expiryDays(request.getExpiryDays())
                .status(StatusConstant.ACTIVE)
                .build();

        Partner savedPartner = partnerRepository.save(partner);

        // Bulk init point balances for active members
        pointBalanceRepository.bulkInitPointBalances(savedPartner.getId());

        // Audit Trail
        auditTrailService.logEvent("PARTNER_CREATED", getActorId(), RoleConstant.ADMIN, "PARTNER", savedPartner.getId(), null);

        return PartnerResponse.builder()
                .id(savedPartner.getId())
                .name(savedPartner.getName())
                .code(savedPartner.getCode())
                .pointsPerThousandIDR(savedPartner.getPointPerThousandIdr())
                .expiryDays(savedPartner.getExpiryDays())
                .status(savedPartner.getStatus())
                .logoUrl(savedPartner.getLogoUrl())
                .build();
    }

    @Transactional
    @CacheEvict(value = "partners", allEntries = true)
    public PartnerResponse updatePartner(UUID id, UpdatePartnerRequest request) {
        verifyAdmin();

        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        if (request.getName() != null) {
            partner.setName(request.getName());
        }
        if (request.getPointsPerThousandIDR() != null) {
            partner.setPointPerThousandIdr(request.getPointsPerThousandIDR());
        }
        if (request.getExpiryDays() != null) {
            partner.setExpiryDays(request.getExpiryDays());
        }
        if (request.getStatus() != null) {
            partner.setStatus(request.getStatus());
        }

        Partner updatedPartner = partnerRepository.save(partner);

        // Audit Trail
        auditTrailService.logEvent("PARTNER_UPDATED", getActorId(), RoleConstant.ADMIN, "PARTNER", updatedPartner.getId(), null);

        return PartnerResponse.builder()
                .id(updatedPartner.getId())
                .name(updatedPartner.getName())
                .code(updatedPartner.getCode())
                .pointsPerThousandIDR(updatedPartner.getPointPerThousandIdr())
                .expiryDays(updatedPartner.getExpiryDays())
                .status(updatedPartner.getStatus())
                .logoUrl(updatedPartner.getLogoUrl())
                .build();
    }

    public PartnerTokenResponse getPartnerToken(PartnerTokenRequest request) {
        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_PARTNER_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS));

        if (!StatusConstant.ACTIVE.equalsIgnoreCase(partner.getStatus())) {
            throw new LoyaltyException(
                    HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_PARTNER_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS
            );
        }

        String hashedInputKey = hashSHA256(request.getApiKey());

        if (partner.getApiKey() == null || !partner.getApiKey().equalsIgnoreCase(hashedInputKey)) {
            throw new LoyaltyException(
                    HttpStatus.UNAUTHORIZED,
                    ErrorMessageConstant.INVALID_PARTNER_CREDENTIALS,
                    ErrorCodeConstant.INVALID_CREDENTIALS
            );
        }

        String token = jwtService.generatePartnerToken(partner.getId().toString());

        return PartnerTokenResponse.builder()
                .token(token)
                .expiresIn(3600)
                .build();
    }

    private String hashSHA256(String data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data.getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }

    @Cacheable("partners")
    public ListPartnerResponse getAllPartners() {
        boolean isAuthorized = SecurityUtils.isAdmin() || SecurityUtils.isMember();

        if (!isAuthorized) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, ErrorMessageConstant.FORBIDDEN, ErrorCodeConstant.FORBIDDEN);
        }

        List<Partner> partners = partnerRepository.findAll();

        List<PartnerResponse> partnerResponses = partners.stream()
                .map(p -> PartnerResponse.builder()
                        .id(p.getId())
                        .name(p.getName())
                        .code(p.getCode())
                        .pointsPerThousandIDR(p.getPointPerThousandIdr())
                        .expiryDays(p.getExpiryDays())
                        .status(p.getStatus())
                        .logoUrl(p.getLogoUrl())
                        .build())
                .collect(Collectors.toList());

        return ListPartnerResponse.builder()
                .data(partnerResponses)
                .build();
    }

    @Transactional
    @CacheEvict(value = "partners", allEntries = true)
    public PartnerResponse uploadPartnerImage(UUID id, MultipartFile file) throws IOException {
        verifyAdmin();

        Partner partner = partnerRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        if (partner.getLogoUrl() != null) {
            imageStorageService.delete(partner.getLogoUrl());
        }

        String logoUrl = imageStorageService.store(file, "partners");
        partner.setLogoUrl(logoUrl);
        Partner saved = partnerRepository.save(partner);

        // Audit Trail
        auditTrailService.logEvent("PARTNER_LOGO_UPLOADED", getActorId(), RoleConstant.ADMIN, "PARTNER", saved.getId(), null);

        return PartnerResponse.builder()
                .id(saved.getId())
                .name(saved.getName())
                .code(saved.getCode())
                .pointsPerThousandIDR(saved.getPointPerThousandIdr())
                .expiryDays(saved.getExpiryDays())
                .status(saved.getStatus())
                .logoUrl(saved.getLogoUrl())
                .build();
    }
}
