package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.partner.CreatePartnerRequest;
import com.jdt17.loyalty.dto.partner.ListPartnerResponse;
import com.jdt17.loyalty.dto.partner.PartnerResponse;
import com.jdt17.loyalty.dto.partner.UpdatePartnerRequest;
import com.jdt17.loyalty.service.PartnerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.UUID;

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

    @PostMapping
    public ResponseEntity<PartnerResponse> createPartner(@Valid @RequestBody CreatePartnerRequest request) {
        PartnerResponse response = partnerService.createPartner(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @PutMapping("/{id}")
    public ResponseEntity<PartnerResponse> updatePartner(
            @PathVariable UUID id,
            @Valid @RequestBody UpdatePartnerRequest request
    ) {
        PartnerResponse response = partnerService.updatePartner(id, request);
        return ResponseEntity.ok(response);
    }

    @PutMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<PartnerResponse> uploadPartnerImage(
            @PathVariable UUID id,
            @RequestParam("image") MultipartFile file
    ) throws IOException {
        PartnerResponse response = partnerService.uploadPartnerImage(id, file);
        return ResponseEntity.ok(response);
    }
}
