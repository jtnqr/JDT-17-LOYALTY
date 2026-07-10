package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.reward.ListRewardResponse;
import com.jdt17.loyalty.dto.reward.RewardResponse;
import com.jdt17.loyalty.dto.redeem.RedeemRequest;
import com.jdt17.loyalty.dto.redeem.RedeemResponse;
import com.jdt17.loyalty.dto.exchange.ExchangeRequest;
import com.jdt17.loyalty.dto.exchange.ExchangeResponse;
import com.jdt17.loyalty.entity.*;
import com.jdt17.loyalty.exception.LoyaltyException;
import com.jdt17.loyalty.repository.*;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.HttpStatus;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class TransactionServiceRewardsTest {

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private PointBalanceRepository pointBalanceRepository;

    @Mock
    private ExchangeRateRepository exchangeRateRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @Mock
    private AuditTrailService auditTrailService;

    @InjectMocks
    private TransactionService transactionService;

    private Partner partner;
    private Member member;
    private Reward reward;

    @BeforeEach
    void setUp() {
        partner = Partner.builder()
                .id(UUID.randomUUID())
                .code("KFC")
                .name("KFC Indonesia")
                .status("ACTIVE")
                .build();

        member = Member.builder()
                .id(UUID.randomUUID())
                .name("Budi")
                .status("ACTIVE")
                .build();

        reward = Reward.builder()
                .id(UUID.randomUUID())
                .partner(partner)
                .name("Chicken")
                .pointCost(250)
                .status("ACTIVE")
                .build();
    }

    @Test
    void testGetRewards_All() {
        when(rewardRepository.findAll()).thenReturn(List.of(reward));
        ListRewardResponse response = transactionService.getRewards(null);
        assertNotNull(response);
        assertEquals(1, response.getTotal());
        assertEquals("Chicken", response.getData().get(0).getName());
    }

    @Test
    void testGetRewards_ByPartner_Success() {
        when(partnerRepository.existsById(partner.getId())).thenReturn(true);
        when(rewardRepository.findByPartnerId(partner.getId())).thenReturn(List.of(reward));

        ListRewardResponse response = transactionService.getRewards(partner.getId());
        assertNotNull(response);
        assertEquals(1, response.getTotal());
        assertEquals("Chicken", response.getData().get(0).getName());
    }

    @Test
    void testGetRewards_PartnerNotFound() {
        UUID partnerId = UUID.randomUUID();
        when(partnerRepository.existsById(partnerId)).thenReturn(false);

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.getRewards(partnerId));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testRedeemReward_RewardIdNull() {
        RedeemRequest request = RedeemRequest.builder().build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("REWARD_NOT_FOUND", ex.getCode());
    }

    @Test
    void testRedeemReward_MemberNotFound() {
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("MEMBER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testRedeemReward_MemberInactive() {
        member.setStatus("INACTIVE");
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("MEMBER_INACTIVE", ex.getCode());
    }

    @Test
    void testRedeemReward_RewardNotFound() {
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("REWARD_NOT_FOUND", ex.getCode());
    }

    @Test
    void testRedeemReward_RewardInactive() {
        reward.setStatus("INACTIVE");
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.of(reward));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("REWARD_INACTIVE", ex.getCode());
    }

    @Test
    void testRedeemReward_PartnerInactive() {
        partner.setStatus("INACTIVE");
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.of(reward));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PARTNER_INACTIVE", ex.getCode());
    }

    @Test
    void testRedeemReward_NoPointBalance() {
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.of(reward));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), partner.getId())).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("INSUFFICIENT_BALANCE", ex.getCode());
    }

    @Test
    void testRedeemReward_InsufficientBalance() {
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        PointBalance balance = PointBalance.builder().balance(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.of(reward));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), partner.getId())).thenReturn(Optional.of(balance));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.redeemReward(request, member.getId()));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("INSUFFICIENT_BALANCE", ex.getCode());
    }

    @Test
    void testRedeemReward_Success() {
        RedeemRequest request = RedeemRequest.builder().rewardId(reward.getId()).build();
        PointBalance balance = PointBalance.builder().partner(partner).member(member).balance(500L).build();
        Transaction txn = Transaction.builder().id(UUID.randomUUID()).createdAt(OffsetDateTime.now()).build();

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(rewardRepository.findById(reward.getId())).thenReturn(Optional.of(reward));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), partner.getId())).thenReturn(Optional.of(balance));
        when(pointBalanceRepository.save(any())).thenReturn(balance);
        when(transactionRepository.save(any())).thenReturn(txn);

        RedeemResponse res = transactionService.redeemReward(request, member.getId());
        assertNotNull(res);
        assertEquals(250L, res.getPointsDeducted());
        assertEquals(250L, res.getNewBalance());

        verify(auditTrailService).logEvent(eq("POINTS_REDEEMED"), eq(member.getId()), eq("MEMBER"), eq("MEMBER"), eq(member.getId()), any());
    }

    @Test
    void testExchangePoints_FromPartnerIdNull() {
        ExchangeRequest request = ExchangeRequest.builder().toPartnerId(UUID.randomUUID()).points(100L).build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testExchangePoints_ToPartnerIdNull() {
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(UUID.randomUUID()).points(100L).build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testExchangePoints_SamePartners() {
        UUID partnerId = UUID.randomUUID();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(partnerId).toPartnerId(partnerId).points(100L).build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_EXCHANGE_RATE_PAIR", ex.getCode());
    }

    @Test
    void testExchangePoints_PointsNullOrNegative() {
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(UUID.randomUUID()).toPartnerId(UUID.randomUUID()).points(0L).build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_EXCHANGE_RATE_PAIR", ex.getCode());
    }

    @Test
    void testExchangePoints_PointsNull() {
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(UUID.randomUUID()).toPartnerId(UUID.randomUUID()).points(null).build();
        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("INVALID_EXCHANGE_RATE_PAIR", ex.getCode());
    }

    @Test
    void testExchangePoints_MemberNotFound() {
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(UUID.randomUUID()).toPartnerId(UUID.randomUUID()).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("MEMBER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testExchangePoints_MemberInactive() {
        member.setStatus("INACTIVE");
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(UUID.randomUUID()).toPartnerId(UUID.randomUUID()).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("MEMBER_INACTIVE", ex.getCode());
    }

    @Test
    void testExchangePoints_FromPartnerNotFound() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testExchangePoints_FromPartnerInactive() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("INACTIVE").build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PARTNER_INACTIVE", ex.getCode());
    }

    @Test
    void testExchangePoints_ToPartnerNotFound() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("PARTNER_NOT_FOUND", ex.getCode());
    }

    @Test
    void testExchangePoints_ToPartnerInactive() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).status("INACTIVE").build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.BAD_REQUEST, ex.getStatus());
        assertEquals("PARTNER_INACTIVE", ex.getCode());
    }

    @Test
    void testExchangePoints_ExchangeRateNotFound() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).status("ACTIVE").build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));
        when(exchangeRateRepository.findLatestRate(eq(fromId), eq(toId), any())).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.NOT_FOUND, ex.getStatus());
        assertEquals("EXCHANGE_RATE_NOT_CONFIGURED", ex.getCode());
    }

    @Test
    void testExchangePoints_NoSourceBalance() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).status("ACTIVE").build();
        ExchangeRate rate = ExchangeRate.builder().rate(new BigDecimal("0.8")).build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));
        when(exchangeRateRepository.findLatestRate(eq(fromId), eq(toId), any())).thenReturn(Optional.of(rate));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), fromId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("INSUFFICIENT_BALANCE", ex.getCode());
    }

    @Test
    void testExchangePoints_InsufficientSourceBalance() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).status("ACTIVE").build();
        ExchangeRate rate = ExchangeRate.builder().rate(new BigDecimal("0.8")).build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        PointBalance fromBal = PointBalance.builder().balance(50L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));
        when(exchangeRateRepository.findLatestRate(eq(fromId), eq(toId), any())).thenReturn(Optional.of(rate));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), fromId)).thenReturn(Optional.of(fromBal));

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("INSUFFICIENT_BALANCE", ex.getCode());
    }

    @Test
    void testExchangePoints_NoTargetBalance() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).status("ACTIVE").build();
        ExchangeRate rate = ExchangeRate.builder().rate(new BigDecimal("0.8")).build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        PointBalance fromBal = PointBalance.builder().balance(200L).build();
        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));
        when(exchangeRateRepository.findLatestRate(eq(fromId), eq(toId), any())).thenReturn(Optional.of(rate));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), fromId)).thenReturn(Optional.of(fromBal));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), toId)).thenReturn(Optional.empty());

        LoyaltyException ex = assertThrows(LoyaltyException.class, () -> transactionService.exchangePoints(request, member.getId()));
        assertEquals(HttpStatus.UNPROCESSABLE_ENTITY, ex.getStatus());
        assertEquals("INSUFFICIENT_BALANCE", ex.getCode());
    }

    @Test
    void testExchangePoints_Success() {
        UUID fromId = UUID.randomUUID();
        UUID toId = UUID.randomUUID();
        Partner fromP = Partner.builder().id(fromId).code("KFC").name("KFC").status("ACTIVE").build();
        Partner toP = Partner.builder().id(toId).code("MCD").name("McD").status("ACTIVE").build();
        ExchangeRate rate = ExchangeRate.builder().rate(new BigDecimal("0.8")).build();
        ExchangeRequest request = ExchangeRequest.builder().fromPartnerId(fromId).toPartnerId(toId).points(100L).build();
        PointBalance fromBal = PointBalance.builder().balance(200L).build();
        PointBalance toBal = PointBalance.builder().balance(300L).build();
        Transaction outTxn = Transaction.builder().id(UUID.randomUUID()).createdAt(OffsetDateTime.now()).build();
        Transaction inTxn = Transaction.builder().id(UUID.randomUUID()).createdAt(OffsetDateTime.now()).build();

        when(memberRepository.findById(member.getId())).thenReturn(Optional.of(member));
        when(partnerRepository.findById(fromId)).thenReturn(Optional.of(fromP));
        when(partnerRepository.findById(toId)).thenReturn(Optional.of(toP));
        when(exchangeRateRepository.findLatestRate(eq(fromId), eq(toId), any())).thenReturn(Optional.of(rate));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), fromId)).thenReturn(Optional.of(fromBal));
        when(pointBalanceRepository.findByMemberIdAndPartnerId(member.getId(), toId)).thenReturn(Optional.of(toBal));
        when(transactionRepository.save(any())).thenReturn(outTxn).thenReturn(inTxn);

        ExchangeResponse res = transactionService.exchangePoints(request, member.getId());
        assertNotNull(res);
        assertEquals(100L, res.getPointsDeducted());
        assertEquals(80L, res.getPointsCredited());
        assertEquals(0.8, res.getExchangeRate());
        assertEquals(100L, res.getUpdatedBalances().get("KFC"));
        assertEquals(380L, res.getUpdatedBalances().get("MCD"));

        verify(auditTrailService).logEvent(eq("POINTS_EXCHANGED"), eq(member.getId()), eq("MEMBER"), eq("MEMBER"), eq(member.getId()), any());
    }

    @Test
    void testExpirePoints_NoActiveBalances() {
        when(pointBalanceRepository.findByBalanceGreaterThan(0L)).thenReturn(List.of());
        transactionService.expirePoints();
        verify(pointBalanceRepository, never()).save(any());
    }

    @Test
    void testExpirePoints_NoPointsToExpire() {
        PointBalance balance = PointBalance.builder().member(member).partner(partner).balance(100L).build();
        when(pointBalanceRepository.findByBalanceGreaterThan(0L)).thenReturn(List.of(balance));
        when(transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                eq(member.getId()), eq(partner.getId()), eq("EARN"), any()))
                .thenReturn(150L);
        when(transactionRepository.sumPointsByMemberAndPartnerAndType(
                eq(member.getId()), eq(partner.getId()), eq("EXCHANGE_IN")))
                .thenReturn(0L);

        transactionService.expirePoints();
        verify(pointBalanceRepository, never()).save(any());
        verify(transactionRepository, never()).save(any());
    }

    @Test
    void testExpirePoints_SomePointsExpire() {
        PointBalance balance = PointBalance.builder().member(member).partner(partner).balance(100L).build();
        Transaction expiredTx = Transaction.builder().id(UUID.randomUUID()).build();
        when(pointBalanceRepository.findByBalanceGreaterThan(0L)).thenReturn(List.of(balance));
        when(transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                eq(member.getId()), eq(partner.getId()), eq("EARN"), any()))
                .thenReturn(30L);
        when(transactionRepository.sumPointsByMemberAndPartnerAndType(
                eq(member.getId()), eq(partner.getId()), eq("EXCHANGE_IN")))
                .thenReturn(20L);
        when(pointBalanceRepository.save(any(PointBalance.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(expiredTx);

        transactionService.expirePoints();

        assertEquals(50L, balance.getBalance());
        verify(pointBalanceRepository).save(balance);
        verify(transactionRepository).save(any(Transaction.class));
        verify(auditTrailService).logEvent(eq("POINT_EXPIRED"), eq(null), eq("SYSTEM"), eq("TRANSACTION"), eq(expiredTx.getId()), any());
    }

    @Test
    void testExpirePoints_RepositoryReturnsNulls() {
        PointBalance balance = PointBalance.builder().member(member).partner(partner).balance(100L).build();
        Transaction expiredTx = Transaction.builder().id(UUID.randomUUID()).build();
        when(pointBalanceRepository.findByBalanceGreaterThan(0L)).thenReturn(List.of(balance));
        when(transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                eq(member.getId()), eq(partner.getId()), eq("EARN"), any()))
                .thenReturn(null);
        when(transactionRepository.sumPointsByMemberAndPartnerAndType(
                eq(member.getId()), eq(partner.getId()), eq("EXCHANGE_IN")))
                .thenReturn(null);
        when(pointBalanceRepository.save(any(PointBalance.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(expiredTx);

        transactionService.expirePoints();

        assertEquals(0L, balance.getBalance());
        verify(pointBalanceRepository).save(balance);
        verify(transactionRepository).save(any(Transaction.class));
    }

    @Test
    void testExpirePoints_OneMemberFailsDoesNotBlockOthers() {
        PointBalance balance1 = PointBalance.builder().member(member).partner(partner).balance(100L).build();
        
        Member member2 = Member.builder().id(UUID.randomUUID()).status("ACTIVE").build();
        PointBalance balance2 = PointBalance.builder().member(member2).partner(partner).balance(150L).build();

        Transaction expiredTx = Transaction.builder().id(UUID.randomUUID()).build();

        when(pointBalanceRepository.findByBalanceGreaterThan(0L)).thenReturn(List.of(balance1, balance2));
        
        // balance1 throws exception
        when(transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                eq(member.getId()), eq(partner.getId()), eq("EARN"), any()))
                .thenThrow(new RuntimeException("database error"));

        // balance2 succeeds
        when(transactionRepository.sumPointsByMemberAndPartnerAndTypeAndExpiresAtAfter(
                eq(member2.getId()), eq(partner.getId()), eq("EARN"), any()))
                .thenReturn(50L);
        when(transactionRepository.sumPointsByMemberAndPartnerAndType(
                eq(member2.getId()), eq(partner.getId()), eq("EXCHANGE_IN")))
                .thenReturn(0L);
        when(pointBalanceRepository.save(any(PointBalance.class))).thenAnswer(i -> i.getArgument(0));
        when(transactionRepository.save(any(Transaction.class))).thenReturn(expiredTx);

        transactionService.expirePoints();

        // balance1 not updated due to exception
        assertEquals(100L, balance1.getBalance());

        // balance2 updated successfully
        assertEquals(50L, balance2.getBalance());
        verify(pointBalanceRepository).save(balance2);
        verify(transactionRepository).save(any(Transaction.class));
    }
}
