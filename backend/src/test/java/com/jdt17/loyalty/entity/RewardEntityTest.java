package com.jdt17.loyalty.entity;

import org.junit.jupiter.api.Test;
import java.time.OffsetDateTime;
import static org.junit.jupiter.api.Assertions.*;

class RewardEntityTest {

    @Test
    void testPrePersistPreUpdate() {
        Reward reward = new Reward();
        assertNull(reward.getCreatedAt());
        assertNull(reward.getUpdatedAt());

        reward.onCreate();
        assertNotNull(reward.getCreatedAt());
        assertNotNull(reward.getUpdatedAt());

        OffsetDateTime firstUpdated = reward.getUpdatedAt();
        try {
            Thread.sleep(10);
        } catch (InterruptedException e) {
            Thread.currentThread().interrupt();
        }

        reward.onUpdate();
        assertNotEquals(firstUpdated, reward.getUpdatedAt());
    }
}
