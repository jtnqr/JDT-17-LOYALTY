package com.jdt17.loyalty.service;

import com.jdt17.loyalty.dto.admin.AdminDashboardStatsResponse;
import com.jdt17.loyalty.entity.Reward;
import com.jdt17.loyalty.entity.Transaction;
import com.jdt17.loyalty.repository.MemberRepository;
import com.jdt17.loyalty.repository.PartnerRepository;
import com.jdt17.loyalty.repository.RewardRepository;
import com.jdt17.loyalty.repository.TransactionRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.time.format.DateTimeFormatter;
import java.time.temporal.ChronoUnit;
import java.util.*;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AdminDashboardService {

    private final MemberRepository memberRepository;
    private final PartnerRepository partnerRepository;
    private final RewardRepository rewardRepository;
    private final TransactionRepository transactionRepository;

    public AdminDashboardStatsResponse getDashboardStats() {
        long totalMembers = memberRepository.count();
        long activeMembers = memberRepository.countByStatus("ACTIVE");
        long inactiveMembers = memberRepository.countByStatus("INACTIVE");
        
        OffsetDateTime startOfToday = OffsetDateTime.now().truncatedTo(ChronoUnit.DAYS);
        long enrolledToday = memberRepository.countByCreatedAtAfter(startOfToday);

        long pointsIssued = transactionRepository.sumPointsByType("EARN");
        long pointsRedeemed = transactionRepository.sumPointsByType("REDEEM");
        long pointsExpired = transactionRepository.sumPointsByType("EXPIRED");

        long totalPartners = partnerRepository.count();
        long totalRewards = rewardRepository.count();

        // 1. Redeemed points per month
        List<Transaction> redemptions = transactionRepository.findByType("REDEEM");
        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMM yyyy", Locale.ENGLISH);

        Map<String, Long> redeemedPointsPerMonth = redemptions.stream()
                .collect(Collectors.groupingBy(
                        t -> t.getCreatedAt().format(formatter),
                        LinkedHashMap::new,
                        Collectors.summingLong(Transaction::getPoints)
                ));

        // 2. Popular rewards mapping
        List<Reward> allRewards = rewardRepository.findAll();
        Map<UUID, String> rewardNameMap = allRewards.stream()
                .collect(Collectors.toMap(Reward::getId, Reward::getName, (a, b) -> a));

        Map<UUID, Long> rewardCounts = redemptions.stream()
                .filter(t -> t.getRewardId() != null)
                .collect(Collectors.groupingBy(
                        Transaction::getRewardId,
                        Collectors.counting()
                ));

        List<AdminDashboardStatsResponse.PopularRewardDetail> popularRewards = rewardCounts.entrySet().stream()
                .map(entry -> AdminDashboardStatsResponse.PopularRewardDetail.builder()
                        .name(rewardNameMap.getOrDefault(entry.getKey(), "Unknown Reward"))
                        .count(entry.getValue())
                        .build())
                .sorted(Comparator.comparing(AdminDashboardStatsResponse.PopularRewardDetail::getCount).reversed())
                .limit(5)
                .collect(Collectors.toList());

        return AdminDashboardStatsResponse.builder()
                .totalMembers(totalMembers)
                .activeMembers(activeMembers)
                .inactiveMembers(inactiveMembers)
                .enrolledToday(enrolledToday)
                .pointsIssued(pointsIssued)
                .pointsRedeemed(pointsRedeemed)
                .pointsExpired(pointsExpired)
                .totalPartners(totalPartners)
                .totalRewards(totalRewards)
                .redeemedPointsPerMonth(redeemedPointsPerMonth)
                .popularRewards(popularRewards)
                .build();
    }
}
