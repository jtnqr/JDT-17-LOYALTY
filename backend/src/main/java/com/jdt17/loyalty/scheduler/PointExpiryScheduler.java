package com.jdt17.loyalty.scheduler;

import com.jdt17.loyalty.service.TransactionService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
public class PointExpiryScheduler {
    private final TransactionService transactionService;

    @Scheduled(cron = "0 0 17 * * *", zone = "UTC") // 00:00 WIB (UTC+7)
    public void runPointExpiry() {
        log.info("Starting daily point expiry job");
        try {
            transactionService.expirePoints();
            log.info("Daily point expiry job finished successfully");
        } catch (Exception e) {
            log.error("Error during daily point expiry job", e);
        }
    }
}
