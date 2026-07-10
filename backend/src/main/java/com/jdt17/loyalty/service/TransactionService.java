package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.transaction.EarnPointsRequest;
import com.jdt17.loyalty.dto.transaction.EarnPointsResponse;
import com.jdt17.loyalty.entity.Member;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.PointBalance;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.MemberRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.PointBalanceRepository;
import com.jdt17.loyalty.repository.TransactionRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import com.jdt17.loyalty.repository.ExchangeRateRepository;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.entity.ExchangeRate;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;

import com.jdt17.loyalty.dto.reward.ListRewardResponse;
import com.jdt17.loyalty.dto.redeem.RedeemRequest;
import com.jdt17.loyalty.dto.redeem.RedeemResponse;
import com.jdt17.loyalty.dto.exchange.ExchangeRequest;
import com.jdt17.loyalty.dto.exchange.ExchangeResponse;
import java.util.UUID;
import java.util.List;
import java.util.Map;
import java.util.HashMap;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final MemberRepository memberRepository;
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final AuditTrailService auditTrailService;

    @Transactional
    public EarnPointsResponse earnPoints(EarnPointsRequest request) {
        // checking partner
        Partner partner = partnerRepository.findByCode(request.getPartner())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Partner does not exist", "PARTNER_NOT_FOUND"));

        if("INACTIVE".equalsIgnoreCase(partner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Partner status is INACTIVE", "PARTNER_INACTIVE");
        }

        // login with partner account and id partner.
        Authentication authentication = SecurityContextHolder.getContext().getAuthentication();
        String currentPartnerId = authentication.getName();
        boolean isPartner = authentication.getAuthorities().stream()
                .anyMatch(a -> a.getAuthority().equals("ROLE_PARTNER"));

        if(!isPartner || !partner.getId().toString().equals(currentPartnerId)) {
            throw new LoyaltyException(HttpStatus.FORBIDDEN, "Access denied", "FORBIDDEN");
        }

        // check member from phone number / email
        Member member = memberRepository.findByPhone(request.getMemberIdentifier())
                .or(() -> memberRepository.findByEmail(request.getMemberIdentifier()))
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if("INACTIVE".equalsIgnoreCase(member.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Member status is INACTIVE", "MEMBER_INACTIVE");
        }

        // count point
        long pointsEarned = (request.getTrxAmount() / 1000 * partner.getPointPerThousandIdr());
        java.time.OffsetDateTime expiresAt = java.time.OffsetDateTime.now().plusDays(partner.getExpiryDays());

        // update point member
        PointBalance pointBalance = pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), partner.getId())
                .orElseGet(() -> PointBalance.builder()
                        .member(member)
                        .partner(partner)
                        .balance(0L)
                        .build()
                );

        pointBalance.setBalance(pointBalance.getBalance() + pointsEarned);
        PointBalance savedBalance = pointBalanceRepository.save(pointBalance);

        Transaction transaction = Transaction.builder()
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(pointsEarned)
                .trxAmountIdr(request.getTrxAmount())
                .expiresAt(expiresAt)
                .build();
        Transaction savedTx = transactionRepository.save(transaction);

        // audit trail
        auditTrailService.logEvent("POINTS_EARNED", null, "SYSTEM", "TRANSACTION", savedTx.getId(), null);

        return EarnPointsResponse.builder()
                .transactionId(savedTx.getId())
                .memberId(member.getId())
                .partner(partner.getCode())
                .trxAmountIDR(request.getTrxAmount())
                .pointsEarned(pointsEarned)
                .newBalance(savedBalance.getBalance())
                .expiresAt(expiresAt)
                .createdAt(savedTx.getCreatedAt())
                .build();
    }

    private final RewardRepository rewardRepository;
    private final ExchangeRateRepository exchangeRateRepository;

    public ListRewardResponse getRewards(UUID partnerId) {
        List<Reward> rewards;
        if (partnerId != null) {
            if (!partnerRepository.existsById(partnerId)) {
                throw new LoyaltyException(HttpStatus.NOT_FOUND, "Partner does not exist", "PARTNER_NOT_FOUND");
            }
            rewards = rewardRepository.findByPartnerId(partnerId);
        } else {
            rewards = rewardRepository.findAll();
        }

        List<com.jdt17.loyalty.dto.reward.RewardResponse> list = rewards.stream()
                .map(r -> com.jdt17.loyalty.dto.reward.RewardResponse.builder()
                        .id(r.getId())
                        .partnerId(r.getPartner().getId())
                        .partnerName(r.getPartner().getName())
                        .name(r.getName())
                        .pointCost(r.getPointCost())
                        .status(r.getStatus())
                        .build())
                .collect(Collectors.toList());

        return ListRewardResponse.builder()
                .data(list)
                .total((long) list.size())
                .build();
    }

    @Transactional
    public RedeemResponse redeemReward(RedeemRequest request, UUID memberId) {
        if (request.getRewardId() == null) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Reward ID is required", "REWARD_NOT_FOUND");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if (!"ACTIVE".equals(member.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Member status is INACTIVE", "MEMBER_INACTIVE");
        }

        Reward reward = rewardRepository.findById(request.getRewardId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Reward does not exist", "REWARD_NOT_FOUND"));

        if (!"ACTIVE".equals(reward.getStatus())) {
            throw new LoyaltyException(HttpStatus.NOT_FOUND, "Reward is not ACTIVE", "REWARD_INACTIVE");
        }

        Partner partner = reward.getPartner();
        if (!"ACTIVE".equals(partner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Partner is not ACTIVE", "PARTNER_INACTIVE");
        }

        PointBalance balance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, partner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, "No point balance for this partner", "INSUFFICIENT_BALANCE"));

        if (balance.getBalance() < reward.getPointCost()) {
            throw new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, 
                "Insufficient points. Required: " + reward.getPointCost() + ", Available: " + balance.getBalance(), 
                "INSUFFICIENT_BALANCE");
        }

        // Deduct points
        balance.setBalance(balance.getBalance() - reward.getPointCost());
        pointBalanceRepository.save(balance);

        // Record transaction
        Transaction txn = Transaction.builder()
                .member(member)
                .partner(partner)
                .rewardId(reward.getId())
                .points(reward.getPointCost().longValue())
                .type("REDEEM")
                .build();
        txn = transactionRepository.save(txn);

        // Audit log
        auditTrailService.logEvent(
                "POINTS_REDEEMED",
                memberId,
                "MEMBER",
                "MEMBER",
                memberId,
                "Member redeemed reward: " + reward.getName() + " for " + reward.getPointCost() + " points"
        );

        return RedeemResponse.builder()
                .transactionId(txn.getId())
                .rewardName(reward.getName())
                .partnerId(partner.getId())
                .partnerName(partner.getName())
                .pointsDeducted(reward.getPointCost().longValue())
                .newBalance(balance.getBalance())
                .redeemedAt(txn.getCreatedAt())
                .build();
    }

    @Transactional
    public ExchangeResponse exchangePoints(ExchangeRequest request, UUID memberId) {
        if (request.getFromPartnerId() == null || request.getToPartnerId() == null) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "From and To Partner IDs are required", "PARTNER_NOT_FOUND");
        }

        if (request.getFromPartnerId().equals(request.getToPartnerId())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "fromPartnerId cannot be equal to toPartnerId", "INVALID_EXCHANGE_RATE_PAIR");
        }

        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Points must be greater than 0", "INVALID_EXCHANGE_RATE_PAIR");
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Member does not exist", "MEMBER_NOT_FOUND"));

        if (!"ACTIVE".equals(member.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Member status is INACTIVE", "MEMBER_INACTIVE");
        }

        Partner fromPartner = partnerRepository.findById(request.getFromPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Source partner does not exist", "PARTNER_NOT_FOUND"));

        if (!"ACTIVE".equals(fromPartner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Source partner is INACTIVE", "PARTNER_INACTIVE");
        }

        Partner toPartner = partnerRepository.findById(request.getToPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Target partner does not exist", "PARTNER_NOT_FOUND"));

        if (!"ACTIVE".equals(toPartner.getStatus())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, "Target partner is INACTIVE", "PARTNER_INACTIVE");
        }

        ExchangeRate rate = exchangeRateRepository.findLatestRate(fromPartner.getId(), toPartner.getId(), java.time.OffsetDateTime.now())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, "Exchange rate not configured", "EXCHANGE_RATE_NOT_CONFIGURED"));

        PointBalance fromBalance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, fromPartner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, "No point balance for source partner", "INSUFFICIENT_BALANCE"));

        if (fromBalance.getBalance() < request.getPoints()) {
            throw new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, 
                "Insufficient points. Required: " + request.getPoints() + ", Available: " + fromBalance.getBalance(), 
                "INSUFFICIENT_BALANCE");
        }

        PointBalance toBalance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, toPartner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, "No point balance for target partner", "INSUFFICIENT_BALANCE"));

        long sourcePoints = request.getPoints();
        long targetPoints = (long) Math.floor(sourcePoints * rate.getRate().doubleValue());

        // Update point balances
        fromBalance.setBalance(fromBalance.getBalance() - sourcePoints);
        toBalance.setBalance(toBalance.getBalance() + targetPoints);

        pointBalanceRepository.save(fromBalance);
        pointBalanceRepository.save(toBalance);

        // Record transactions
        Transaction outTxn = Transaction.builder()
                .member(member)
                .partner(fromPartner)
                .points(sourcePoints)
                .type("EXCHANGE_OUT")
                .build();
        outTxn = transactionRepository.save(outTxn);

        Transaction inTxn = Transaction.builder()
                .member(member)
                .partner(toPartner)
                .points(targetPoints)
                .type("EXCHANGE_IN")
                .build();
        inTxn = transactionRepository.save(inTxn);

        // Audit log
        auditTrailService.logEvent(
                "POINTS_EXCHANGED",
                memberId,
                "MEMBER",
                "MEMBER",
                memberId,
                "Member exchanged " + sourcePoints + " points from " + fromPartner.getName() + " to " + targetPoints + " points at " + toPartner.getName()
        );

        Map<String, Long> updatedBalances = new HashMap<>();
        updatedBalances.put(fromPartner.getCode(), fromBalance.getBalance());
        updatedBalances.put(toPartner.getCode(), toBalance.getBalance());

        return ExchangeResponse.builder()
                .memberId(memberId)
                .fromPartner(fromPartner.getName())
                .toPartner(toPartner.getName())
                .pointsDeducted(sourcePoints)
                .pointsCredited(targetPoints)
                .exchangeRate(rate.getRate().doubleValue())
                .updatedBalances(updatedBalances)
                .outTransactionId(outTxn.getId())
                .inTransactionId(inTxn.getId())
                .exchangedAt(outTxn.getCreatedAt())
                .build();
    }

    @Transactional
    public void expirePoints() {
        List<PointBalance> activeBalances = pointBalanceRepository.findByBalanceGreaterThan(0L);
        java.time.OffsetDateTime now = java.time.OffsetDateTime.now();
        for (PointBalance balance : activeBalances) {
            try {
                expirePointsForBalance(balance, now);
            } catch (Exception e) {
                // Per-member try/catch — one member failure does not block others
            }
        }
    }

    private void expirePointsForBalance(PointBalance balance, java.time.OffsetDateTime now) {
        Member member = balance.getMember();
        Partner partner = balance.getPartner();
        
        Long activeFuturePoints = transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                member.getId(), partner.getId(), "EARN", now);
        if (activeFuturePoints == null) {
            activeFuturePoints = 0L;
        }

        Long exchangeInPoints = transactionRepository.sumPointsByMemberAndPartnerAndType(
                member.getId(), partner.getId(), "EXCHANGE_IN");
        if (exchangeInPoints == null) {
            exchangeInPoints = 0L;
        }

        long validPoints = activeFuturePoints + exchangeInPoints;
        if (balance.getBalance() > validPoints) {
            long expiredPoints = balance.getBalance() - validPoints;
            
            balance.setBalance(validPoints);
            pointBalanceRepository.save(balance);

            Transaction expiredTx = Transaction.builder()
                    .member(member)
                    .partner(partner)
                    .type("EXPIRED")
                    .points(expiredPoints)
                    .build();
            expiredTx = transactionRepository.save(expiredTx);

            auditTrailService.logEvent(
                    "POINT_EXPIRED",
                    null,
                    "SYSTEM",
                    "TRANSACTION",
                    expiredTx.getId(),
                    "Expired " + expiredPoints + " points for member " + member.getId() + " at partner " + partner.getName()
            );
        }
    }
}
