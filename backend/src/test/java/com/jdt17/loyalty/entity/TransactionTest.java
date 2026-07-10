package com.jdt17.loyalty.entity;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class TransactionTest {

    @Test
    void testTransactionBuilderAndGettersSetters() {
        UUID id = UUID.randomUUID();
        Member member = new Member();
        Partner partner = new Partner();
        Transaction relatedTx = new Transaction();
        UUID rewardId = UUID.randomUUID();
        OffsetDateTime expiresAt = OffsetDateTime.now().plusDays(365);
        OffsetDateTime createdAt = OffsetDateTime.now();

        Transaction transaction = Transaction.builder()
                .id(id)
                .member(member)
                .partner(partner)
                .type("EARN")
                .points(150L)
                .trxAmountIdr(150000L)
                .relatedTx(relatedTx)
                .rewardId(rewardId)
                .expiresAt(expiresAt)
                .createdAt(createdAt)
                .build();

        assertEquals(id, transaction.getId());
        assertEquals(member, transaction.getMember());
        assertEquals(partner, transaction.getPartner());
        assertEquals("EARN", transaction.getType());
        assertEquals(150L, transaction.getPoints());
        assertEquals(150000L, transaction.getTrxAmountIdr());
        assertEquals(relatedTx, transaction.getRelatedTx());
        assertEquals(rewardId, transaction.getRewardId());
        assertEquals(expiresAt, transaction.getExpiresAt());
        assertEquals(createdAt, transaction.getCreatedAt());

        // Test setters
        UUID newId = UUID.randomUUID();
        transaction.setId(newId);
        assertEquals(newId, transaction.getId());

        transaction.setType("REDEEM");
        assertEquals("REDEEM", transaction.getType());

        transaction.setPoints(200L);
        assertEquals(200L, transaction.getPoints());

        transaction.setTrxAmountIdr(200000L);
        assertEquals(200000L, transaction.getTrxAmountIdr());

        Transaction newRelatedTx = new Transaction();
        transaction.setRelatedTx(newRelatedTx);
        assertEquals(newRelatedTx, transaction.getRelatedTx());

        UUID newRewardId = UUID.randomUUID();
        transaction.setRewardId(newRewardId);
        assertEquals(newRewardId, transaction.getRewardId());

        OffsetDateTime newExpiresAt = OffsetDateTime.now();
        transaction.setExpiresAt(newExpiresAt);
        assertEquals(newExpiresAt, transaction.getExpiresAt());

        OffsetDateTime newCreatedAt = OffsetDateTime.now();
        transaction.setCreatedAt(newCreatedAt);
        assertEquals(newCreatedAt, transaction.getCreatedAt());

        Member newMember = new Member();
        transaction.setMember(newMember);
        assertEquals(newMember, transaction.getMember());

        Partner newPartner = new Partner();
        transaction.setPartner(newPartner);
        assertEquals(newPartner, transaction.getPartner());
    }

    @Test
    void testOnCreate() {
        Transaction transaction = new Transaction();
        assertNull(transaction.getCreatedAt());
        transaction.onCreate();
        assertNotNull(transaction.getCreatedAt());
    }

    @Test
    void testNoArgsConstructorAndAllArgsConstructor() {
        Transaction transaction1 = new Transaction();
        assertNotNull(transaction1);

        UUID id = UUID.randomUUID();
        Member member = new Member();
        Partner partner = new Partner();
        Transaction related = new Transaction();
        UUID rewardId = UUID.randomUUID();
        OffsetDateTime expiresAt = OffsetDateTime.now();
        OffsetDateTime createdAt = OffsetDateTime.now();

        Transaction transaction2 = new Transaction(id, member, partner, "EARN", 100L, 100000L, related, rewardId, expiresAt, createdAt);
        assertEquals(id, transaction2.getId());
        assertEquals("EARN", transaction2.getType());
    }
}
