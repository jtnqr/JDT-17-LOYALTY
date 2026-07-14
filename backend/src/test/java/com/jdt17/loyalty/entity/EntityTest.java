package com.jdt17.loyalty.entity;

import org.junit.jupiter.api.Test;

import java.time.OffsetDateTime;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.*;

class EntityTest {

    @Test
    void testAdminEntity() {
        Admin admin = new Admin();
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        admin.setId(id);
        admin.setName("Admin Name");
        admin.setEmail("admin@example.com");
        admin.setPasswordHash("hash");
        admin.setStatus("ACTIVE");
        admin.setCreatedAt(now);

        assertEquals(id, admin.getId());
        assertEquals("Admin Name", admin.getName());
        assertEquals("admin@example.com", admin.getEmail());
        assertEquals("hash", admin.getPasswordHash());
        assertEquals("ACTIVE", admin.getStatus());
        assertEquals(now, admin.getCreatedAt());

        // Test Builder
        Admin built = Admin.builder()
                .id(id)
                .name("Admin Name")
                .email("admin@example.com")
                .passwordHash("hash")
                .status("ACTIVE")
                .createdAt(now)
                .build();

        assertEquals(id, built.getId());

        // Test NoArgsConstructor / AllArgsConstructor
        Admin admin2 = new Admin(id, "Admin Name", "admin@example.com", "hash", "ACTIVE", now);
        assertEquals("Admin Name", admin2.getName());

        // Test Lifecycle callback
        Admin prePersistAdmin = new Admin();
        assertNull(prePersistAdmin.getCreatedAt());
        assertNull(prePersistAdmin.getStatus());
        prePersistAdmin.onCreate();
        assertNotNull(prePersistAdmin.getCreatedAt());
        assertEquals("ACTIVE", prePersistAdmin.getStatus());

        // Test Lifecycle callback when status is pre-set
        Admin prePersistAdminWithStatus = new Admin();
        prePersistAdminWithStatus.setStatus("INACTIVE");
        prePersistAdminWithStatus.onCreate();
        assertEquals("INACTIVE", prePersistAdminWithStatus.getStatus());
    }

    @Test
    void testAuditTrailEntity() {
        UUID id = UUID.randomUUID();
        UUID actorId = UUID.randomUUID();
        UUID entityId = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        AuditTrail audit = new AuditTrail();
        audit.setId(id);
        audit.setEventType("MEMBER_REGISTERED");
        audit.setActorId(actorId);
        audit.setActorType("ADMIN");
        audit.setEntityType("MEMBER");
        audit.setEntityId(entityId);
        audit.setPayload("payload");
        audit.setCreatedAt(now);

        assertEquals(id, audit.getId());
        assertEquals("MEMBER_REGISTERED", audit.getEventType());
        assertEquals(actorId, audit.getActorId());
        assertEquals("ADMIN", audit.getActorType());
        assertEquals("MEMBER", audit.getEntityType());
        assertEquals(entityId, audit.getEntityId());
        assertEquals("payload", audit.getPayload());
        assertEquals(now, audit.getCreatedAt());

        // Test Builder
        AuditTrail built = AuditTrail.builder()
                .id(id)
                .eventType("MEMBER_REGISTERED")
                .actorId(actorId)
                .actorType("ADMIN")
                .entityType("MEMBER")
                .entityId(entityId)
                .payload("payload")
                .createdAt(now)
                .build();
        assertEquals(id, built.getId());

        // Test NoArgsConstructor / AllArgsConstructor
        AuditTrail audit2 = new AuditTrail(id, "MEMBER_REGISTERED", actorId, "ADMIN", "MEMBER", entityId, "payload", now);
        assertEquals("MEMBER_REGISTERED", audit2.getEventType());

        // Test Lifecycle callback
        AuditTrail prePersistAudit = new AuditTrail();
        assertNull(prePersistAudit.getCreatedAt());
        prePersistAudit.onCreate();
        assertNotNull(prePersistAudit.getCreatedAt());
    }

