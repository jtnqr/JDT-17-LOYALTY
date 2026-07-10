package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;
import com.jdt17.loyalty.entity.ExchangeRate;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.ExchangeRateRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class ExchangeRateServiceTest {

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private AuditTrailService auditTrailService;

    @InjectMocks
    private ExchangeRateServiceImpl exchangeRateService;

    private Partner partnerA;
    private Partner partnerB;
    private Partner inactivePartner;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        partnerA = Partner.builder()
                .id(UUID.randomUUID())
                .name("Partner A")
                .code("PTRA")
                .status("ACTIVE")
                .build();
        partnerB = Partner.builder()
                .id(UUID.randomUUID())
                .name("Partner B")
                .code("PTRB")
                .status("ACTIVE")
                .build();
        inactivePartner = Partner.builder()
                .id(UUID.randomUUID())
                .name("Partner Inactive")
                .code("PTRI")
                .status("INACTIVE")
                .build();
    }

    @Test
    void getActiveExchangeRates_Success() {
        ExchangeRate rate = ExchangeRate.builder()
                .id(UUID.randomUUID())
                .fromPartner(partnerA)
                .toPartner(partnerB)
                .rate(new BigDecimal("0.8500"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        when(exchangeRateRepository.findAllActiveRates(any(OffsetDateTime.class)))
                .thenReturn(Collections.singletonList(rate));

        ListExchangeRateResponse response = exchangeRateService.getActiveExchangeRates();

        assertNotNull(response);
        assertEquals(1, response.getRates().size());
        assertEquals(rate.getId(), response.getRates().get(0).getId());
    }

    @Test
    void createExchangeRate_Success() {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerA.getId())
                .toPartnerId(partnerB.getId())
                .rate(new BigDecimal("0.9000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        when(partnerRepository.findById(partnerA.getId())).thenReturn(Optional.of(partnerA));
        when(partnerRepository.findById(partnerB.getId())).thenReturn(Optional.of(partnerB));
        when(exchangeRateRepository.existsByFromPartnerIdAndToPartnerIdAndEffectiveFrom(any(), any(), any()))
                .thenReturn(false);

        ExchangeRate rate = ExchangeRate.builder()
                .id(UUID.randomUUID())
                .fromPartner(partnerA)
                .toPartner(partnerB)
                .rate(request.getRate())
                .effectiveFrom(request.getEffectiveFrom())
                .build();

        when(exchangeRateRepository.save(any(ExchangeRate.class))).thenReturn(rate);

        ExchangeRateResponse response = exchangeRateService.createExchangeRate(request, adminId);

        assertNotNull(response);
        assertEquals(partnerA.getId(), response.getFromPartnerId());
        assertEquals(partnerB.getId(), response.getToPartnerId());
        verify(auditTrailService).logEvent(eq("EXCHANGE_RATE_CREATED"), eq(adminId), eq("ADMIN"), eq("EXCHANGE_RATE"), any(), any());
    }

    @Test
    void createExchangeRate_SamePartners_ThrowsException() {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerA.getId())
                .toPartnerId(partnerA.getId())
                .rate(new BigDecimal("1.0000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        LoyaltyException exception = assertThrows(LoyaltyException.class,
                () -> exchangeRateService.createExchangeRate(request, adminId));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("INVALID_EXCHANGE_RATE_PAIR", exception.getCode());
    }

    @Test
    void createExchangeRate_FromPartnerNotFound_ThrowsException() {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerA.getId())
                .toPartnerId(partnerB.getId())
                .rate(new BigDecimal("1.0000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        when(partnerRepository.findById(partnerA.getId())).thenReturn(Optional.empty());

        LoyaltyException exception = assertThrows(LoyaltyException.class,
                () -> exchangeRateService.createExchangeRate(request, adminId));

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("PARTNER_NOT_FOUND", exception.getCode());
    }

    @Test
    void createExchangeRate_InactivePartner_ThrowsException() {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerA.getId())
                .toPartnerId(inactivePartner.getId())
                .rate(new BigDecimal("1.0000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        when(partnerRepository.findById(partnerA.getId())).thenReturn(Optional.of(partnerA));
        when(partnerRepository.findById(inactivePartner.getId())).thenReturn(Optional.of(inactivePartner));

        LoyaltyException exception = assertThrows(LoyaltyException.class,
                () -> exchangeRateService.createExchangeRate(request, adminId));

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("PARTNER_INACTIVE", exception.getCode());
    }

    @Test
    void createExchangeRate_DuplicateRate_ThrowsException() {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerA.getId())
                .toPartnerId(partnerB.getId())
                .rate(new BigDecimal("1.0000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        when(partnerRepository.findById(partnerA.getId())).thenReturn(Optional.of(partnerA));
        when(partnerRepository.findById(partnerB.getId())).thenReturn(Optional.of(partnerB));
        when(exchangeRateRepository.existsByFromPartnerIdAndToPartnerIdAndEffectiveFrom(any(), any(), any()))
                .thenReturn(true);

        LoyaltyException exception = assertThrows(LoyaltyException.class,
                () -> exchangeRateService.createExchangeRate(request, adminId));

        assertEquals(HttpStatus.CONFLICT, exception.getStatus());
        assertEquals("DUPLICATE_EXCHANGE_RATE", exception.getCode());
    }
}
