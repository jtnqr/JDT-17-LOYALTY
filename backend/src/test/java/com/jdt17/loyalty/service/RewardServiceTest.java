package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.reward.CreateRewardRequest;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.reward.UpdateRewardRequest;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.mockito.junit.jupiter.MockitoSettings;
import org.mockito.quality.Strictness;
import org.springframework.http.HttpStatus;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;

import java.io.IOException;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
@MockitoSettings(strictness = Strictness.LENIENT)
class RewardServiceTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private ImageStorageService imageStorageService;

    @Mock
    private AuditTrailService auditTrailService;

    @InjectMocks
    private RewardService rewardService;

    private UUID adminId;

    @BeforeEach
    void setUp() {
        adminId = UUID.randomUUID();
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        SecurityContextHolder.setContext(securityContext);
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreateReward_Success() {
        UUID partnerId = UUID.randomUUID();
        CreateRewardRequest request = CreateRewardRequest.builder()
                .name("KFC Chicken")
                .pointCost(250)
                .partnerId(partnerId)
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(UUID.randomUUID())
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(rewardRepository.save(any(Reward.class))).thenReturn(reward);

        RewardResponse response = rewardService.createReward(request);

        assertNotNull(response);
        assertEquals("KFC Chicken", response.getName());
        assertEquals(250, response.getPointCost());
        assertEquals("ACTIVE", response.getStatus());
        assertEquals("KFC", response.getPartnerCode());
        verify(auditTrailService).logEvent(eq("REWARD_CREATED"), eq(adminId), eq("ADMIN"), eq("REWARD"), eq(reward.getId()), any());
    }

    @Test
    void testCreateReward_PartnerNotFound() {
        UUID partnerId = UUID.randomUUID();
        CreateRewardRequest request = CreateRewardRequest.builder()
                .name("KFC Chicken")
                .pointCost(250)
                .partnerId(partnerId)
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> rewardService.createReward(request));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testUpdateReward_Success() {
        UUID rewardId = UUID.randomUUID();
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .name("Updated Chicken")
                .pointCost(300)
                .status("INACTIVE")
                .build();

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(rewardId)
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(rewardRepository.save(any(Reward.class))).thenAnswer(i -> i.getArguments()[0]);

        RewardResponse response = rewardService.updateReward(rewardId, request);

        assertNotNull(response);
        assertEquals("Updated Chicken", response.getName());
        assertEquals(300, response.getPointCost());
        assertEquals("INACTIVE", response.getStatus());
        verify(auditTrailService).logEvent(eq("REWARD_UPDATED"), eq(adminId), eq("ADMIN"), eq("REWARD"), eq(rewardId), any());
    }

    @Test
    void testUpdateReward_NotFound() {
        UUID rewardId = UUID.randomUUID();
        UpdateRewardRequest request = UpdateRewardRequest.builder().build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> rewardService.updateReward(rewardId, request));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("REWARD_NOT_FOUND", ex.getCode());
    }

    @Test
    void testUploadRewardImage_Success() throws IOException {
        UUID rewardId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "chicken.jpg", "image/jpeg", new byte[]{1, 2, 3});

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(rewardId)
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .imageUrl("/uploads/rewards/old.jpg")
                .build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(imageStorageService.store(file, "rewards")).thenReturn("/uploads/rewards/new.jpg");
        when(rewardRepository.save(any(Reward.class))).thenAnswer(i -> i.getArguments()[0]);

        RewardResponse response = rewardService.uploadRewardImage(rewardId, file);

        assertNotNull(response);
        assertEquals("/uploads/rewards/new.jpg", response.getImageUrl());
        verify(imageStorageService).delete("/uploads/rewards/old.jpg");
        verify(auditTrailService).logEvent(eq("REWARD_IMAGE_UPLOADED"), eq(adminId), eq("ADMIN"), eq("REWARD"), eq(rewardId), any());
    }

    @Test
    void testUploadRewardImage_NotFound() {
        UUID rewardId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "chicken.jpg", "image/jpeg", new byte[]{1, 2, 3});

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> rewardService.uploadRewardImage(rewardId, file));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("REWARD_NOT_FOUND", ex.getCode());
    }

    @Test
    void testUpdateReward_PartialUpdate() {
        UUID rewardId = UUID.randomUUID();
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .name(null)
                .pointCost(null)
                .status("INACTIVE")
                .imageUrl("http://example.com/new-pic.jpg")
                .build();

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(rewardId)
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .imageUrl("http://example.com/old-pic.jpg")
                .build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(rewardRepository.save(any(Reward.class))).thenAnswer(i -> i.getArguments()[0]);

        RewardResponse response = rewardService.updateReward(rewardId, request);

        assertNotNull(response);
        assertEquals("KFC Chicken", response.getName()); // unchanged because null in request
        assertEquals(250, response.getPointCost()); // unchanged because null in request
        assertEquals("INACTIVE", response.getStatus()); // changed
        assertEquals("http://example.com/new-pic.jpg", response.getImageUrl()); // changed
    }

    @Test
    void testUpdateReward_AllFieldsNull() {
        UUID rewardId = UUID.randomUUID();
        UpdateRewardRequest request = UpdateRewardRequest.builder()
                .name(null)
                .pointCost(null)
                .status(null)
                .build();

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(rewardId)
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(rewardRepository.save(any(Reward.class))).thenAnswer(i -> i.getArguments()[0]);

        RewardResponse response = rewardService.updateReward(rewardId, request);

        assertNotNull(response);
        assertEquals("KFC Chicken", response.getName());
        assertEquals(250, response.getPointCost());
        assertEquals("ACTIVE", response.getStatus());
    }

    @Test
    void testUploadRewardImage_Success_NoExistingImage() throws IOException {
        UUID rewardId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "chicken.jpg", "image/jpeg", new byte[]{1, 2, 3});

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(rewardId)
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .imageUrl(null) // no existing image
                .build();

        when(rewardRepository.findById(rewardId)).thenReturn(Optional.of(reward));
        when(imageStorageService.store(file, "rewards")).thenReturn("/uploads/rewards/new.jpg");
        when(rewardRepository.save(any(Reward.class))).thenAnswer(i -> i.getArguments()[0]);

        RewardResponse response = rewardService.uploadRewardImage(rewardId, file);

        assertNotNull(response);
        assertEquals("/uploads/rewards/new.jpg", response.getImageUrl());
        verify(imageStorageService, never()).delete(anyString()); // verify delete is never called
    }

    @Test
    void testGetActorId_Exception() {
        // Set security context with non-UUID string
        Authentication authentication = mock(Authentication.class);
        when(authentication.getName()).thenReturn("not-a-uuid");
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        SecurityContextHolder.setContext(securityContext);

        UUID partnerId = UUID.randomUUID();
        CreateRewardRequest request = CreateRewardRequest.builder()
                .name("KFC Chicken")
                .pointCost(250)
                .partnerId(partnerId)
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .build();

        Reward reward = Reward.builder()
                .id(UUID.randomUUID())
                .partner(partner)
                .name("KFC Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(rewardRepository.save(any(Reward.class))).thenReturn(reward);

        RewardResponse response = rewardService.createReward(request);
        assertNotNull(response);
        // Verify audit log has null actorId because of UUID format exception
        verify(auditTrailService).logEvent(eq("REWARD_CREATED"), eq(null), eq("ADMIN"), eq("REWARD"), eq(reward.getId()), any());
    }
}