    @Test
    void testMemberEntity() {
        UUID id = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        Member member = new Member();
        member.setId(id);
        member.setName("Budi");
        member.setEmail("budi@example.com");
        member.setPhone("081234567890");
        member.setPasswordHash("hash");
        member.setStatus("ACTIVE");
        member.setCreatedAt(now);
        member.setUpdatedAt(now);

        assertEquals(id, member.getId());
        assertEquals("Budi", member.getName());
        assertEquals("budi@example.com", member.getEmail());
        assertEquals("081234567890", member.getPhone());
        assertEquals("hash", member.getPasswordHash());
        assertEquals("ACTIVE", member.getStatus());
        assertEquals(now, member.getCreatedAt());
        assertEquals(now, member.getUpdatedAt());

        // Test Builder
        Member built = Member.builder()
                .id(id)
                .name("Budi")
                .email("budi@example.com")
                .phone("081234567890")
                .passwordHash("hash")
                .status("ACTIVE")
                .createdAt(now)
                .updatedAt(now)
                .build();
        assertEquals(id, built.getId());

        // Test AllArgsConstructor
        Member member2 = new Member(id, "Budi", "budi@example.com", "081234567890", "hash", "ACTIVE", now, now);
        assertEquals("Budi", member2.getName());

        // Test Lifecycle callbacks
        Member prePersistMember = new Member();
        assertNull(prePersistMember.getCreatedAt());
        assertNull(prePersistMember.getUpdatedAt());
        assertNull(prePersistMember.getStatus());

        prePersistMember.onCreate();
        assertNotNull(prePersistMember.getCreatedAt());
        assertNotNull(prePersistMember.getUpdatedAt());
        assertEquals("ACTIVE", prePersistMember.getStatus());

        Member prePersistMemberWithStatus = new Member();
        prePersistMemberWithStatus.setStatus("INACTIVE");
        prePersistMemberWithStatus.onCreate();
        assertEquals("INACTIVE", prePersistMemberWithStatus.getStatus());

        Member preUpdateMember = new Member();
        assertNull(preUpdateMember.getUpdatedAt());
        preUpdateMember.onUpdate();
        assertNotNull(preUpdateMember.getUpdatedAt());
    }

    @Test
    void testPartnerEntity() {
        UUID id = UUID.randomUUID();
        UUID createdBy = UUID.randomUUID();
        UUID updatedBy = UUID.randomUUID();
        OffsetDateTime now = OffsetDateTime.now();

        Partner partner = new Partner();
        partner.setId(id);
        partner.setName("KFC");
        partner.setCode("KFC");
        partner.setPointPerThousandIdr(100);
        partner.setExpiryDays(365);
        partner.setApiKey("api_key");
        partner.setStatus("ACTIVE");
        partner.setCreatedBy(createdBy);
        partner.setUpdatedBy(updatedBy);
        partner.setCreatedAt(now);
        partner.setUpdatedAt(now);

        assertEquals(id, partner.getId());
        assertEquals("KFC", partner.getName());
        assertEquals("KFC", partner.getCode());
        assertEquals(100, partner.getPointPerThousandIdr());
        assertEquals(365, partner.getExpiryDays());
        assertEquals("api_key", partner.getApiKey());
        assertEquals("ACTIVE", partner.getStatus());
        assertEquals(createdBy, partner.getCreatedBy());
        assertEquals(updatedBy, partner.getUpdatedBy());
        assertEquals(now, partner.getCreatedAt());
        assertEquals(now, partner.getUpdatedAt());

        // Test Builder
        Partner built = Partner.builder()
                .id(id)
                .name("KFC")
                .code("KFC")
                .pointPerThousandIdr(100)
                .expiryDays(365)
                .apiKey("api_key")
                .status("ACTIVE")
                .createdBy(createdBy)
                .updatedBy(updatedBy)
                .createdAt(now)
                .updatedAt(now)
                .build();
        assertEquals(id, built.getId());

        // Test AllArgsConstructor
        Partner partner2 = new Partner(id, "KFC", "KFC", 100, 365, "api_key", "ACTIVE", null, createdBy, updatedBy, now, now);
        assertEquals("KFC", partner2.getName());

        // Test Lifecycle callbacks
        Partner prePersistPartner = new Partner();
        assertNull(prePersistPartner.getCreatedAt());
        assertNull(prePersistPartner.getUpdatedAt());
        prePersistPartner.onCreate();
        assertNotNull(prePersistPartner.getCreatedAt());
        assertNotNull(prePersistPartner.getUpdatedAt());

        Partner preUpdatePartner = new Partner();
        assertNull(preUpdatePartner.getUpdatedAt());
        preUpdatePartner.onUpdate();
        assertNotNull(preUpdatePartner.getUpdatedAt());
    }

