package com.jdt17.loyalty.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.jdt17.loyalty.dto.reward.CreateRewardRequest;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.reward.UpdateRewardRequest;
import com.jdt17.loyalty.service.RewardService;
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

import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class RewardControllerTest {

    private MockMvc mockMvc;

    @Mock
    private RewardService rewardService;

    @InjectMocks
    private RewardController rewardController;

    private final ObjectMapper objectMapper = new ObjectMapper();

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(rewardController).build();
    }

    @Test
    void testCreateReward_Success() throws Exception {
        UUID partnerId = UUID.randomUUID();
        CreateRewardRequest request = CreateRewardRequest.builder()
                .name("KFC Chicken")
                .pointCost(250)
                .partnerId(partnerId)
                .build();

        UUID rewardId = UUID.randomUUID();
        RewardResponse response = RewardResponse.builder()
                .id(rewardId)
                .partnerId(partnerId)
                .partnerName("KFC")
                .partnerCode("KFC")
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        when(rewardService.createReward(any(CreateRewardRequest.class))).thenReturn(response);

        mockMvc.perform(post("/api/v1/rewards")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.id").value(rewardId.toString()))
                .andExpect(jsonPath("$.name").value("KFC Chicken"))
                .andExpect(jsonPath("$.pointCost").value(250))
                .andExpect(jsonPath("$.status").value("ACTIVE"));
    }

    @Test
    void testUpdateReward_Success() throws Exception {
        UUID rewardId = UUID.randomUUID();
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .name("Updated Chicken")
                .pointCost(300)
                .status("INACTIVE")
                .build();

        RewardResponse response = RewardResponse.builder()
                .id(rewardId)
                .name("Updated Chicken")
                .pointCost(300)
                .status("INACTIVE")
                .build();

        when(rewardService.updateReward(eq(rewardId), any(UpdateRewardRequest.class))).thenReturn(response);

        mockMvc.perform(put("/api/v1/rewards/" + rewardId)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(objectMapper.writeValueAsString(request)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.id").value(rewardId.toString()))
                .andExpect(jsonPath("$.name").value("Updated Chicken"))
                .andExpect(jsonPath("$.pointCost").value(300))
                .andExpect(jsonPath("$.status").value("INACTIVE"));
    }

    @Test
    void testUploadRewardImage_Success() throws Exception {
        UUID rewardId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "pic.jpg", "image/jpeg", new byte[]{1, 2, 3});

        RewardResponse response = RewardResponse.builder()
                .id(rewardId)
                .imageUrl("/uploads/rewards/pic.jpg")
                .build();

        when(rewardService.uploadRewardImage(eq(rewardId), any())).thenReturn(response);

        mockMvc.perform(MockMvcRequestBuilders.multipart("/api/v1/rewards/" + rewardId + "/image")
                        .file(file)
                        .with(request -> { request.setMethod("PUT"); return request; }))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.imageUrl").value("/uploads/rewards/pic.jpg"));
    }
}
