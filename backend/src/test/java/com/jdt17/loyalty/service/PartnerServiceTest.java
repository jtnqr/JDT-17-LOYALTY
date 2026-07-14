package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.partner.PartnerTokenRequest;
import com.jdt17.loyalty.dto.partner.PartnerTokenResponse;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.PointBalanceRepository;
import com.jdt17.loyalty.security.JWTService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import com.jdt17.loyalty.dto.partner.ListPartnerResponse;
import com.jdt17.loyalty.dto.partner.PartnerResponse;
import com.jdt17.loyalty.dto.partner.CreatePartnerRequest;
import com.jdt17.loyalty.dto.partner.UpdatePartnerRequest;
import org.springframework.mock.web.MockMultipartFile;
import java.io.IOException;
import java.util.List;

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
    private PointBalanceRepository pointBalanceRepository;

    @Mock
    private AuditTrailService auditTrailService;

    @Mock
    private JWTService jwtService;

    @Mock
    private ImageStorageService imageStorageService;

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

    @Test
    void testGetAllPartners_Success_Admin() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC Indonesia")
                .code("KFC")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findAll()).thenReturn(List.of(partner));

        // Act
        ListPartnerResponse response = partnerService.getAllPartners();

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("KFC Indonesia", response.getData().get(0).getName());
        assertEquals("KFC", response.getData().get(0).getCode());
        assertEquals(1, response.getData().get(0).getPointsPerThousandIDR());

        verify(partnerRepository, times(1)).findAll();

        // Cleanup
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetAllPartners_Success_Member() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        Partner partner = Partner.builder()
                .id(partnerId)
                .name("McDonald's Indonesia")
                .code("MCD")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        // Mock Security Context as MEMBER
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findAll()).thenReturn(List.of(partner));

        // Act
        ListPartnerResponse response = partnerService.getAllPartners();

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals("McDonald's Indonesia", response.getData().get(0).getName());

        verify(partnerRepository, times(1)).findAll();

        // Cleanup
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetAllPartners_Forbidden() {
        // Mock Security Context as PARTNER (should be forbidden)
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> partnerService.getAllPartners()
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        verify(partnerRepository, never()).findAll();

        // Cleanup
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_Success() {
        // Arrange
        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        UUID adminId = UUID.randomUUID();
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.existsByCode("SBUX")).thenReturn(false);

        Partner savedPartner = Partner.builder()
                .id(UUID.randomUUID())
                .name("Starbucks")
                .code("SBUX")
                .pointPerThousandIdr(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();

        when(partnerRepository.save(any(Partner.class))).thenReturn(savedPartner);

        // Act
        PartnerResponse response = partnerService.createPartner(request);

        // Assert
        assertNotNull(response);
        assertEquals(savedPartner.getId(), response.getId());
        assertEquals("Starbucks", response.getName());
        assertEquals("SBUX", response.getCode());
        assertEquals(2, response.getPointsPerThousandIDR());
        assertEquals(180, response.getExpiryDays());
        assertEquals("ACTIVE", response.getStatus());

        verify(partnerRepository).existsByCode("SBUX");
        verify(partnerRepository).save(any(Partner.class));
        verify(pointBalanceRepository).bulkInitPointBalances(savedPartner.getId());
        verify(auditTrailService).logEvent("PARTNER_CREATED", adminId, "ADMIN", "PARTNER", savedPartner.getId(), null);

        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_DuplicateCode() {
        // Arrange
        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.existsByCode("SBUX")).thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(LoyaltyException.class, () -> partnerService.createPartner(request));
        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("DUPLICATE_PARTNER_CODE", exception.getCode());

        verify(partnerRepository, never()).save(any());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdatePartner_Success() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        UpdatePartnerRequest request = UpdatePartnerRequest.builder()
                .name("KFC Indonesia Updated")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();

        UUID adminId = UUID.randomUUID();
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(any(Partner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        PartnerResponse response = partnerService.updatePartner(partnerId, request);

        // Assert
        assertNotNull(response);
        assertEquals("KFC Indonesia Updated", response.getName());
        assertEquals(2, response.getPointsPerThousandIDR());
        assertEquals(180, response.getExpiryDays());
        assertEquals("ACTIVE", response.getStatus());

        verify(partnerRepository).save(partner);
        verify(auditTrailService).logEvent("PARTNER_UPDATED", adminId, "ADMIN", "PARTNER", partnerId, null);

        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdatePartner_NotFound() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        UpdatePartnerRequest request = UpdatePartnerRequest.builder()
                .name("KFC Indonesia Updated")
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(LoyaltyException.class, () -> partnerService.updatePartner(partnerId, request));
        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("PARTNER_NOT_FOUND", exception.getCode());

        verify(partnerRepository, never()).save(any());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_AuthenticationNull() {
        SecurityContext securityContext = mock(SecurityContext.class);
        when(securityContext.getAuthentication()).thenReturn(null);
        SecurityContextHolder.setContext(securityContext);

        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        LoyaltyException exception = assertThrows(LoyaltyException.class, () -> partnerService.createPartner(request));
        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_Forbidden() {
        CreatePartnerRequest request = CreatePartnerRequest.builder().build();
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        LoyaltyException exception = assertThrows(LoyaltyException.class, () -> partnerService.createPartner(request));
        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_AuthenticationNameNull() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(null);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        Partner savedPartner = Partner.builder()
                .id(UUID.randomUUID())
                .name("Starbucks")
                .code("SBUX")
                .pointPerThousandIdr(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();
        when(partnerRepository.existsByCode("SBUX")).thenReturn(false);
        when(partnerRepository.save(any(Partner.class))).thenReturn(savedPartner);

        PartnerResponse response = partnerService.createPartner(request);
        assertNotNull(response);
        verify(auditTrailService).logEvent("PARTNER_CREATED", null, "ADMIN", "PARTNER", savedPartner.getId(), null);
        SecurityContextHolder.clearContext();
    }

    @Test
    void testCreatePartner_AuthenticationNameInvalidUUID() {
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("not-a-uuid");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        CreatePartnerRequest request = CreatePartnerRequest.builder()
                .name("Starbucks")
                .code("SBUX")
                .pointsPerThousandIDR(2)
                .expiryDays(180)
                .build();

        Partner savedPartner = Partner.builder()
                .id(UUID.randomUUID())
                .name("Starbucks")
                .code("SBUX")
                .pointPerThousandIdr(2)
                .expiryDays(180)
                .status("ACTIVE")
                .build();
        when(partnerRepository.existsByCode("SBUX")).thenReturn(false);
        when(partnerRepository.save(any(Partner.class))).thenReturn(savedPartner);

        PartnerResponse response = partnerService.createPartner(request);
        assertNotNull(response);
        verify(auditTrailService).logEvent("PARTNER_CREATED", null, "ADMIN", "PARTNER", savedPartner.getId(), null);
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdatePartner_FieldsOmitted() {
        UUID partnerId = UUID.randomUUID();
        UpdatePartnerRequest request = UpdatePartnerRequest.builder().build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(UUID.randomUUID().toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(any(Partner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PartnerResponse response = partnerService.updatePartner(partnerId, request);
        assertNotNull(response);
        assertEquals("KFC", response.getName());
        assertEquals(1, response.getPointsPerThousandIDR());
        assertEquals(365, response.getExpiryDays());
        assertEquals("ACTIVE", response.getStatus());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdatePartner_AuthenticationNameInvalidUUID() {
        UUID partnerId = UUID.randomUUID();
        UpdatePartnerRequest request = UpdatePartnerRequest.builder()
                .name("KFC Indonesia Updated")
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn("not-a-uuid");
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(partnerRepository.save(any(Partner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PartnerResponse response = partnerService.updatePartner(partnerId, request);
        assertNotNull(response);
        verify(auditTrailService).logEvent("PARTNER_UPDATED", null, "ADMIN", "PARTNER", partnerId, null);
        SecurityContextHolder.clearContext();
     }

    @Test
    void testUploadPartnerImage_Success() throws IOException {
        UUID partnerId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "logo.png", "image/png", new byte[]{1, 2, 3});

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(UUID.randomUUID().toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        Partner partner = Partner.builder()
                .id(partnerId)
                .name("KFC")
                .code("KFC")
                .logoUrl("/uploads/partners/old.png")
                .status("ACTIVE")
                .build();

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.of(partner));
        when(imageStorageService.store(file, "partners")).thenReturn("/uploads/partners/new.png");
        when(partnerRepository.save(any(Partner.class))).thenAnswer(invocation -> invocation.getArgument(0));

        PartnerResponse response = partnerService.uploadPartnerImage(partnerId, file);

        assertNotNull(response);
        assertEquals("/uploads/partners/new.png", response.getLogoUrl());
        verify(imageStorageService).delete("/uploads/partners/old.png");
        verify(auditTrailService).logEvent(eq("PARTNER_LOGO_UPLOADED"), any(), eq("ADMIN"), eq("PARTNER"), eq(partnerId), any());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testUploadPartnerImage_NotFound() {
        UUID partnerId = UUID.randomUUID();
        MockMultipartFile file = new MockMultipartFile("image", "logo.png", "image/png", new byte[]{1, 2, 3});

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findById(partnerId)).thenReturn(Optional.empty());

        assertThrows(LoyaltyException.class, () -> partnerService.uploadPartnerImage(partnerId, file));

        SecurityContextHolder.clearContext();
    }
}
