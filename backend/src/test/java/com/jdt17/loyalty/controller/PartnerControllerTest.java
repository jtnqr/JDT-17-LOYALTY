package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.partner.ListPartnerResponse;
import com.jdt17.loyalty.dto.partner.PartnerResponse;
import com.jdt17.loyalty.service.PartnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PartnerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PartnerService partnerService;

    @InjectMocks
    private PartnerController partnerController;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(partnerController).build();
    }

    @Test
    void testGetAllPartners_Success() throws Exception {
        UUID partnerId = UUID.randomUUID();
        PartnerResponse partnerResponse = PartnerResponse.builder()
                .id(partnerId)
                .name("KFC Indonesia")
                .code("KFC")
                .pointsPerThousandIDR(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        ListPartnerResponse response = ListPartnerResponse.builder()
                .data(List.of(partnerResponse))
                .build();

        when(partnerService.getAllPartners()).thenReturn(response);

        mockMvc.perform(get("/api/v1/partners"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data[0].id").value(partnerId.toString()))
                .andExpect(jsonPath("$.data[0].name").value("KFC Indonesia"))
                .andExpect(jsonPath("$.data[0].code").value("KFC"))
                .andExpect(jsonPath("$.data[0].pointsPerThousandIDR").value(1))
                .andExpect(jsonPath("$.data[0].expiryDays").value(365))
                .andExpect(jsonPath("$.data[0].status").value("ACTIVE"));
    }
}
