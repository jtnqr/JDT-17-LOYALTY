package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.admin.AdminDashboardStatsResponse;
import com.jdt17.loyalty.entity.Partner;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.repository.MemberRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import com.jdt17.loyalty.repository.TransactionRepository;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.OffsetDateTime;
import java.util.*;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AdminDashboardServiceTest {

    @Mock
    private MemberRepository memberRepository;

    @Mock
    private PartnerRepository partnerRepository;

    @Mock
    private RewardRepository rewardRepository;

    @Mock
    private TransactionRepository transactionRepository;

    @InjectMocks
    private AdminDashboardService adminDashboardService;

    private Partner kfcPartner;
    private Partner mcdPartner;
    private Reward burgerReward;

    @BeforeEach
    void setUp() {
        kfcPartner = new Partner();
        kfcPartner.setId(UUID.randomUUID());
        kfcPartner.setCode("KFC");
        kfcPartner.setName("Kentucky Fried Chicken");

        mcdPartner = new Partner();
        mcdPartner.setId(UUID.randomUUID());
        mcdPartner.setCode("MCD");
        mcdPartner.setName("McDonalds");

        burgerReward = new Reward();
        burgerReward.setId(UUID.randomUUID());
        burgerReward.setName("Burger Reward");
    }

    @Test
    void testGetDashboardStats() {
        when(memberRepository.count()).thenReturn(10L);
        when(memberRepository.countByStatus("ACTIVE")).thenReturn(8L);
        when(memberRepository.countByStatus("INACTIVE")).thenReturn(2L);
        when(memberRepository.countByCreatedAtAfter(any(OffsetDateTime.class))).thenReturn(3L);

        when(transactionRepository.sumPointsByType("EARN")).thenReturn(1000L);
        when(transactionRepository.sumPointsByType("REDEEM")).thenReturn(400L);
        when(transactionRepository.sumPointsByType("EXPIRED")).thenReturn(50L);

        when(partnerRepository.count()).thenReturn(5L);
        when(rewardRepository.count()).thenReturn(12L);

        // Prepare redemptions
        Transaction t1 = new Transaction();
        t1.setRewardId(burgerReward.getId());
        t1.setPoints(200L);
        t1.setCreatedAt(OffsetDateTime.parse("2026-07-20T10:00:00Z"));

        Transaction t2 = new Transaction();
        t2.setRewardId(burgerReward.getId());
        t2.setPoints(200L);
        t2.setCreatedAt(OffsetDateTime.parse("2026-06-15T10:00:00Z"));

        when(transactionRepository.findByType("REDEEM")).thenReturn(Arrays.asList(t1, t2));
        when(rewardRepository.findAll()).thenReturn(Collections.singletonList(burgerReward));

        // Prepare exchange traffic
        Transaction ex1 = new Transaction();
        ex1.setPartner(kfcPartner);
        Transaction ex2 = new Transaction();
        ex2.setPartner(mcdPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(ex1, ex2));

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        assertEquals(10L, stats.getTotalMembers());
        assertEquals(8L, stats.getActiveMembers());
        assertEquals(2L, stats.getInactiveMembers());
        assertEquals(3L, stats.getEnrolledToday());
        assertEquals(1000L, stats.getPointsIssued());
        assertEquals(400L, stats.getPointsRedeemed());
        assertEquals(50L, stats.getPointsExpired());
        assertEquals(5L, stats.getTotalPartners());
        assertEquals(12L, stats.getTotalRewards());

        // Monthly assertions
        assertEquals(2, stats.getRedeemedPointsPerMonth().size());
        assertEquals(200L, stats.getRedeemedPointsPerMonth().get("Jul 2026"));
        assertEquals(200L, stats.getRedeemedPointsPerMonth().get("Jun 2026"));

        // Popular rewards assertions
        assertEquals(1, stats.getPopularRewards().size());
        assertEquals("Burger Reward", stats.getPopularRewards().get(0).getName());
        assertEquals(2, stats.getPopularRewards().get(0).getCount());

        // Exchange traffic assertions
        assertEquals(1, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(1, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_MultipleTransactions() {
        setUpBasicMocks();

        // Create multiple exchange transactions with various partners
        Transaction ex1 = new Transaction();
        ex1.setPartner(kfcPartner);

        Transaction ex2 = new Transaction();
        ex2.setPartner(mcdPartner);

        Transaction ex3 = new Transaction();
        ex3.setPartner(kfcPartner);

        Transaction ex4 = new Transaction();
        ex4.setPartner(mcdPartner);

        Transaction ex5 = new Transaction();
        ex5.setPartner(kfcPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(ex1, ex2, ex3, ex4, ex5));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // 3 from KFC, 2 from MCD
        assertEquals(3, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(2, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_WithNullPartner() {
        setUpBasicMocks();

        // Create transactions where partner is null
        Transaction exWithoutPartner = new Transaction();
        exWithoutPartner.setPartner(null);

        Transaction exWithPartner = new Transaction();
        exWithPartner.setPartner(kfcPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(exWithoutPartner, exWithPartner));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // Should only count valid partner transactions, null should be ignored
        assertEquals(1, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(0, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_McdPartnerBranch() {
        setUpBasicMocks();

        // Create transactions ONLY from MCD partner to ensure else-if branch is covered
        Transaction exMcd1 = new Transaction();
        exMcd1.setPartner(mcdPartner);

        Transaction exMcd2 = new Transaction();
        exMcd2.setPartner(mcdPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(exMcd1, exMcd2));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // Should count MCD transactions in mcdToKfcCount
        assertEquals(0, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(2, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_MixedKfcAndMcd() {
        setUpBasicMocks();

        // Create mixed transactions from both KFC and MCD
        Transaction exKfc1 = new Transaction();
        exKfc1.setPartner(kfcPartner);

        Transaction exMcd1 = new Transaction();
        exMcd1.setPartner(mcdPartner);

        Transaction exKfc2 = new Transaction();
        exKfc2.setPartner(kfcPartner);

        Transaction exMcd2 = new Transaction();
        exMcd2.setPartner(mcdPartner);

        Transaction exKfc3 = new Transaction();
        exKfc3.setPartner(kfcPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(exKfc1, exMcd1, exKfc2, exMcd2, exKfc3));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // Should count 3 KFC and 2 MCD transactions
        assertEquals(3, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(2, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_UnknownPartnerCode() {
        setUpBasicMocks();

        // Create transaction with partner that has code not matching KFC or MCD
        Partner unknownPartner = new Partner();
        unknownPartner.setId(UUID.randomUUID());
        unknownPartner.setCode("UNKNOWN");
        unknownPartner.setName("Unknown Partner");

        Transaction exUnknown = new Transaction();
        exUnknown.setPartner(unknownPartner);

        Transaction exKfc = new Transaction();
        exKfc.setPartner(kfcPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(exUnknown, exKfc));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // Should only count KFC (unknown partner code should not be counted)
        assertEquals(1, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(0, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_PartnerIsNull() {
        setUpBasicMocks();

        // Transaction with NULL partner (tests first condition in if statement)
        Transaction exWithNullPartner = new Transaction();
        exWithNullPartner.setPartner(null);

        Transaction exValid = new Transaction();
        exValid.setPartner(kfcPartner);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Arrays.asList(exWithNullPartner, exValid));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        // Should only count valid partner transactions
        assertEquals(1, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(0, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    @Test
    void testGetDashboardStats_DuplicateRewardIdsInToMap() {
        setUpBasicMocks();

        UUID duplicateId = UUID.randomUUID();
        Reward r1 = new Reward();
        r1.setId(duplicateId);
        r1.setName("Burger Alpha");

        Reward r2 = new Reward();
        r2.setId(duplicateId);
        r2.setName("Burger Beta");

        when(rewardRepository.findAll()).thenReturn(Arrays.asList(r1, r2));

        Transaction redemption = new Transaction();
        redemption.setRewardId(duplicateId);
        redemption.setPoints(100L);
        redemption.setCreatedAt(OffsetDateTime.parse("2026-07-20T10:00:00Z"));

        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.singletonList(redemption));
        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(1, stats.getPopularRewards().size());
        assertEquals("Burger Alpha", stats.getPopularRewards().get(0).getName());
    }

    @Test
    void testGetDashboardStats_RedemptionWithNullRewardIdAndUnknownReward() {
        setUpBasicMocks();

        // Redemption with NULL reward ID to cover filter(t -> t.getRewardId() != null) returning false
        Transaction redemptionNullReward = new Transaction();
        redemptionNullReward.setRewardId(null);
        redemptionNullReward.setPoints(50L);
        redemptionNullReward.setCreatedAt(OffsetDateTime.parse("2026-07-20T10:00:00Z"));

        // Redemption with unknown reward ID to cover rewardNameMap.getOrDefault returning "Unknown Reward"
        UUID unknownRewardId = UUID.randomUUID();
        Transaction redemptionUnknownReward = new Transaction();
        redemptionUnknownReward.setRewardId(unknownRewardId);
        redemptionUnknownReward.setPoints(150L);
        redemptionUnknownReward.setCreatedAt(OffsetDateTime.parse("2026-07-20T10:00:00Z"));

        when(transactionRepository.findByType("REDEEM")).thenReturn(Arrays.asList(redemptionNullReward, redemptionUnknownReward));
        when(rewardRepository.findAll()).thenReturn(Collections.singletonList(burgerReward));
        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        assertNotNull(stats);
        assertEquals(1, stats.getPopularRewards().size());
        assertEquals("Unknown Reward", stats.getPopularRewards().get(0).getName());
        assertEquals(1, stats.getPopularRewards().get(0).getCount());
    }

    @Test
    void testGetDashboardStats_ExchangeTraffic_PartnerCodeIsNull() {
        setUpBasicMocks();

        Partner partnerWithNullCode = new Partner();
        partnerWithNullCode.setId(UUID.randomUUID());
        partnerWithNullCode.setCode(null);
        partnerWithNullCode.setName("No Code Partner");

        Transaction exNullCode = new Transaction();
        exNullCode.setPartner(partnerWithNullCode);

        when(transactionRepository.findByType("EXCHANGE_OUT")).thenReturn(Collections.singletonList(exNullCode));
        when(transactionRepository.findByType("REDEEM")).thenReturn(Collections.emptyList());
        when(rewardRepository.findAll()).thenReturn(Collections.emptyList());

        AdminDashboardStatsResponse stats = adminDashboardService.getDashboardStats();

        assertEquals(0, stats.getExchangeTraffic().getKfcToMcdCount());
        assertEquals(0, stats.getExchangeTraffic().getMcdToKfcCount());
    }

    // ==================== Helper Methods ====================

    private void setUpBasicMocks() {
        when(memberRepository.count()).thenReturn(10L);
        when(memberRepository.countByStatus("ACTIVE")).thenReturn(8L);
        when(memberRepository.countByStatus("INACTIVE")).thenReturn(2L);
        when(memberRepository.countByCreatedAtAfter(any(OffsetDateTime.class))).thenReturn(3L);

        when(transactionRepository.sumPointsByType("EARN")).thenReturn(1000L);
        when(transactionRepository.sumPointsByType("REDEEM")).thenReturn(400L);
        when(transactionRepository.sumPointsByType("EXPIRED")).thenReturn(50L);

        when(partnerRepository.count()).thenReturn(5L);
        when(rewardRepository.count()).thenReturn(12L);
    }
}
