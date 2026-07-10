package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.rate.CreateExchangeRateRequest;
import com.jdt17.loyalty.dto.rate.ExchangeRateResponse;
import com.jdt17.loyalty.dto.rate.ListExchangeRateResponse;

import java.util.UUID;

public interface ExchangeRateService {
    ListExchangeRateResponse getActiveExchangeRates();
    ExchangeRateResponse createExchangeRate(CreateExchangeRateRequest request, UUID adminId);
}
