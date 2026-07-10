package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;
import com.jdt17.loyalty.service.ExchangeRateService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.Collections;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ExchangeRateControllerTest {

    private MockMvc mockMvc;

    @Mock
    private ExchangeRateService exchangeRateService;

    @InjectMocks
    private ExchangeRateController exchangeRateController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    private UUID partnerAId;
    private UUID partnerBId;
    private UUID adminId;

    @BeforeEach
    void setUp() {
        objectMapper.registerModule(new JavaTimeModule());
        mockMvc = MockMvcBuilders.standaloneSetup(exchangeRateController).build();
        partnerAId = UUID.randomUUID();
        partnerBId = UUID.randomUUID();
        adminId = UUID.randomUUID();

        UsernamePasswordAuthenticationToken auth = new UsernamePasswordAuthenticationToken(
                adminId.toString(), null, Collections.emptyList()
        );
        SecurityContextHolder.getContext().setAuthentication(auth);
    }

    @Test
    void getActiveExchangeRates_Success() throws Exception {
        ExchangeRateResponse rate = ExchangeRateResponse.builder()
                .id(UUID.randomUUID())
                .fromPartnerId(partnerAId)
                .fromPartnerName("KFC")
                .fromPartnerCode("KFC")
                .toPartnerId(partnerBId)
                .toPartnerName("McD")
                .toPartnerCode("MCD")
                .rate(new BigDecimal("0.8000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        ListExchangeRateResponse response = new ListExchangeRateResponse(Collections.singletonList(rate));

        when(exchangeRateService.getActiveExchangeRates()).thenReturn(response);

        mockMvc.perform(get("/api/v1/exchange-rates"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.rates[0].rate").value(0.8000))
                .andExpect(jsonPath("$.rates[0].fromPartnerCode").value("KFC"));
    }

    @Test
    void createExchangeRate_Success() throws Exception {
        CreateExchangeRateRequest request = CreateExchangeRateRequest.builder()
                .fromPartnerId(partnerAId)
                .toPartnerId(partnerBId)
                .rate(new BigDecimal("0.9000"))
                .effectiveFrom(OffsetDateTime.now())
                .build();

        ExchangeRateResponse response = ExchangeRateResponse.builder()
                .id(UUID.randomUUID())
                .fromPartnerId(partnerAId)
                .toPartnerId(partnerBId)
                .rate(request.getRate())
                .effectiveFrom(request.getEffectiveFrom())
                .build();

        when(exchangeRateService.createExchangeRate(any(CreateExchangeRateRequest.class), eq(adminId)))
                .thenReturn(response);

        mockMvc.perform(post("/api/v1/exchange-rates")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.rate").value(0.9000));
    }
}
