package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.datatype.jsr310.JavaTimeModule;
import com.jdt17.loyalty.dto.reward.ListRewardResponse;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.redeem.RedeemRequest;
import com.jdt17.loyalty.dto.redeem.RedeemResponse;
import com.jdt17.loyalty.dto.exchange.ExchangeRequest;
import com.jdt17.loyalty.dto.exchange.ExchangeResponse;
import com.jdt17.loyalty.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Map;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RedemptionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private RedemptionController redemptionController;

    private final ObjectMapper objectMapper = new ObjectMapper().registerModule(new JavaTimeModule());

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(redemptionController).build();
    }

    @Test
    void testGetRewards_Success() throws Exception {
        UUID partnerId = UUID.randomUUID();
        RewardResponse reward = RewardResponse.builder()
                .id(UUID.randomUUID())
                .partnerId(partnerId)
                .partnerName("KFC")
                .name("Chicken 1pc")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        ListRewardResponse response = ListRewardResponse.builder()
                .data(List.of(reward))
                .total(1L)
                .build();

        when(transactionService.getRewards(eq(partnerId))).thenReturn(response);

        mockMvc.perform(get("/api/v1/rewards")
                        .param("partnerId", partnerId.toString()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.total").value(1))
                .andExpect(jsonPath("$.data[0].name").value("Chicken 1pc"));
    }

    @Test
    void testRedeem_Success() throws Exception {
        UUID memberId = UUID.randomUUID();
        UUID rewardId = UUID.randomUUID();
        UUID txId = UUID.randomUUID();

        RedeemRequest request = RedeemRequest.builder()
                .rewardId(rewardId)
                .build();

        RedeemResponse response = RedeemResponse.builder()
                .transactionId(txId)
                .rewardName("Chicken 1pc")
                .partnerId(UUID.randomUUID())
                .partnerName("KFC")
                .pointsDeducted(250L)
                .newBalance(100L)
                .redeemedAt(OffsetDateTime.now())
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(transactionService.redeemReward(any(RedeemRequest.class), eq(memberId))).thenReturn(response);

        mockMvc.perform(post("/api/v1/redeem")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.transactionId").value(txId.toString()))
                .andExpect(jsonPath("$.rewardName").value("Chicken 1pc"))
                .andExpect(jsonPath("$.pointsDeducted").value(250));

        SecurityContextHolder.clearContext();
    }

    @Test
    void testExchange_Success() throws Exception {
        UUID memberId = UUID.randomUUID();
        UUID fromPartnerId = UUID.randomUUID();
        UUID toPartnerId = UUID.randomUUID();

        ExchangeRequest request = ExchangeRequest.builder()
                .fromPartnerId(fromPartnerId)
                .toPartnerId(toPartnerId)
                .points(100L)
                .build();

        ExchangeResponse response = ExchangeResponse.builder()
                .memberId(memberId)
                .fromPartner("KFC")
                .toPartner("McD")
                .pointsDeducted(100L)
                .pointsCredited(80L)
                .exchangeRate(0.8)
                .updatedBalances(Map.of("KFC", 400L, "McD", 380L))
                .outTransactionId(UUID.randomUUID())
                .inTransactionId(UUID.randomUUID())
                .exchangedAt(OffsetDateTime.now())
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(transactionService.exchangePoints(any(ExchangeRequest.class), eq(memberId))).thenReturn(response);

        mockMvc.perform(post("/api/v1/exchange")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.fromPartner").value("KFC"))
                .andExpect(jsonPath("$.pointsCredited").value(80));

        SecurityContextHolder.clearContext();
    }
}
