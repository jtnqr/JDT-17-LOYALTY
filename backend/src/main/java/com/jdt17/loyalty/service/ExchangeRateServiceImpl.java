package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;
import com.jdt17.loyalty.entity.ExchangeRate;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.ExchangeRateRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
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
public class ExchangeRateServiceImpl implements ExchangeRateService {

    private final ExchangeRateRepository exchangeRateRepository;
    private final PartnerRepository partnerRepository;
    private final AuditTrailService auditTrailService;

    @Override
    @Transactional(readOnly = true)
    public ListExchangeRateResponse getActiveExchangeRates() {
        List<ExchangeRate> rates = exchangeRateRepository.findAllActiveRates(OffsetDateTime.now());
        List<ExchangeRateResponse> dtos = rates.stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
        return new ListExchangeRateResponse(dtos);
    }

    @Override
    @Transactional
    public ExchangeRateResponse createExchangeRate(CreateExchangeRateRequest request, UUID adminId) {
        if (request.getFromPartnerId().equals(request.getToPartnerId())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "fromPartnerId cannot equal toPartnerId", "INVALID_EXCHANGE_RATE_PAIR");
        }

        Partner fromPartner = partnerRepository.findById(request.getFromPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "From partner not found", "PARTNER_NOT_FOUND"));

        Partner toPartner = partnerRepository.findById(request.getToPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "To partner not found", "PARTNER_NOT_FOUND"));

        if (!"ACTIVE".equals(fromPartner.getStatus()) || !"ACTIVE".equals(toPartner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Both partners must be active", "PARTNER_INACTIVE");
        }

        boolean exists = exchangeRateRepository.existsByFromPartnerIdAndToPartnerIdAndEffectiveFrom(
                request.getFromPartnerId(), request.getToPartnerId(), request.getEffectiveFrom()
        );
        if (exists) {
            throw new LoyaltyException(HttpStatus.CONFLICT, "Exchange rate for this pair and effective time already exists", "DUPLICATE_EXCHANGE_RATE");
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
                "ADMIN",
                "EXCHANGE_RATE",
                saved.getId(),
                saved
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
