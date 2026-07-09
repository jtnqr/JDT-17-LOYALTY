package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.entity.Admin;
import com.jdt17.loyalty.entity.Member;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.JWTService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class MemberServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private AdminRepository adminRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PointBalanceRepository pointBalanceRepository;

    @Mock
    private AuditTrailRepository auditTrailRepository;

    @Mock
    private PasswordEncoder passwordEncoder;

    @Mock
    private JWTService jwtService;

    @InjectMocks
    private MemberService memberService;

    @Test
    void testRegisterMember_Success() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .phone("081234567890")
                .password("Member123!")
                .build();

        Partner kfc = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC")
                .code("KFC")
                .status("ACTIVE")
                .build();

        Partner mcd = Partner.builder()
                .id(UUID.randomUUID())
                .name("McD")
                .code("MCD")
                .status("ACTIVE")
                .build();

        when(memberRepository.existsByEmail(request.getEmail()))
                .thenReturn(false);

        when(memberRepository.existsByPhone(request.getPhone()))
                .thenReturn(false);

        when(passwordEncoder.encode(request.getPassword()))
                .thenReturn("encodedPassword");

        when(partnerRepository.findByStatus("ACTIVE"))
                .thenReturn(List.of(kfc, mcd));

        when(memberRepository.save(any(Member.class)))
                .thenAnswer(invocation -> {
                    Member savedMember = invocation.getArgument(0);
                    savedMember.setId(UUID.randomUUID());
                    return savedMember;
                });

        when(jwtService.generateToken(anyString(), eq("MEMBER")))
                .thenReturn("mockedToken");

        // Act
        RegisterResponse response = memberService.registerMember(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockedToken", response.getToken());
        assertEquals("MEMBER", response.getRole());
        assertEquals(request.getName(), response.getUser().getName());
        assertEquals(request.getEmail(), response.getUser().getEmail());
        assertEquals("ACTIVE", response.getUser().getStatus());

        verify(memberRepository).save(any(Member.class));

        // Menyimpan point balance awal untuk 2 partner
        verify(pointBalanceRepository, times(2)).save(any());

        // Menyimpan audit trail
        verify(auditTrailRepository).save(any());
    }

    @Test
    void testRegisterMember_DuplicateEmail() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
                .email("budi.santoso@example.com")
                .phone("081234567890")
                .build();

        when(memberRepository.existsByEmail(request.getEmail()))
                .thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.registerMember(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("DUPLICATE_EMAIL", exception.getCode());

        verify(memberRepository, never()).save(any());
    }

    @Test
    void testRegisterMember_DuplicatePhone() {
        // Arrange
        RegisterRequest request = RegisterRequest.builder()
                .email("budi.santoso@example.com")
                .phone("081234567890")
                .build();

        when(memberRepository.existsByEmail(request.getEmail()))
                .thenReturn(false);

        when(memberRepository.existsByPhone(request.getPhone()))
                .thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.registerMember(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("DUPLICATE_PHONE", exception.getCode());

        verify(memberRepository, never()).save(any());
    }

    // ============================================================
    // LOGIN TESTS
    // ============================================================

    @Test
    void testLogin_MemberSuccess() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("buditest@example.com")
                .password("Member123!")
                .build();

        Member member = Member.builder()
                .id(UUID.randomUUID())
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .passwordHash("encodedPassword")
                .status("ACTIVE")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(member));

        when(passwordEncoder.matches(request.getPassword(), member.getPasswordHash()))
                .thenReturn(true);

        when(jwtService.generateToken(anyString(), eq("MEMBER")))
                .thenReturn("mockedMemberToken");

        // Act
        LoginResponse response = memberService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockedMemberToken", response.getToken());
        assertEquals("MEMBER", response.getRole());
        assertEquals(member.getName(), response.getUser().getName());
        assertEquals(member.getEmail(), response.getUser().getEmail());
        assertEquals("ACTIVE", response.getUser().getStatus());

        verify(adminRepository, never()).findByEmail(any());
    }

    @Test
    void testLogin_AdminSuccess() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("admin@jdt17loyalty.com")
                .password("Admin123!")
                .build();

        Admin admin = Admin.builder()
                .id(UUID.randomUUID())
                .name("Admin PISTOS")
                .email("admin@jdt17loyalty.com")
                .passwordHash("encodedPassword")
                .status("ACTIVE")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());

        when(adminRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(admin));

        when(passwordEncoder.matches(request.getPassword(), admin.getPasswordHash()))
                .thenReturn(true);

        when(jwtService.generateToken(anyString(), eq("ADMIN")))
                .thenReturn("mockedAdminToken");

        // Act
        LoginResponse response = memberService.login(request);

        // Assert
        assertNotNull(response);
        assertEquals("mockedAdminToken", response.getToken());
        assertEquals("ADMIN", response.getRole());
        assertEquals(admin.getName(), response.getUser().getName());
        assertEquals(admin.getEmail(), response.getUser().getEmail());
        assertEquals("ACTIVE", response.getUser().getStatus());
    }

    @Test
    void testLogin_InvalidCredentials_MemberPasswordMismatch() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("budi.santoso@example.com")
                .password("WrongPassword")
                .build();

        Member member = Member.builder()
                .email("budi.santoso@example.com")
                .passwordHash("encodedPassword")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(member));

        when(passwordEncoder.matches(request.getPassword(), member.getPasswordHash()))
                .thenReturn(false);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.login(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
    }

    @Test
    void testLogin_MemberInactive() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("budi.santoso@example.com")
                .password("Member123!")
                .build();

        Member member = Member.builder()
                .email("budi.santoso@example.com")
                .passwordHash("encodedPassword")
                .status("INACTIVE")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(member));

        when(passwordEncoder.matches(request.getPassword(), member.getPasswordHash()))
                .thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.login(request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("MEMBER_INACTIVE", exception.getCode());
    }

    @Test
    void testLogin_UserNotFound() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("notfound@example.com")
                .password("Password123!")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());

        when(adminRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.login(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
    }
}