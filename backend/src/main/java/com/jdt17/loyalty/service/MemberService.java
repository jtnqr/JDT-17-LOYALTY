package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.entity.*;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.JWTService;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.Optional;


@Service
@RequiredArgsConstructor
public class MemberService {
    private final MemberRepository memberRepository;
    private final AdminRepository adminRepository;
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final AuditTrailRepository auditTrailRepository;
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
        AuditTrail auditTrail = AuditTrail.builder()
                .eventType("MEMBER_REGISTERED")
                .actorId(null) // actor for SYSTEM
                .actorType("SYSTEM")
                .entityType("MEMBER")
                .entityId(savedMember.getId())
                .payload(null)
                .build();
        auditTrailRepository.save(auditTrail);

        String token = jwtService.generateToken(savedMember.getEmail(), "MEMBER");

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

            String token =jwtService.generateToken(member.getEmail(), "MEMBER");

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

            String token = jwtService.generateToken(admin.getEmail(), "ADMIN");

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
}
