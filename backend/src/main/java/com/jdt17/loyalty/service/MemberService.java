package com.jdt17.loyalty.service;

import com.jdt17.loyalty.constant.AuditEventConstant;
import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.constant.TransactionTypeConstant;
import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.member.*;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.entity.*;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.JWTService;
import com.jdt17.loyalty.security.SecurityUtils;
import com.jdt17.loyalty.util.ValidationUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
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
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.DUPLICATE_EMAIL, ErrorCodeConstant.DUPLICATE_EMAIL);
        }

        // check phone number must be UNIQUE
        if (memberRepository.existsByPhone(request.getPhone())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.DUPLICATE_PHONE, ErrorCodeConstant.DUPLICATE_PHONE);
        }

        // Encrypt password
        String passwordHash = passwordEncoder.encode(request.getPassword());

        Member member = Member.builder()
                .name(request.getName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .passwordHash(passwordHash)
                .status(StatusConstant.ACTIVE)
                .build();

        Member savedMember = memberRepository.save(member);

        // bulk-seed 0 poin
        List<Partner> activePartners = partnerRepository.findByStatus(StatusConstant.ACTIVE);
        for (Partner partner : activePartners) {
            PointBalance pointBalance = PointBalance.builder()
                    .member(savedMember)
                    .partner(partner)
                    .balance(0L)
                    .build();
            pointBalanceRepository.save(pointBalance);
        }

        // audit trails to TRX_AUDIT_TRAIL
        auditTrailService.logEvent(AuditEventConstant.MEMBER_REGISTERED, null, RoleConstant.SYSTEM, AuditEventConstant.ENTITY_MEMBER, savedMember.getId(), null);

        String token = jwtService.generateToken(savedMember.getId().toString(), RoleConstant.MEMBER);

        RegisterResponse.UserDetails userDetails = RegisterResponse.UserDetails.builder()
                .id(savedMember.getId())
                .name(savedMember.getName())
                .email(savedMember.getEmail())
                .phone(savedMember.getPhone())
                .status(savedMember.getStatus())
                .createdAt(savedMember.getCreatedAt())
                .build();

        return RegisterResponse.builder()
                .token(token)
                .role(RoleConstant.MEMBER)
                .user(userDetails)
                .build();
    }

    public LoginResponse login(LoginRequest request) {
        Optional<Member> memberOpt = memberRepository.findByEmail(request.getEmail());
        if (memberOpt.isPresent()) {
            Member member = memberOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), member.getPasswordHash())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS);
            }

            ValidationUtils.validateMemberActive(member.getStatus());

            String token = jwtService.generateToken(member.getId().toString(), RoleConstant.MEMBER);

            return LoginResponse.builder()
                    .token(token)
                    .role(RoleConstant.MEMBER)
                    .user(LoginResponse.UserDetails.builder()
                            .id(member.getId())
                            .name(member.getName())
                            .email(member.getEmail())
                            .status(member.getStatus())
                            .build())
                    .build();
        }

        Optional<Admin> adminOpt = adminRepository.findByEmail(request.getEmail());
        if (adminOpt.isPresent()) {
            Admin admin = adminOpt.get();
            if (!passwordEncoder.matches(request.getPassword(), admin.getPasswordHash())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS);
            }
            if (StatusConstant.INACTIVE.equalsIgnoreCase(admin.getStatus())) {
                throw new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS);
            }

            String token = jwtService.generateToken(admin.getId().toString(), RoleConstant.ADMIN);

            return LoginResponse.builder()
                    .token(token)
                    .role(RoleConstant.ADMIN)
                    .user(LoginResponse.UserDetails.builder()
                            .id(admin.getId())
                            .name(admin.getName())
                            .email(admin.getEmail())
                            .status(admin.getStatus())
                            .build())
                    .build();
        }

        throw new LoyaltyException(HttpStatus.UNAUTHORIZED, ErrorMessageConstant.INVALID_CREDENTIALS, ErrorCodeConstant.INVALID_CREDENTIALS);
    }

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
        SecurityUtils.validateAdminOrSelfAccess(id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

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
        UUID adminId = SecurityUtils.getRequiredCurrentUserId();

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        if (!request.getPhone().equals(member.getPhone())) {
            if (memberRepository.existsByPhone(request.getPhone())) {
                throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.DUPLICATE_PHONE, ErrorCodeConstant.DUPLICATE_PHONE);
            }
        }

        String oldStatus = member.getStatus();
        boolean statusChanged = !request.getStatus().equalsIgnoreCase(oldStatus);

        member.setName(request.getName());
        member.setPhone(request.getPhone());
        member.setStatus(request.getStatus().toUpperCase());
        Member updatedMember = memberRepository.save(member);

        auditTrailService.logEvent(AuditEventConstant.MEMBER_UPDATED, adminId, RoleConstant.ADMIN, AuditEventConstant.ENTITY_MEMBER, updatedMember.getId(), null);

        if (statusChanged) {
            auditTrailService.logEvent(AuditEventConstant.MEMBER_STATUS_CHANGED, adminId, RoleConstant.ADMIN, AuditEventConstant.ENTITY_MEMBER, updatedMember.getId(), null);
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
        SecurityUtils.validateSelfMemberAccessOnly(id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        List<PointBalance> balances = pointBalanceRepository.findByMemberId(id);

        List<MemberPointsResponse.PointBalanceDetail> balanceDetails = balances.stream()
                .map(pb -> MemberPointsResponse.PointBalanceDetail.builder()
                        .partnerId(pb.getPartner().getId())
                        .partnerName(pb.getPartner().getName())
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
        SecurityUtils.validateSelfMemberAccessOnly(id);

        Member member = memberRepository.findById(id)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        if (type != null && !type.trim().isEmpty()) {
            String typeUpper = type.trim().toUpperCase();
            if (!List.of(TransactionTypeConstant.EARN, TransactionTypeConstant.REDEEM, TransactionTypeConstant.EXCHANGE_IN, TransactionTypeConstant.EXCHANGE_OUT, TransactionTypeConstant.EXPIRED).contains(typeUpper)) {
                throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.INVALID_TRANSACTION_TYPE, ErrorCodeConstant.INVALID_TRANSACTION_TYPE);
            }
            type = typeUpper;
        } else {
            type = null;
        }

        Pageable pageable = PageRequest.of(page, size, Sort.by("createdAt").descending());
        Page<Transaction> txPage = transactionRepository.findByMemberIdAndType(id, type, pageable);

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
