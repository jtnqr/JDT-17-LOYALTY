-- V1: Create all tables for PISTOS Loyalty Platform
-- Author: JDT-17 (Julius & team)
-- Date: 2026-07-07
-- TSD v1.1 compliant

-- ============================================================
-- MASTER TABLES
-- ============================================================

-- MST_ADMIN: CMS admin credentials (single admin)
CREATE TABLE mst_admin (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    password_hash   VARCHAR(255)  NOT NULL,
    status          VARCHAR(20)   NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- MST_MEMBER: Registered member profiles
CREATE TABLE mst_member (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name            VARCHAR(255)  NOT NULL,
    email           VARCHAR(255)  NOT NULL UNIQUE,
    phone           VARCHAR(20),
    password_hash   VARCHAR(255)  NOT NULL,
    status          VARCHAR(20)   NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by      UUID REFERENCES mst_admin(id),
    updated_by      UUID REFERENCES mst_admin(id),
    created_at      TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ   NOT NULL DEFAULT now()
);

CREATE INDEX idx_member_email ON mst_member(email);
CREATE INDEX idx_member_phone ON mst_member(phone);

-- MST_PARTNER: Partner config (KFC, McDonald's)
CREATE TABLE mst_partner (
    id                        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name                      VARCHAR(255)  NOT NULL,
    code                      VARCHAR(10)   NOT NULL UNIQUE,
    points_per_thousand_idr   INT           NOT NULL DEFAULT 1 CHECK (points_per_thousand_idr > 0),
    expiry_days               INT           NOT NULL DEFAULT 365 CHECK (expiry_days > 0),
    api_key                   VARCHAR(255),
    status                    VARCHAR(20)   NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_by                UUID REFERENCES mst_admin(id),
    updated_by                UUID REFERENCES mst_admin(id),
    created_at                TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at                TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- MST_REWARD: Reward catalog (11 items)
CREATE TABLE mst_reward (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    partner_id  UUID          NOT NULL REFERENCES mst_partner(id),
    name        VARCHAR(255)  NOT NULL,
    point_cost  INT           NOT NULL CHECK (point_cost > 0),
    status      VARCHAR(20)   NOT NULL CHECK (status IN ('ACTIVE', 'INACTIVE')),
    created_at  TIMESTAMPTZ   NOT NULL DEFAULT now(),
    updated_at  TIMESTAMPTZ   NOT NULL DEFAULT now()
);

-- MST_EXCHANGE_RATE: Directional rates between partners
CREATE TABLE mst_exchange_rate (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    from_partner_id   UUID           NOT NULL REFERENCES mst_partner(id),
    to_partner_id     UUID           NOT NULL REFERENCES mst_partner(id),
    rate              DECIMAL(10,4)  NOT NULL CHECK (rate > 0),
    effective_from    TIMESTAMPTZ    NOT NULL DEFAULT now(),
    created_by        UUID REFERENCES mst_admin(id),
    updated_at        TIMESTAMPTZ    NOT NULL DEFAULT now(),
    CONSTRAINT chk_exchange_rate_different_partners CHECK (from_partner_id != to_partner_id),
    CONSTRAINT uq_exchange_rate UNIQUE (from_partner_id, to_partner_id, effective_from)
);

-- ============================================================
-- TRANSACTION TABLES
-- ============================================================

-- TRX_POINT_BALANCE: Current balance per (member, partner), with optimistic locking
CREATE TABLE trx_point_balance (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id   UUID      NOT NULL REFERENCES mst_member(id) ON DELETE CASCADE,
    partner_id  UUID      NOT NULL REFERENCES mst_partner(id) ON DELETE RESTRICT,
    balance     BIGINT    NOT NULL DEFAULT 0 CHECK (balance >= 0),
    version     BIGINT    NOT NULL DEFAULT 0,
    updated_at  TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT uq_balance_member_partner UNIQUE (member_id, partner_id)
);

-- TRX_TRANSACTION: Immutable point movement log
CREATE TABLE trx_transaction (
    id                UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    member_id         UUID         NOT NULL REFERENCES mst_member(id),
    partner_id        UUID         NOT NULL REFERENCES mst_partner(id),
    type              VARCHAR(20)  NOT NULL CHECK (type IN ('EARN', 'REDEEM', 'EXCHANGE_IN', 'EXCHANGE_OUT', 'EXPIRED')),
    points            BIGINT       NOT NULL CHECK (points > 0),
    trx_amount_idr    BIGINT,
    related_tx_id     UUID REFERENCES trx_transaction(id),
    reward_id         UUID REFERENCES mst_reward(id),
    expires_at        TIMESTAMPTZ,
    created_at        TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_transaction_member_date ON trx_transaction(member_id, created_at DESC);
CREATE INDEX idx_transaction_expiry ON trx_transaction(expires_at) WHERE type = 'EARN';

-- TRX_AUDIT_TRAIL: Append-only compliance log
CREATE TABLE trx_audit_trail (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type   VARCHAR(50)  NOT NULL,
    actor_id     UUID,
    actor_type   VARCHAR(20)  NOT NULL CHECK (actor_type IN ('MEMBER', 'SYSTEM', 'ADMIN', 'PARTNER')),
    entity_type  VARCHAR(50)  NOT NULL,
    entity_id    UUID         NOT NULL,
    payload      JSONB,
    created_at   TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor   ON trx_audit_trail(actor_id);
CREATE INDEX idx_audit_entity  ON trx_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_created ON trx_audit_trail(created_at DESC);
