package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.partner.ListPartnerResponse;
import com.jdt17.loyalty.service.PartnerService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/v1/partners")
@RequiredArgsConstructor
public class PartnerController {
    private final PartnerService partnerService;

    @GetMapping
    public ResponseEntity<ListPartnerResponse> getAllPartners() {
        ListPartnerResponse response = partnerService.getAllPartners();
        return ResponseEntity.ok(response);
    }
}
