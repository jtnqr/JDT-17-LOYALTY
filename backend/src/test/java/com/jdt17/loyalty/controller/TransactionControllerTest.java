package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.dto.transaction.EarnPointsRequest;
import com.jdt17.loyalty.dto.transaction.EarnPointsResponse;
import com.jdt17.loyalty.service.TransactionService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class TransactionControllerTest {

    private MockMvc mockMvc;

    @Mock
    private TransactionService transactionService;

    @InjectMocks
    private TransactionController transactionController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(transactionController).build();
    }

    @Test
    void testEarnPoints_Success() throws Exception {
        UUID transactionId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();

        EarnPointsRequest request = EarnPointsRequest.builder()
                .memberIdentifier("081234567890")
                .partner("KFC")
                .trxAmount(150000L)
                .build();

        EarnPointsResponse response = EarnPointsResponse.builder()
                .transactionId(transactionId)
                .memberId(memberId)
                .partner("KFC")
                .trxAmountIDR(150000L)
                .pointsEarned(150L)
                .newBalance(650L)
                .expiresAt(OffsetDateTime.now())
                .createdAt(OffsetDateTime.now())
                .build();

        when(transactionService.earnPoints(any(EarnPointsRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/transactions")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.transactionId").value(transactionId.toString()))
                .andExpect(jsonPath("$.memberId").value(memberId.toString()))
                .andExpect(jsonPath("$.partner").value("KFC"))
                .andExpect(jsonPath("$.trxAmountIDR").value(150000))
                .andExpect(jsonPath("$.pointsEarned").value(150))
                .andExpect(jsonPath("$.newBalance").value(650));
    }
}
