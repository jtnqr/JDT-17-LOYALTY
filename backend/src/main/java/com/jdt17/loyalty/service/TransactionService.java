package com.jdt17.loyalty.service;

import com.jdt17.loyalty.constant.AuditEventConstant;
import com.jdt17.loyalty.constant.ErrorCodeConstant;
import com.jdt17.loyalty.constant.ErrorMessageConstant;
import com.jdt17.loyalty.constant.RoleConstant;
import com.jdt17.loyalty.constant.StatusConstant;
import com.jdt17.loyalty.constant.TransactionTypeConstant;
import com.jdt17.loyalty.dto.exchange.ExchangeRequest;
import com.jdt17.loyalty.dto.exchange.ExchangeResponse;
import com.jdt17.loyalty.dto.redeem.RedeemRequest;
import com.jdt17.loyalty.dto.redeem.RedeemResponse;
import com.jdt17.loyalty.dto.reward.ListRewardResponse;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.transaction.EarnPointsRequest;
import com.jdt17.loyalty.dto.transaction.EarnPointsResponse;
import com.jdt17.loyalty.entity.*;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import com.jdt17.loyalty.security.SecurityUtils;
import com.jdt17.loyalty.util.ValidationUtils;
import jakarta.transaction.Transactional;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class TransactionService {
    private final MemberRepository memberRepository;
    private final PartnerRepository partnerRepository;
    private final PointBalanceRepository pointBalanceRepository;
    private final TransactionRepository transactionRepository;
    private final RewardRepository rewardRepository;
    private final ExchangeRateRepository exchangeRateRepository;
    private final AuditTrailService auditTrailService;

    @Transactional
    public EarnPointsResponse earnPoints(EarnPointsRequest request) {
        Partner partner = partnerRepository.findByCode(request.getPartner())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        ValidationUtils.validatePartnerActive(partner.getStatus());
        SecurityUtils.validatePartnerAccess(partner.getId());

        Member member = memberRepository.findByPhone(request.getMemberIdentifier())
                .or(() -> memberRepository.findByEmail(request.getMemberIdentifier()))
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        ValidationUtils.validateMemberActive(member.getStatus());

        long pointsEarned = (request.getTrxAmount() / 1000 * partner.getPointPerThousandIdr());
        OffsetDateTime expiresAt = OffsetDateTime.now().plusDays(partner.getExpiryDays());

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
                .type(TransactionTypeConstant.EARN)
                .points(pointsEarned)
                .trxAmountIdr(request.getTrxAmount())
                .expiresAt(expiresAt)
                .build();
        Transaction savedTx = transactionRepository.save(transaction);

        auditTrailService.logEvent(AuditEventConstant.POINTS_EARNED, null, RoleConstant.SYSTEM, AuditEventConstant.ENTITY_TRANSACTION, savedTx.getId(), request);

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

    @Cacheable(value = "rewards", key = "#partnerId != null ? #partnerId.toString() : 'all'")
    public ListRewardResponse getRewards(UUID partnerId) {
        List<Reward> rewards;
        if (partnerId != null) {
            if (!partnerRepository.existsById(partnerId)) {
                throw new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND);
            }
            rewards = rewardRepository.findByPartnerId(partnerId);
        } else {
            rewards = rewardRepository.findAll();
        }

        List<RewardResponse> list = rewards.stream()
                .map(r -> RewardResponse.builder()
                        .id(r.getId())
                        .partnerId(r.getPartner().getId())
                        .partnerName(r.getPartner().getName())
                        .name(r.getName())
                        .pointCost(r.getPointCost())
                        .status(r.getStatus())
                        .imageUrl(r.getImageUrl())
                        .partnerCode(r.getPartner().getCode())
                        .build())
                .collect(Collectors.toList());

        return ListRewardResponse.builder()
                .data(list)
                .total((long) list.size())
                .build();
    }

    @Transactional
    public RedeemResponse redeemReward(RedeemRequest request) {
        UUID memberId = SecurityUtils.getRequiredCurrentUserId();
        return redeemReward(request, memberId);
    }

    @Transactional
    public RedeemResponse redeemReward(RedeemRequest request, UUID memberId) {
        if (memberId == null) {
            memberId = SecurityUtils.getRequiredCurrentUserId();
        }

        if (request.getRewardId() == null) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.REWARD_ID_REQUIRED, ErrorCodeConstant.REWARD_NOT_FOUND);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        ValidationUtils.validateMemberActive(member.getStatus());

        Reward reward = rewardRepository.findById(request.getRewardId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.REWARD_NOT_FOUND, ErrorCodeConstant.REWARD_NOT_FOUND));

        ValidationUtils.validateRewardActive(reward.getStatus());

        Partner partner = reward.getPartner();
        ValidationUtils.validatePartnerActive(partner.getStatus());

        PointBalance balance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, partner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorMessageConstant.NO_POINT_BALANCE_PARTNER, ErrorCodeConstant.INSUFFICIENT_BALANCE));

        if (balance.getBalance() < reward.getPointCost()) {
            throw new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Insufficient points. Required: " + reward.getPointCost() + ", Available: " + balance.getBalance(),
                    ErrorCodeConstant.INSUFFICIENT_BALANCE);
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
                .type(TransactionTypeConstant.REDEEM)
                .build();
        txn = transactionRepository.save(txn);

        // Audit log
        auditTrailService.logEvent(
                AuditEventConstant.POINTS_REDEEMED,
                memberId,
                RoleConstant.MEMBER,
                AuditEventConstant.ENTITY_MEMBER,
                memberId,
                request
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
    public ExchangeResponse exchangePoints(ExchangeRequest request) {
        UUID memberId = SecurityUtils.getRequiredCurrentUserId();
        return exchangePoints(request, memberId);
    }

    @Transactional
    public ExchangeResponse exchangePoints(ExchangeRequest request, UUID memberId) {
        if (memberId == null) {
            memberId = SecurityUtils.getRequiredCurrentUserId();
        }

        if (request.getFromPartnerId() == null || request.getToPartnerId() == null) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.PARTNER_IDS_REQUIRED, ErrorCodeConstant.PARTNER_NOT_FOUND);
        }

        if (request.getFromPartnerId().equals(request.getToPartnerId())) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.INVALID_EXCHANGE_RATE_PAIR, ErrorCodeConstant.INVALID_EXCHANGE_RATE_PAIR);
        }

        if (request.getPoints() == null || request.getPoints() <= 0) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST, ErrorMessageConstant.POINTS_MUST_POSITIVE, ErrorCodeConstant.INVALID_EXCHANGE_RATE_PAIR);
        }

        Member member = memberRepository.findById(memberId)
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.MEMBER_NOT_FOUND, ErrorCodeConstant.MEMBER_NOT_FOUND));

        ValidationUtils.validateMemberActive(member.getStatus());

        Partner fromPartner = partnerRepository.findById(request.getFromPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.SOURCE_PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        ValidationUtils.validatePartnerActive(fromPartner.getStatus());

        Partner toPartner = partnerRepository.findById(request.getToPartnerId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.TARGET_PARTNER_NOT_FOUND, ErrorCodeConstant.PARTNER_NOT_FOUND));

        ValidationUtils.validatePartnerActive(toPartner.getStatus());

        ExchangeRate rate = exchangeRateRepository.findLatestRate(fromPartner.getId(), toPartner.getId(), OffsetDateTime.now())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.NOT_FOUND, ErrorMessageConstant.EXCHANGE_RATE_NOT_CONFIGURED, ErrorCodeConstant.EXCHANGE_RATE_NOT_CONFIGURED));

        PointBalance fromBalance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, fromPartner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorMessageConstant.NO_POINT_BALANCE_SOURCE_PARTNER, ErrorCodeConstant.INSUFFICIENT_BALANCE));

        if (fromBalance.getBalance() < request.getPoints()) {
            throw new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY,
                    "Insufficient points. Required: " + request.getPoints() + ", Available: " + fromBalance.getBalance(),
                    ErrorCodeConstant.INSUFFICIENT_BALANCE);
        }

        PointBalance toBalance = pointBalanceRepository.findByMemberIdAndPartnerId(memberId, toPartner.getId())
                .orElseThrow(() -> new LoyaltyException(HttpStatus.UNPROCESSABLE_ENTITY, ErrorMessageConstant.NO_POINT_BALANCE_TARGET_PARTNER, ErrorCodeConstant.INSUFFICIENT_BALANCE));

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
                .type(TransactionTypeConstant.EXCHANGE_OUT)
                .build();
        outTxn = transactionRepository.save(outTxn);

        Transaction inTxn = Transaction.builder()
                .member(member)
                .partner(toPartner)
                .points(targetPoints)
                .type(TransactionTypeConstant.EXCHANGE_IN)
                .build();
        inTxn = transactionRepository.save(inTxn);

        // Audit log
        auditTrailService.logEvent(
                AuditEventConstant.POINTS_EXCHANGED,
                memberId,
                RoleConstant.MEMBER,
                AuditEventConstant.ENTITY_MEMBER,
                memberId,
                request
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
        OffsetDateTime now = OffsetDateTime.now();
        for (PointBalance balance : activeBalances) {
            try {
                expirePointsForBalance(balance, now);
            } catch (Exception e) {
                // Per-member try/catch — one member failure does not block others
            }
        }
    }

    private void expirePointsForBalance(PointBalance balance, OffsetDateTime now) {
        Member member = balance.getMember();
        Partner partner = balance.getPartner();

        Long activeFuturePoints = transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                member.getId(), partner.getId(), TransactionTypeConstant.EARN, now);
        if (activeFuturePoints == null) {
            activeFuturePoints = 0L;
        }

        Long exchangeInPoints = transactionRepository.sumPointsByMemberAndPartnerAndType(
                member.getId(), partner.getId(), TransactionTypeConstant.EXCHANGE_IN);
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
                    .type(TransactionTypeConstant.EXPIRED)
                    .points(expiredPoints)
                    .build();
            expiredTx = transactionRepository.save(expiredTx);

            auditTrailService.logEvent(
                    AuditEventConstant.POINT_EXPIRED,
                    null,
                    RoleConstant.SYSTEM,
                    AuditEventConstant.ENTITY_TRANSACTION,
                    expiredTx.getId(),
                    "Expired " + expiredPoints + " points for member " + member.getId() + " at partner " + partner.getName()
            );
        }
    }
}
