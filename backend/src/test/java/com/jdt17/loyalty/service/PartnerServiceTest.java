package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.partner.PartnerTokenRequest;
import com.jdt17.loyalty.dto.partner.PartnerTokenResponse;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.security.JWTService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.Optional;
import java.util.UUID;
import org.mockito.MockedStatic;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class PartnerServiceTest {

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private JWTService jwtService;

    @InjectMocks
    private PartnerService partnerService;

    @Test
    void testGetPartnerToken_Success() {
        // Arrange
        UUID partnerId = UUID.fromString("660e8400-e29b-41d4-a716-446655440001");
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("kfc_api_key_2026_secure_demo_only")
                .build();

        // SHA-256 hash of kfc_api_key_2026_secure_demo_only
        String storedHash = "2e4dacfd25f1a535ccc120c6a0cc00f6be0761f1eeb4befa475b0c10d3ee9e1c";

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC Indonesia")
                .code("KFC")
                .apiKey(storedHash)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.of(partner));

        when(jwtService.generatePartnerToken(partnerId.toString()))
                .thenReturn("mockedPartnerToken");

        // Act
        PartnerTokenResponse response = partnerService.getPartnerToken(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockedPartnerToken", response.getToken());
        assertEquals(3600, response.getExpiresIn());

        verify(partnerRepository).findById(partnerId);
        verify(jwtService).generatePartnerToken(partnerId.toString());
    }

    @Test
    void testGetPartnerToken_PartnerNotFound() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("any_api_key")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> partnerService.getPartnerToken(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
        assertEquals("Invalid partner credentials", exception.getMessage());

        verify(jwtService, never()).generatePartnerToken(any());
    }

    @Test
    void testGetPartnerToken_PartnerInactive() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("any_api_key")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .status("INACTIVE")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> partnerService.getPartnerToken(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());

        verify(jwtService, never()).generatePartnerToken(any());
    }

    @Test
    void testGetPartnerToken_InvalidApiKey() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("wrong_api_key")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .apiKey("some_stored_hash")
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> partnerService.getPartnerToken(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());

        verify(jwtService, never()).generatePartnerToken(any());
    }

    @Test
    void testGetPartnerToken_NoSuchAlgorithmException() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("any_api_key")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .apiKey("some_stored_hash")
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.of(partner));

        // Mock static MessageDigest to throw NoSuchAlgorithmException
        try (MockedStatic<MessageDigest> messageDigestMock = mockStatic(MessageDigest.class)) {
            messageDigestMock.when(() -> MessageDigest.getInstance("SHA-256"))
                    .thenThrow(new NoSuchAlgorithmException("Mocked SHA-256 exception"));

            // Act & Assert
            RuntimeException exception = assertThrows(
                    RuntimeException.class,
                    () -> partnerService.getPartnerToken(request)
            );

            assertEquals("SHA-256 algorithm not found", exception.getMessage());
        }
    }

    @Test
    void testGetPartnerToken_ApiKeyNull() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        PartnerTokenRequest request = PartnerTokenRequest.builder()
                .partnerId(partnerId)
                .apiKey("any_api_key")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .apiKey(null) // Database has null api_key
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId))
                .thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> partnerService.getPartnerToken(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());

        verify(jwtService, never()).generatePartnerToken(any());
    }
}
