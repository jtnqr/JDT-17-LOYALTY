package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.dto.partner.CreatePartnerRequest;
import com.jdt17.loyalty.dto.partner.ListPartnerResponse;
import com.jdt17.loyalty.dto.partner.PartnerResponse;
import com.jdt17.loyalty.dto.partner.UpdatePartnerRequest;
import com.jdt17.loyalty.service.PartnerService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.MockMvcRequestBuilders;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class PartnerControllerTest {

    private MockMvc mockMvc;

    @Mock
    private PartnerService partnerService;

    @InjectMocks
    private PartnerController partnerController;

    private final ObjectMapper objectMapper = new ObjectMapper();

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

    @Test
    void testCreatePartner_Success() throws Exception {
        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        UUID partnerId = UUID.randomUUID();
        PartnerResponse response = PartnerResponse.builder()
                .id(partnerId)
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();

        when(partnerService.createPartner(any(CreatePartnerRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/partners")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(partnerId.toString()))
                .andExpect(jsonPath("$.name").value("Starbucks"))
                .andExpect(jsonPath("$.code").value("SBUX"))
                .andExpect(jsonPath("$.pointsPerThousandIDR").value(2))
                .andExpect(jsonPath("$.expiryDays").value(180))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testUpdatePartner_Success() throws Exception {
        UUID partnerId = UUID.randomUUID();
        UpdatePartnerRequest request = UpdatePartnerRequest.builder()
                .name("KFC Indonesia Updated")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();

        PartnerResponse response = PartnerResponse.builder()
                .id(partnerId)
                .name("KFC Indonesia Updated")
                .code("KFC")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();

        when(partnerService.updatePartner(eq(partnerId), any(UpdatePartnerRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/partners/{id}", partnerId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(partnerId.toString()))
                .andExpect(jsonPath("$.name").value("KFC Indonesia Updated"))
                .andExpect(jsonPath("$.code").value("KFC"))
                .andExpect(jsonPath("$.pointsPerThousandIDR").value(2))
                .andExpect(jsonPath("$.expiryDays").value(180))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testUploadPartnerImage_Success() throws Exception {
        UUID partnerId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "logo.png", "image/png", new byte[]{1, 2, 3});

        PartnerResponse response = PartnerResponse.builder()
                .id(partnerId)
                .name("KFC")
                .logoUrl("/uploads/partners/logo.png")
                .build();

        when(partnerService.uploadPartnerImage(eq(partnerId), any())).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/partners/" + partnerId + "/image")
                        .file(file)
                        .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.logoUrl").value("/uploads/partners/logo.png"));
    }
}
