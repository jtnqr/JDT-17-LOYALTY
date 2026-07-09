package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.login.LoginRequest;
import com.jdt17.loyalty.dto.login.LoginResponse;
import com.jdt17.loyalty.dto.partner.PartnerTokenRequest;
import com.jdt17.loyalty.dto.partner.PartnerTokenResponse;
import com.jdt17.loyalty.dto.register.RegisterRequest;
import com.jdt17.loyalty.dto.register.RegisterResponse;
import com.jdt17.loyalty.service.MemberService;
import com.jdt17.loyalty.service.PartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/auth")
@RequiredArgsConstructor
public class AuthController {
    private final MemberService memberService;
    private final PartnerService partnerService;

    @PostMapping("/register")
    public ResponseEntity<RegisterResponse> register(@Valid @RequestBody RegisterRequest request) {
        RegisterResponse response = memberService.registerMember(request);
        return new ResponseEntity<>(response, HttpStatus.CREATED);
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponse> login(@Valid @RequestBody LoginRequest request) {
        LoginResponse response = memberService.login(request);
        return ResponseEntity.ok(response);
    }

    @PostMapping("/partner/token")
    public ResponseEntity<PartnerTokenResponse> getPartnerToken(@Valid @RequestBody PartnerTokenRequest request) {
        PartnerTokenResponse response = partnerService.getPartnerToken(request);
        return ResponseEntity.ok(response);
    }
}
