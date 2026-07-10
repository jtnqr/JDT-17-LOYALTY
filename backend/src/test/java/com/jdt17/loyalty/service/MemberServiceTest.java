package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.member.MemberPointsResponse;
import com.jdt17.loyalty.dto.member.MemberResponse;
import com.jdt17.loyalty.dto.member.PagedMemberResponse;
import com.jdt17.loyalty.dto.member.UpdateMemberRequest;
import com.jdt17.loyalty.dto.member.MemberTransactionHistoryResponse;
import com.jdt17.loyalty.dto.member.MemberTransactionDetail;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.entity.Admin;
import com.jdt17.loyalty.entity.Member;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.PointBalance;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.JWTService;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.*;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.time.OffsetDateTime;

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
    private TransactionRepository transactionRepository;

    @Mock
    private AuditTrailService auditTrailService;

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
        verify(auditTrailService).logEvent(eq("MEMBER_REGISTERED"), eq(null), eq("SYSTEM"), eq("MEMBER"), any(), eq(null));
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

    @Test
    void testLogin_InvalidCredentials_AdminPasswordMismatch() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("admin@jdt17loyalty.com")
                .password("WrongPassword")
                .build();

        Admin admin = Admin.builder()
                .email("admin@jdt17loyalty.com")
                .passwordHash("encodedPassword")
                .status("ACTIVE")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());

        when(adminRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(admin));

        when(passwordEncoder.matches(request.getPassword(), admin.getPasswordHash()))
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
    void testLogin_AdminInactive() {
        // Arrange
        LoginRequest request = LoginRequest.builder()
                .email("admin@jdt17loyalty.com")
                .password("Admin123!")
                .build();

        Admin admin = Admin.builder()
                .email("admin@jdt17loyalty.com")
                .passwordHash("encodedPassword")
                .status("INACTIVE")
                .build();

        when(memberRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.empty());

        when(adminRepository.findByEmail(request.getEmail()))
                .thenReturn(Optional.of(admin));

        when(passwordEncoder.matches(request.getPassword(), admin.getPasswordHash()))
                .thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.login(request)
        );

        assertEquals(HttpStatus.UNAUTHORIZED, exception.getStatus());
        assertEquals("INVALID_CREDENTIALS", exception.getCode());
    }

    // ============================================================
    // MEMBER MANAGEMENT TESTS
    // ============================================================

    @Test
    void testGetAllMembers_NoFilter() {
        // Arrange
        Member member1 = Member.builder().id(UUID.randomUUID()).name("Budi").status("ACTIVE").build();
        Member member2 = Member.builder().id(UUID.randomUUID()).name("Siti").status("INACTIVE").build();
        Page<Member> pageResult = new PageImpl<>(List.of(member1, member2), PageRequest.of(0, 20), 2);

        when(memberRepository.findAll(any(Pageable.class)))
                .thenReturn(pageResult);

        // Act
        PagedMemberResponse response = memberService.getAllMembers(0, 20, null);

        // Assert
        assertNotNull(response);
        assertEquals(2, response.getData().size());
        assertEquals(2, response.getTotal());
        assertEquals(0, response.getPage());
        assertEquals(20, response.getSize());
        assertEquals("Budi", response.getData().get(0).getName());
        assertEquals("Siti", response.getData().get(1).getName());
    }

    @Test
    void testGetAllMembers_WithStatusFilter() {
        // Arrange
        Member member1 = Member.builder().id(UUID.randomUUID()).name("Budi").status("ACTIVE").build();
        Page<Member> pageResult = new PageImpl<>(List.of(member1), PageRequest.of(0, 20), 1);

        when(memberRepository.findByStatus(eq("ACTIVE"), any(Pageable.class)))
                .thenReturn(pageResult);

        // Act
        PagedMemberResponse response = memberService.getAllMembers(0, 20, "ACTIVE");

        // Assert
        assertNotNull(response);
        assertEquals(1, response.getData().size());
        assertEquals(1, response.getTotal());
        assertEquals("ACTIVE", response.getData().get(0).getStatus());
    }

    @Test
    void testGetMemberById_AdminAccessAnyMember() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .status("ACTIVE")
                .build();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(UUID.randomUUID().toString()); // Different ID
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.of(member));

        // Act
        MemberResponse response = memberService.getMemberById(memberId);

        // Assert
        assertNotNull(response);
        assertEquals("Budi Santoso", response.getName());
        assertEquals("ACTIVE", response.getStatus());

        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberById_MemberAccessOwn() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .status("ACTIVE")
                .build();

        // Mock Security Context as MEMBER owning the data
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString()); // Own ID matches
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.of(member));

        // Act
        MemberResponse response = memberService.getMemberById(memberId);

        // Assert
        assertNotNull(response);
        assertEquals("Budi Santoso", response.getName());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberById_MemberAccessOther_Forbidden() {
        // Arrange
        UUID memberId = UUID.randomUUID();

        // Mock Security Context as MEMBER accessing someone else's data
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(UUID.randomUUID().toString()); // ID mismatch
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberById(memberId)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        verify(memberRepository, never()).findById(any());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberById_NotFound() {
        // Arrange
        UUID memberId = UUID.randomUUID();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberById(memberId)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("MEMBER_NOT_FOUND", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateMember_Success() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .name("Budi S.")
                .phone("089876543210")
                .status("INACTIVE")
                .build();

        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .phone("081234567890")
                .status("ACTIVE")
                .createdAt(OffsetDateTime.now())
                .build();

        // Mock Security Context as ADMIN with specific adminId
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.of(member));

        when(memberRepository.existsByPhone(request.getPhone()))
                .thenReturn(false);

        when(memberRepository.save(any(Member.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MemberResponse response = memberService.updateMember(memberId, request);

        // Assert
        assertNotNull(response);
        assertEquals("Budi S.", response.getName());
        assertEquals("089876543210", response.getPhone());
        assertEquals("INACTIVE", response.getStatus());

        // Verify audit trails (two records saved because status changed from ACTIVE to INACTIVE)
        verify(auditTrailService).logEvent(eq("MEMBER_UPDATED"), eq(adminId), eq("ADMIN"), eq("MEMBER"), any(), eq(null));
        verify(auditTrailService).logEvent(eq("MEMBER_STATUS_CHANGED"), eq(adminId), eq("ADMIN"), eq("MEMBER"), any(), eq(null));

        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateMember_DuplicatePhone() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .name("Budi S.")
                .phone("089876543210")
                .status("ACTIVE")
                .build();

        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .phone("081234567890")
                .status("ACTIVE")
                .build();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.of(member));

        when(memberRepository.existsByPhone(request.getPhone()))
                .thenReturn(true);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.updateMember(memberId, request)
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("DUPLICATE_PHONE", exception.getCode());

        verify(memberRepository, never()).save(any());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateMember_NotFound() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .name("Budi S.")
                .phone("089876543210")
                .status("INACTIVE")
                .build();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.updateMember(memberId, request)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("MEMBER_NOT_FOUND", exception.getCode());

        verify(memberRepository, never()).save(any());
        SecurityContextHolder.clearContext();
    }

    @Test
    void testUpdateMember_PhoneAndStatusUnchanged() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        UUID adminId = UUID.randomUUID();
        UpdateMemberRequest request = UpdateMemberRequest.builder()
                .name("Budi New Name")
                .phone("081234567890") // Same phone
                .status("ACTIVE")      // Same status
                .build();

        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .phone("081234567890")
                .status("ACTIVE")
                .createdAt(OffsetDateTime.now())
                .build();

        // Mock Security Context as ADMIN
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(adminId.toString());
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId))
                .thenReturn(Optional.of(member));

        when(memberRepository.save(any(Member.class)))
                .thenAnswer(invocation -> invocation.getArgument(0));

        // Act
        MemberResponse response = memberService.updateMember(memberId, request);

        // Assert
        assertNotNull(response);
        assertEquals("Budi New Name", response.getName());
        assertEquals("081234567890", response.getPhone());
        assertEquals("ACTIVE", response.getStatus());

        // Verify existsByPhone is never called because phone was not changed
        verify(memberRepository, never()).existsByPhone(anyString());

        // Verify only 1 audit trail is saved (MEMBER_UPDATED)
        verify(auditTrailService).logEvent(eq("MEMBER_UPDATED"), eq(adminId), eq("ADMIN"), eq("MEMBER"), any(), eq(null));

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetAllMembers_EmptyStatusFilter() {
        // Arrange
        Member member = Member.builder().id(UUID.randomUUID()).name("Budi").status("ACTIVE").build();
        Page<Member> pageResult = new PageImpl<>(List.of(member), PageRequest.of(0, 20), 1);

        when(memberRepository.findAll(any(Pageable.class)))
                .thenReturn(pageResult);

        // Act - Call with empty string status
        PagedMemberResponse response = memberService.getAllMembers(0, 20, "   ");

        // Assert - Verify it falls back to findAll
        assertNotNull(response);
        assertEquals(1, response.getData().size());
        verify(memberRepository, times(1)).findAll(any(Pageable.class));
        verify(memberRepository, never()).findByStatus(anyString(), any(Pageable.class));
    }

    @Test
    void testGetMemberPoints_Success() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .email("budi.santoso@example.com")
                .status("ACTIVE")
                .build();

        Partner kfc = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC Indonesia")
                .build();

        PointBalance balance = PointBalance.builder()
                .member(member)
                .partner(kfc)
                .balance(500L)
                .build();

        // Mock Security Context as MEMBER (Own Access)
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        when(pointBalanceRepository.findByMemberId(memberId)).thenReturn(List.of(balance));

        // Act
        MemberPointsResponse response = memberService.getMemberPoints(memberId);

        // Assert
        assertNotNull(response);
        assertEquals(memberId, response.getMemberId());
        assertEquals("Budi Santoso", response.getMemberName());
        assertEquals(1, response.getBalances().size());
        assertEquals("KFC Indonesia", response.getBalances().get(0).getPartnerName());
        assertEquals(500L, response.getBalances().get(0).getBalance());

        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberPoints_Forbidden_NotOwner() {
        // Arrange
        UUID memberId = UUID.randomUUID();
        UUID otherMemberId = UUID.randomUUID();

        // Mock Security Context as MEMBER but accessing other member's ID
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(otherMemberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberPoints(memberId)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberPoints_Forbidden_AdminRole() {
        // Arrange
        UUID memberId = UUID.randomUUID();

        // Mock Security Context as ADMIN (Admin is explicitly forbidden)
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberPoints(memberId)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberPoints_MemberNotFound() {
        // Arrange
        UUID memberId = UUID.randomUUID();

        // Mock Security Context as MEMBER (Own Access)
        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        // Act & Assert
        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberPoints(memberId)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("MEMBER_NOT_FOUND", exception.getCode());

        // Clear security context
        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_Success() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .status("ACTIVE")
                .build();

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC Indonesia")
                .build();

        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID())
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(100L)
                .trxAmountIdr(100000L)
                .createdAt(java.time.OffsetDateTime.now())
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        org.springframework.data.domain.Page<Transaction> page = new org.springframework.data.domain.PageImpl<>(List.of(tx));
        when(transactionRepository.findByMemberIdAndType(eq(memberId), eq(null), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        MemberTransactionHistoryResponse response = memberService.getMemberTransactions(memberId, 0, 20, null);

        assertNotNull(response);
        assertEquals(memberId, response.getMemberId());
        assertEquals(1, response.getTransactions().size());
        assertEquals("EARN", response.getTransactions().get(0).getType());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_WithValidType() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .status("ACTIVE")
                .build();

        Partner partner = Partner.builder()
                .id(UUID.randomUUID())
                .name("KFC Indonesia")
                .build();

        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID())
                .member(member)
                .partner(partner)
                .type("EXCHANGE_IN")
                .points(100L)
                .createdAt(java.time.OffsetDateTime.now())
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        org.springframework.data.domain.Page<Transaction> page = new org.springframework.data.domain.PageImpl<>(List.of(tx));
        when(transactionRepository.findByMemberIdAndType(eq(memberId), eq("EXCHANGE_IN"), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        MemberTransactionHistoryResponse response = memberService.getMemberTransactions(memberId, 0, 20, "EXCHANGE_IN");

        assertNotNull(response);
        assertEquals(1, response.getTransactions().size());
        assertEquals("EXCHANGE_IN", response.getTransactions().get(0).getType());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_InvalidType() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .status("ACTIVE")
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));

        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberTransactions(memberId, 0, 20, "INVALID")
        );

        assertEquals(HttpStatus.BAD_REQUEST, exception.getStatus());
        assertEquals("INVALID_TRANSACTION_TYPE", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_Success_NullPartner() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .status("ACTIVE")
                .build();

        Transaction tx = Transaction.builder()
                .id(UUID.randomUUID())
                .member(member)
                .partner(null)
                .type("EARN")
                .points(100L)
                .trxAmountIdr(100000L)
                .createdAt(java.time.OffsetDateTime.now())
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        org.springframework.data.domain.Page<Transaction> page = new org.springframework.data.domain.PageImpl<>(List.of(tx));
        when(transactionRepository.findByMemberIdAndType(eq(memberId), eq(null), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        MemberTransactionHistoryResponse response = memberService.getMemberTransactions(memberId, 0, 20, null);

        assertNotNull(response);
        assertEquals(memberId, response.getMemberId());
        assertEquals(1, response.getTransactions().size());
        assertNull(response.getTransactions().get(0).getPartnerId());
        assertNull(response.getTransactions().get(0).getPartnerName());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_MemberNotFound() {
        UUID memberId = UUID.randomUUID();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.empty());

        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberTransactions(memberId, 0, 20, null)
        );

        assertEquals(HttpStatus.NOT_FOUND, exception.getStatus());
        assertEquals("MEMBER_NOT_FOUND", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_Forbidden_NotMemberRole() {
        UUID memberId = UUID.randomUUID();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_ADMIN"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberTransactions(memberId, 0, 20, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_InvalidType_EmptyOrWhitespace() {
        UUID memberId = UUID.randomUUID();
        Member member = Member.builder()
                .id(memberId)
                .name("Budi Santoso")
                .status("ACTIVE")
                .build();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(memberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        when(memberRepository.findById(memberId)).thenReturn(Optional.of(member));
        org.springframework.data.domain.Page<Transaction> page = new org.springframework.data.domain.PageImpl<>(List.of());
        when(transactionRepository.findByMemberIdAndType(eq(memberId), eq(null), any(org.springframework.data.domain.Pageable.class)))
                .thenReturn(page);

        MemberTransactionHistoryResponse response = memberService.getMemberTransactions(memberId, 0, 20, "   ");
        assertNotNull(response);
        assertTrue(response.getTransactions().isEmpty());

        SecurityContextHolder.clearContext();
    }

    @Test
    void testGetMemberTransactions_Forbidden() {
        UUID memberId = UUID.randomUUID();
        UUID otherMemberId = UUID.randomUUID();

        SecurityContext securityContext = mock(SecurityContext.class);
        Authentication authentication = mock(Authentication.class);
        when(securityContext.getAuthentication()).thenReturn(authentication);
        when(authentication.getName()).thenReturn(otherMemberId.toString());
        doReturn(List.of(new SimpleGrantedAuthority("ROLE_MEMBER"))).when(authentication).getAuthorities();
        SecurityContextHolder.setContext(securityContext);

        LoyaltyException exception = assertThrows(
                LoyaltyException.class,
                () -> memberService.getMemberTransactions(memberId, 0, 20, null)
        );

        assertEquals(HttpStatus.FORBIDDEN, exception.getStatus());
        assertEquals("FORBIDDEN", exception.getCode());

        SecurityContextHolder.clearContext();
    }
}