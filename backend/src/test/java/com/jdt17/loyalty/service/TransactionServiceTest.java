package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.transaction.EarnPointsRequest;
import com.jdt17.loyalty.dto.transaction.EarnPointsResponse;
import com.jdt17.loyalty.entity.Member;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.PointBalance;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.MemberRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.PointBalanceRepository;
import com.jdt17.loyalty.repository.TransactionRepository;
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

import java.time.OffsetDateTime;
import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PointBalanceRepository pointBalanceRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditTrailService auditTrailService;

    @InjectMocks
    private TransactionService transactionService;

    @Test
    void testEarnPoints_Success() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();

        EarnPointsRequest request = EarnPointsRequest.builder()
                .memberIdentifier("081234567890")
                .partner("KFC")
                .trxAmount(150000L)
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .name("KFC Indonesia")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .phone("081234567890")
                .status("ACTIVE")
                .build();

        PointBalance balance = PointBalance.builder()
                .member(member)
                .partner(partner)
                .balance(500L)
                .build();

        Transaction savedTx = Transaction.builder()
                .id(transactionId)
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(150L)
                .trxAmountIdr(150000L)
                .createdAt(OffsetDateTime.now())
                .build();

        // Mock Security Context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(partnerId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));
        when(memberRepository.findByPhone("081234567890")).thenReturn(Optional.of(member));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(memberId, partnerId)).thenReturn(Optional.of(balance));
        when(pointBalanceRepository.save(any(PointBalance.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(savedTx);

        // Act
        EarnPointsResponse response = transactionService.earnPoints(request);

        // Assert
        assertNotNull(response);
        assertEquals(transactionId, response.getTransactionId());
        assertEquals(memberId, response.getMemberId());
        assertEquals("KFC", response.getPartner());
        assertEquals(150000L, response.getTrxAmountIDR());
        assertEquals(150L, response.getPointsEarned());
        assertEquals(650L, response.getNewBalance());
        assertNotNull(response.getExpiresAt());

        verify(partnerRepository).findByCode("KFC");
        verify(memberRepository).findByPhone("081234567890");
        verify(pointBalanceRepository).save(any(PointBalance.class));
        verify(transactionRepository).save(any(Transaction.class));
        verify(auditTrailService).logEvent(eq("POINTS_EARNED"), eq(null), eq("SYSTEM"), eq("TRANSACTION"), eq(transactionId), eq(null));

        SecurityContextHolder.clearContext();
    }

    @Test
    void testEarnPoints_PartnerNotFound() {
        // Arrange
        EarnPointsRequest request = EarnPointsRequest.builder()
                .partner("KFC")
                .build();

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("PARTNER_NOT_FOUND", exception.getCode());
        verify(partnerRepository).findByCode("KFC");
        verify(memberRepository, never()).findByPhone(anyString());
    }

    @Test
    void testEarnPoints_PartnerInactive() {
        // Arrange
        EarnPointsRequest request = EarnPointsRequest.builder()
                .partner("KFC")
                .build();

        Partner partner = Partner.builder()
                .code("KFC")
                .status("INACTIVE")
                .build();

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("PARTNER_INACTIVE", exception.getCode());
        verify(partnerRepository).findByCode("KFC");
        verify(memberRepository, never()).findByPhone(anyString());
    }

    @Test
    void testEarnPoints_Forbidden_NotPartnerRole() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        EarnPointsRequest request = EarnPointsRequest.builder()
                .partner("KFC")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .status("ACTIVE")
                .build();

        // Mock Security Context as MEMBER
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testEarnPoints_Forbidden_WrongPartnerId() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        UUID wrongPartnerId = UUID.randomUUID();
        EarnPointsRequest request = EarnPointsRequest.builder()
                .partner("KFC")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .status("ACTIVE")
                .build();

        // Mock Security Context as wrong partner ID
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(wrongPartnerId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testEarnPoints_MemberNotFound() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        EarnPointsRequest request = EarnPointsRequest.builder()
                .memberIdentifier("081234567890")
                .partner("KFC")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .status("ACTIVE")
                .build();

        // Mock Security Context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(partnerId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));
        when(memberRepository.findByPhone("081234567890")).thenReturn(Optional.empty());
        when(memberRepository.findByEmail("081234567890")).thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("MEMBER_NOT_FOUND", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testEarnPoints_MemberInactive() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        EarnPointsRequest request = EarnPointsRequest.builder()
                .memberIdentifier("081234567890")
                .partner("KFC")
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .status("ACTIVE")
                .build();

        Member member = Member.builder()
                .id(UUID.randomUUID())
                .status("INACTIVE")
                .build();

        // Mock Security Context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(partnerId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));
        when(memberRepository.findByPhone("081234567890")).thenReturn(Optional.of(member));

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> transactionService.earnPoints(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("MEMBER_INACTIVE", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testEarnPoints_Success_NewPointBalance() {
        // Arrange
        UUID partnerId = UUID.randomUUID();
        UUID memberId = UUID.randomUUID();
        UUID transactionId = UUID.randomUUID();

        EarnPointsRequest request = EarnPointsRequest.builder()
                .memberIdentifier("081234567890")
                .partner("KFC")
                .trxAmount(150000L)
                .build();

        Partner partner = Partner.builder()
                .id(partnerId)
                .code("KFC")
                .name("KFC Indonesia")
                .pointPerThousandIdr(1)
                .expiryDays(365)
                .status("ACTIVE")
                .build();

        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .phone("081234567890")
                .status("ACTIVE")
                .build();

        Transaction savedTx = Transaction.builder()
                .id(transactionId)
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(150L)
                .trxAmountIdr(150000L)
                .createdAt(OffsetDateTime.now())
                .build();

        // Mock Security Context
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(partnerId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_PARTNER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(partnerRepository.findByCode("KFC")).thenReturn(Optional.of(partner));
        when(memberRepository.findByPhone("081234567890")).thenReturn(Optional.of(member));
        // Return empty to trigger the orElseGet block
        when(pointBalanceRepository.findByMemberIdAndPartnerId(memberId, partnerId)).thenReturn(Optional.empty());
        when(pointBalanceRepository.save(any(PointBalance.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(savedTx);

        // Act
        EarnPointsResponse response = transactionService.earnPoints(request);

        // Assert
        assertNotNull(response);
        assertEquals(transactionId, response.getTransactionId());
        assertEquals(memberId, response.getMemberId());
        assertEquals("KFC", response.getPartner());
        assertEquals(150000L, response.getTrxAmountIDR());
        assertEquals(150L, response.getPointsEarned());
        // Initial balance 0L + 150L points = 150L
        assertEquals(150L, response.getNewBalance());
        assertNotNull(response.getExpiresAt());

        verify(partnerRepository).findByCode("KFC");
        verify(memberRepository).findByPhone("081234567890");
        verify(pointBalanceRepository).save(any(PointBalance.class));
        verify(transactionRepository).save(any(Transaction.class));
        verify(auditTrailService).logEvent(eq("POINTS_EARNED"), eq(null), eq("SYSTEM"), eq("TRANSACTION"), eq(transactionId), eq(null));

        SecurityContextHolder.clearContext();
    }
}
