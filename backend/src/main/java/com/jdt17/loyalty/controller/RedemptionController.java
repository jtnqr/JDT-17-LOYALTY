package com.jdt17.loyalty.controller;

import com.jdt17.loyalty.dto.reward.ListRewardResponse;
import com.jdt17.loyalty.dto.redeem.RedeemRequest;
import com.jdt17.loyalty.dto.redeem.RedeemResponse;
import com.jdt17.loyalty.dto.exchange.ExchangeRequest;
import com.jdt17.loyalty.dto.exchange.ExchangeResponse;
import com.jdt17.loyalty.service.TransactionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;

import java.util.UUID;

@RestController
@RequestMapping("/api/v1")
@RequiredArgsConstructor
public class RedemptionController {

    private final TransactionService transactionService;

    @GetMapping("/rewards")
    public ResponseEntity<ListRewardResponse> getRewards(
            @RequestParam(required = false) UUID partnerId
    ) {
        return ResponseEntity.ok(transactionService.getRewards(partnerId));
    }

    @PostMapping("/redeem")
    public ResponseEntity<RedeemResponse> redeem(
            @RequestBody RedeemRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID memberId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(transactionService.redeemReward(request, memberId));
    }

    @PostMapping("/exchange")
    public ResponseEntity<ExchangeResponse> exchange(
            @RequestBody ExchangeRequest request
    ) {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        UUID memberId = UUID.fromString(auth.getName());
        return ResponseEntity.ok(transactionService.exchangePoints(request, memberId));
    }
}
