package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.partner.PartnerTokenRequest;
import com.jdt17.loyalty.dto.partner.PartnerTokenResponse;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.security.JWTService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;

@Service
@RequiredArgsConstructor
public class PartnerService {
    private final PartnerRepository partnerRepository;
    private final JWTService jwtService;

    public PartnerTokenResponse getPartnerToken(PartnerTokenRequest request) {
        Partner partner = partnerRepository.findById(request.getPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNAUTHORIZED, "Invalid partner credentials", "INVALID_CREDENTIALS"));

        if(!"ACTIVE".equalsIgnoreCase(partner.getStatus())) {
            throw new LoyaltyException(
                    HttpStatus.UNAUTHORIZED, "Invalid partner credentials", "INVALID_CREDENTIALS"
            );
        }

        String hashedInputKey = hashSHA256(request.getApiKey());

        if (partner.getApiKey() == null || !partner.getApiKey().equalsIgnoreCase(hashedInputKey)) {
            throw new LoyaltyException(
                    HttpStatus.UNAUTHORIZED,
                    "Invalid partner credentials",
                    "INVALID_CREDENTIALS"
            );
        }

        String token = jwtService.generatePartnerToken(partner.getId().toString());

        return PartnerTokenResponse.builder()
                .token(token)
                .expiresIn(3600)
                .build();

    }

    private String hashSHA256(String data) {
        try {
            MessageDigest digest = MessageDigest.
                    getInstance("SHA-256");
            byte[] hash = digest.digest(data.
                    getBytes(StandardCharsets.UTF_8));
            StringBuilder hexString = new
                    StringBuilder();
            for (byte b : hash) {
                String hex = Integer.
                        toHexString(0xff & b);
                if (hex.length() == 1) hexString.
                        append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 algorithm not found", e);
        }
    }
}
