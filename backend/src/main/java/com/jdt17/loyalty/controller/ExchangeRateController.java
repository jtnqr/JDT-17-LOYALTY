package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;
import com.jdt17.loyalty.service.ExchangeRateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/v1/exchange-rates")
@RequiredArgsConstructor
public class ExchangeRateController {

    private final ExchangeRateService exchangeRateService;

    @GetMapping
    public ResponseEntity<ListExchangeRateResponse> getActiveExchangeRates() {
        ListExchangeRateResponse response = exchangeRateService.getActiveExchangeRates();
        return ResponseEntity.ok(response);
    }

    @PostMapping
    public ResponseEntity<ExchangeRateResponse> createExchangeRate(
            @Valid @RequestBody CreateExchangeRateRequest request
    ) {
        ExchangeRateResponse response = exchangeRateService.createExchangeRate(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
