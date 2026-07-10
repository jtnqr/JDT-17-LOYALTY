package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.member.MemberTransactionDetail;
import com.jdt17.loyalty.dto.member.MemberTransactionHistoryResponse;
import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.member.MemberPointsResponse;
import com.jdt17.loyalty.dto.member.MemberResponse;
import com.jdt17.loyalty.dto.member.PagedMemberResponse;
import com.jdt17.loyalty.dto.member.UpdateMemberRequest;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.entity.*;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.JWTService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;
import java.util.UUID;
import java.util.stream.Collectors;


@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final AdminRepository adminRepository;
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final AuditTrailService auditTrailService;
    private final PasswordEncoder passwordEncoder;
    private final JWTService jwtService;


    @Transactional
    public RegisterResponse registerMember(RegisterRequest request) {
        // checking email UNIQUE
        if (memberRepository.existsByEmail(request.getEmail())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Email already registered", "DUPLICATE_EMAIL");
        }

        // check phone number must be UNIQUE
        if(memberRepository.existsByPhone(request.getPhone())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Phone number already registered", "DUPLICATE_PHONE");
        }

        // Encrypt password
        String passwordHash = passwordEncoder.encode(request.getPassword());

        Member member = Member.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordHash)
                .status("ACTIVE")
                .build();

        Member savedMember = memberRepository.save(member);

        // bulk-seed 0 poin
        List<Partner> activePartners = partnerRepository.findByStatus("ACTIVE");
        for (Partner partner : activePartners) {
            PointBalance pointBalance = PointBalance.builder()
                    .member(savedMember)
                    .partner(partner)
                    .balance(0L)
                    .build();
            pointBalanceRepository.save(pointBalance);
        }

        // audit trails to TRX_AUDIT_TRAIL
        auditTrailService.logEvent("MEMBER_REGISTERED", null, "SYSTEM", "MEMBER", savedMember.getId(), null);

        String token = jwtService.generateToken(savedMember.getId().toString(), "MEMBER");

        // object response (RegisterResponse)
        RegisterResponse.UserDetails userDetails = RegisterResponse.UserDetails.builder()
                .id(savedMember.getId())
                .name(savedMember.getName())
                .email(savedMember.getEmail())
                .phone(savedMember.getPhone())
                .status(savedMember.getStatus())
                .createdAt(savedMember.getCreatedAt())
                .build();

        return RegisterResponse.builder()
                .token(token) // Token JWT will be generate after configutration
                .role("MEMBER")
                .user(userDetails)
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        Optional<Member> memberOpt = memberRepository.findByEmail(request.getEmail());
        if(memberOpt.isPresent()) {
            Member member = memberOpt.get();
            // check hash
            if (!passwordEncoder.matches(request.getPassword(), member.getPasswordHash())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS");
            }

            // ACTIVE?
            if ("INACTIVE".equalsIgnoreCase(member.getStatus())) {
                throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Member status is INACTIVE", "MEMBER_INACTIVE");
            }

            String token = jwtService.generateToken(member.getId().toString(), "MEMBER");

            return LoginResponse.builder()
                    .token(token) // token will be generated
                    .role("MEMBER")
                    .user(LoginResponse.UserDetails.builder()
                            .id(member.getId())
                            .name(member.getName())
                            .email(member.getEmail())
                            .status(member.getStatus())
                            .build())
                    .build();
        }

        // if member doesnt exists check on mst_admin
        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS");
            }
            if ("INACTIVE".equalsIgnoreCase(admin.getStatus())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, "Admin status is INACTIVE", "INVALID_CREDENTIALS");
            }

            String token = jwtService.generateToken(admin.getId().toString(), "ADMIN");

            return LoginResponse.builder()
                    .token(token) // token will be generated
                    .role("ADMIN")
                    .user(LoginResponse.UserDetails.builder()
                            .id(admin.getId())
                            .name(admin.getName())
                            .email(admin.getEmail())
                            .status(admin.getStatus())
                            .build())


                    .build();
        }

        throw new LoyaltyException(HttpStatus.UNAUTHORIZED, "Invalid email or password", "INVALID_CREDENTIALS");
    }

    // ============================================================
    // MEMBER MANAGEMENT METHODS (RESTORED)
    // ============================================================

    public PagedMemberResponse getAllMembers(int page, int size, String status) {
        Pageable pageable = PageRequest.of(page, size);
        Page<Member> memberPage;

        if (status != null && !status.trim().isEmpty()) {
            memberPage = memberRepository.findByStatus(status.toUpperCase(), pageable);
        } else {
            memberPage = memberRepository.findAll(pageable);
        }

        List<MemberResponse> data = memberPage.getContent().stream()
                .map(m -> MemberResponse.builder()
                        .id(m.getId())
                        .name(m.getName())
                        .email(m.getEmail())
                        .phone(m.getPhone())
                        .status(m.getStatus())
                        .createdAt(m.getCreatedAt())
                        .build())
                .collect(Collectors.toList());

        return PagedMemberResponse.builder()
                .data(data)
                .page(memberPage.getNumber())
                .size(memberPage.getSize())
                .total(memberPage.getTotalElements())
                .build();
    }

    public MemberResponse getMemberById(UUID id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName(); // sub = UUID String
        boolean isAdmin = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_ADMIN"));

        if (!isAdmin && !id.toString().equals(currentUserId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN");
        }

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        return MemberResponse.builder()
                .id(member.getId())
                .name(member.getName())
                .email(member.getEmail())
                .phone(member.getPhone())
                .status(member.getStatus())
                .createdAt(member.getCreatedAt())
                .build();
    }

    @Transactional
    public MemberResponse updateMember(UUID id, UpdateMemberRequest request) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String adminIdStr = authentication.getName(); // sub = UUID Admin
        UUID adminId = UUID.fromString(adminIdStr);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if (!request.getPhone().equals(member.getPhone())) {
            if (memberRepository.existsByPhone(request.getPhone())) {
                throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Phone number already registered", "DUPLICATE_PHONE");
            }
        }

        String oldStatus = member.getStatus();
        boolean statusChanged = !request.getStatus().equalsIgnoreCase(oldStatus);

        member.setName(request.getName());
        member.setPhone(request.getPhone());
        member.setStatus(request.getStatus().toUpperCase());
        Member updatedMember = memberRepository.save(member);

        auditTrailService.logEvent("MEMBER_UPDATED", adminId, "ADMIN", "MEMBER", updatedMember.getId(), null);

        if (statusChanged) {
            auditTrailService.logEvent("MEMBER_STATUS_CHANGED", adminId, "ADMIN", "MEMBER", updatedMember.getId(), null);
        }

        return MemberResponse.builder()
                .id(updatedMember.getId())
                .name(updatedMember.getName())
                .email(updatedMember.getEmail())
                .phone(updatedMember.getPhone())
                .status(updatedMember.getStatus())
                .createdAt(updatedMember.getCreatedAt())
                .build();
    }

    public MemberPointsResponse getMemberPoints(UUID id) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();

        boolean isMember = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        // must be MEMBER with same ID
        if (!isMember || !id.toString().equals(currentUserId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN");
        }

        // member must be registered
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        List<PointBalance> balances = pointBalanceRepository.findByMemberId(id);

        List<MemberPointsResponse.PointBalanceDetail>
                balanceDetails = balances.stream()
                .map(pb -> MemberPointsResponse.
                        PointBalanceDetail.builder()
                        .partnerId(pb.getPartner().
                                getId())
                        .partnerName(pb.getPartner().
                                getName())
                        .balance(pb.getBalance())
                        .build())
                .collect(Collectors.toList());

        return MemberPointsResponse.builder()
                .memberId(member.getId())
                .memberName(member.getName())
                .balances(balanceDetails)
                .build();

    }

    public MemberTransactionHistoryResponse getMemberTransactions(UUID id, int page, int size, String type) {
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentUserId = authentication.getName();

        boolean isMember = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_MEMBER"));

        // must be MEMBER with same ID
        if (!isMember || !id.toString().equals(currentUserId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN");
        }

        // member must be registered
        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if (type != null && !type.trim().isEmpty()) {
            String typeUpper = type.trim().toUpperCase();
            if (!List.of("EARN", "REDEEM", "EXCHANGE_IN", "EXCHANGE_OUT", "EXPIRED").contains(typeUpper)) {
                throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Invalid transaction type", "INVALID_TRANSACTION_TYPE");
            }
            type = typeUpper;
        } else {
            type = null;
        }

        org.springframework.data.domain.Pageable pageable = org.springframework.data.domain.PageRequest.of(page, size, org.springframework.data.domain.Sort.by("createdAt").descending());
        org.springframework.data.domain.Page<Transaction> txPage = transactionRepository.findByMemberIdAndType(id, type, pageable);

        List<MemberTransactionDetail> details = txPage.getContent().stream()
                .map(t -> {
                    UUID partnerId = null;
                    String partnerName = null;
                    if (t.getPartner() != null) {
                        partnerId = t.getPartner().getId();
                        partnerName = t.getPartner().getName();
                    }
                    return MemberTransactionDetail.builder()
                            .id(t.getId())
                            .type(t.getType())
                            .partnerId(partnerId)
                            .partnerName(partnerName)
                            .points(t.getPoints())
                            .trxAmountIDR(t.getTrxAmountIdr())
                            .expiresAt(t.getExpiresAt())
                            .createdAt(t.getCreatedAt())
                            .build();
                })
                .collect(Collectors.toList());

        return MemberTransactionHistoryResponse.builder()
                .memberId(member.getId())
                .page(txPage.getNumber())
                .size(txPage.getSize())
                .total(txPage.getTotalElements())
                .transactions(details)
                .build();
    }
}
