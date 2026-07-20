package com.jdt17.loyalty.service;

import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;
import com.jdt17.loyalty.entity.ExchangeRate;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.ExchangeRateRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.security.SecurityUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final PartnerRepository partnerRepository;
    private final AuditTrailService auditTrailService;

    @Transactional(readOnly = true)
    public ListExchangeRateResponse getActiveExchangeRates() {
        List<ExchangeRate> rates = exchangeRateRepository.findAllActiveRates(OffsetDateTime.now());
        List<ExchangeRateResponse> dtos = rates.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return new ListExchangeRateResponse(dtos);
    }

    @Transactional
    public ExchangeRateResponse createExchangeRate(CreateExchangeRateRequest request) {
        UUID adminId = SecurityUtils.getRequiredCurrentUserId();
        return createExchangeRate(request, adminId);
    }

    @Transactional
    public ExchangeRateResponse createExchangeRate(CreateExchangeRateRequest request, UUID adminId) {
        if (adminId == null) {
            adminId = SecurityUtils.getRequiredCurrentUserId();
        }

        if (request.getFromPartnerId().equals(request.getToPartnerId())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.INVALID_EXCHANGE_RATE_PAIR, ErrorCodeConstant.INVALID_EXCHANGE_RATE_PAIR);
        }

        Partner fromPartner = partnerRepository.findById(request.getFromPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        Partner toPartner = partnerRepository.findById(request.getToPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        if (!StatusConstant.ACTIVE.equals(fromPartner.getStatus()) || !StatusConstant.ACTIVE.equals(toPartner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.PARTNER_INACTIVE, ErrorCodeConstant.PARTNER_INACTIVE);
        }

        boolean exists = exchangeRateRepository.existsByFromPartnerIdAndToPartnerIdAndEffectiveFrom(
                request.getFromPartnerId(), request.getToPartnerId(), request.getEffectiveFrom()
        );
        if (exists) {
            throw new LoyaltyException(HttpStatus.CONFLICT, ErrorMessageConstant.DUPLICATE_EXCHANGE_RATE, ErrorCodeConstant.DUPLICATE_EXCHANGE_RATE);
        }

        ExchangeRate rate = ExchangeRate.builder()
                .fromPartner(fromPartner)
                .toPartner(toPartner)
                .rate(request.getRate())
                .effectiveFrom(request.getEffectiveFrom())
                .createdBy(adminId)
                .build();

        ExchangeRate saved = exchangeRateRepository.save(rate);

        auditTrailService.logEvent(
                "EXCHANGE_RATE_CREATED",
                adminId,
                RoleConstant.ADMIN,
                "EXCHANGE_RATE",
                saved.getId(),
                null
        );

        return mapToResponse(saved);
    }

    private ExchangeRateResponse mapToResponse(ExchangeRate rate) {
        return ExchangeRateResponse.builder()
                .id(rate.getId())
                .fromPartnerId(rate.getFromPartner().getId())
                .fromPartnerName(rate.getFromPartner().getName())
                .fromPartnerCode(rate.getFromPartner().getCode())
                .toPartnerId(rate.getToPartner().getId())
                .toPartnerName(rate.getToPartner().getName())
                .toPartnerCode(rate.getToPartner().getCode())
                .rate(rate.getRate())
                .effectiveFrom(rate.getEffectiveFrom())
                .build();
    }
}