    @Test
    void testPointBalanceEntity() {
        UUID id = UUID.randomUUID();
        Member member = new Member();
        Partner partner = new Partner();
        OffsetDateTime now = OffsetDateTime.now();

        PointBalance balance = new PointBalance();
        balance.setId(id);
        balance.setMember(member);
        balance.setPartner(partner);
        balance.setBalance(1000L);
        balance.setVersion(1L);
        balance.setUpdatedAt(now);

        assertEquals(id, balance.getId());
        assertEquals(member, balance.getMember());
        assertEquals(partner, balance.getPartner());
        assertEquals(1000L, balance.getBalance());
        assertEquals(1L, balance.getVersion());
        assertEquals(now, balance.getUpdatedAt());

        // Test Builder
        PointBalance built = PointBalance.builder()
                .id(id)
                .member(member)
                .partner(partner)
                .balance(1000L)
                .version(1L)
                .updatedAt(now)
                .build();
        assertEquals(id, built.getId());

        // Test AllArgsConstructor
        PointBalance balance2 = new PointBalance(id, member, partner, 1000L, 1L, now);
        assertEquals(1000L, balance2.getBalance());

        // Test Lifecycle callbacks
        PointBalance prePersistPointBalance = new PointBalance();
        assertNull(prePersistPointBalance.getUpdatedAt());
        prePersistPointBalance.onUpdate();
        assertNotNull(prePersistPointBalance.getUpdatedAt());
    }

    @Test
    void testExchangeRateEntity() {
        UUID id = UUID.randomUUID();
        Partner fromPartner = new Partner();
        Partner toPartner = new Partner();
        java.math.BigDecimal rateVal = new java.math.BigDecimal("0.8500");
        OffsetDateTime now = OffsetDateTime.now();
        UUID createdBy = UUID.randomUUID();

        ExchangeRate rate = new ExchangeRate();
        rate.setId(id);
        rate.setFromPartner(fromPartner);
        rate.setToPartner(toPartner);
        rate.setRate(rateVal);
        rate.setEffectiveFrom(now);
        rate.setCreatedBy(createdBy);
        rate.setUpdatedAt(now);

        assertEquals(id, rate.getId());
        assertEquals(fromPartner, rate.getFromPartner());
        assertEquals(toPartner, rate.getToPartner());
        assertEquals(rateVal, rate.getRate());
        assertEquals(now, rate.getEffectiveFrom());
        assertEquals(createdBy, rate.getCreatedBy());
        assertEquals(now, rate.getUpdatedAt());

        // Test Builder
        ExchangeRate built = ExchangeRate.builder()
                .id(id)
                .fromPartner(fromPartner)
                .toPartner(toPartner)
                .rate(rateVal)
                .effectiveFrom(now)
                .createdBy(createdBy)
                .updatedAt(now)
                .build();
        assertEquals(id, built.getId());

        // Test AllArgsConstructor
        ExchangeRate rate2 = new ExchangeRate(id, fromPartner, toPartner, rateVal, now, createdBy, now);
        assertEquals(rateVal, rate2.getRate());

        // Test Lifecycle callbacks
        ExchangeRate prePersistRate = new ExchangeRate();
        assertNull(prePersistRate.getEffectiveFrom());
        assertNull(prePersistRate.getUpdatedAt());
        prePersistRate.onCreate();
        assertNotNull(prePersistRate.getEffectiveFrom());
        assertNotNull(prePersistRate.getUpdatedAt());

        // Test Lifecycle callback when effectiveFrom is preset
        ExchangeRate prePersistRatePreset = new ExchangeRate();
        prePersistRatePreset.setEffectiveFrom(now);
        prePersistRatePreset.onCreate();
        assertEquals(now, prePersistRatePreset.getEffectiveFrom());

        ExchangeRate preUpdateRate = new ExchangeRate();
        assertNull(preUpdateRate.getUpdatedAt());
        preUpdateRate.onUpdate();
        assertNotNull(preUpdateRate.getUpdatedAt());
    }
}
