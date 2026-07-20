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
}
