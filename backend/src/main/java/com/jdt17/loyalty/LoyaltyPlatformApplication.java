package com.jdt17.loyalty;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.cache.annotation.EnableCaching;
import org.springframework.scheduling.annotation.EnableScheduling;

@SpringBootApplication
@EnableScheduling
@EnableCaching
public class LoyaltyPlatformApplication {

	public static void main(String[] args) {
		SpringApplication.run(LoyaltyPlatformApplication.class, args);
	}
}
