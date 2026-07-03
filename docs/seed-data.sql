-- JDT-17-LOYALTY Seed Data
-- Purpose: Populate database with demo data for development and testing
-- Run this AFTER Flyway migrations complete

-- ============================================================
-- 1. ADMIN USER
-- ============================================================
INSERT INTO mst_admin (id, username, email, password_hash, status, created_at, updated_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'admin',
    'admin@jdt17loyalty.com',
    -- Password: Admin123! (bcrypt hash, replace with actual hash from your encoder)
    '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
    'ACTIVE',
    NOW(),
    NOW()
);

-- ============================================================
-- 2. PARTNERS (KFC & McDonald's)
-- ============================================================
INSERT INTO mst_partner (id, name, code, points_per_thousand_idr, expiry_days, api_key, status, created_by, created_at, updated_at)
VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Indonesia',
        'KFC',
        1,  -- 1 point per IDR 1,000
        365,  -- points expire in 1 year
        'kfc_api_key_2026_secure_demo_only',
        'ACTIVE',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW(),
        NOW()
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        'McDonald''s Indonesia',
        'MCD',
        1,  -- 1 point per IDR 1,000
        365,
        'mcd_api_key_2026_secure_demo_only',
        'ACTIVE',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW(),
        NOW()
    );

-- ============================================================
-- 3. EXCHANGE RATES (KFC ↔ McD, bidirectional)
-- ============================================================
INSERT INTO mst_exchange_rate (id, from_partner_id, to_partner_id, rate, effective_from, created_by, updated_at)
VALUES
    (
        '770e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440001',  -- KFC
        '660e8400-e29b-41d4-a716-446655440002',  -- MCD
        0.8,  -- 100 KFC points = 80 McD points
        '2026-01-01 00:00:00',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW()
    ),
    (
        '770e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440002',  -- MCD
        '660e8400-e29b-41d4-a716-446655440001',  -- KFC
        0.9,  -- 100 McD points = 90 KFC points
        '2026-01-01 00:00:00',
        '550e8400-e29b-41d4-a716-446655440001',
        NOW()
    );

-- ============================================================
-- 4. REWARDS (KFC rewards)
-- ============================================================
INSERT INTO mst_reward (id, partner_id, name, point_cost, status, created_at, updated_at)
VALUES
    (
        '880e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Original Recipe Chicken 1pc',
        250,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC French Fries Regular',
        150,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440003',
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Zinger Burger',
        400,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440004',
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Family Bucket (9pc)',
        1200,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440005',
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Pepsi Regular',
        100,
        'ACTIVE',
        NOW(),
        NOW()
    );

-- ============================================================
-- 5. REWARDS (McDonald's rewards)
-- ============================================================
INSERT INTO mst_reward (id, partner_id, name, point_cost, status, created_at, updated_at)
VALUES
    (
        '880e8400-e29b-41d4-a716-446655440006',
        '660e8400-e29b-41d4-a716-446655440002',
        'Big Mac Burger',
        350,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440007',
        '660e8400-e29b-41d4-a716-446655440002',
        'McnugGets 6pcs',
        200,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440008',
        '660e8400-e29b-41d4-a716-446655440002',
        'McFlurry Oreo',
        250,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440009',
        '660e8400-e29b-41d4-a716-446655440002',
        'French Fries Large',
        150,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440010',
        '660e8400-e29b-41d4-a716-446655440002',
        'McCafe Latte',
        180,
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '880e8400-e29b-41d4-a716-446655440011',
        '660e8400-e29b-41d4-a716-446655440002',
        'McValue Meal (Burger + Fries + Drink)',
        500,
        'ACTIVE',
        NOW(),
        NOW()
    );

-- ============================================================
-- 6. TEST MEMBERS
-- ============================================================
INSERT INTO mst_member (id, name, email, phone, password_hash, status, created_at, updated_at)
VALUES
    (
        '990e8400-e29b-41d4-a716-446655440001',
        'Budi Santoso',
        'budi.santoso@example.com',
        '081234567890',
        -- Password: Member123! (bcrypt hash, replace with actual hash from your encoder)
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '990e8400-e29b-41d4-a716-446655440002',
        'Siti Rahmawati',
        'siti.rahmawati@example.com',
        '081298765432',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '990e8400-e29b-41d4-a716-446655440003',
        'Andi Wijaya',
        'andi.wijaya@example.com',
        '081287654321',
        '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy',
        'ACTIVE',
        NOW(),
        NOW()
    );

-- ============================================================
-- 7. POINT BALANCES (initialize for test members)
-- ============================================================
INSERT INTO trx_point_balance (id, member_id, partner_id, balance, version, updated_at)
VALUES
    -- Budi: 500 KFC points, 300 McD points
    (
        'aa0e8400-e29b-41d4-a716-446655440001',
        '990e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440001',
        500,
        0,
        NOW()
    ),
    (
        'aa0e8400-e29b-41d4-a716-446655440002',
        '990e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440002',
        300,
        0,
        NOW()
    ),
    -- Siti: 1200 KFC points, 50 McD points
    (
        'aa0e8400-e29b-41d4-a716-446655440003',
        '990e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440001',
        1200,
        0,
        NOW()
    ),
    (
        'aa0e8400-e29b-41d4-a716-446655440004',
        '990e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440002',
        50,
        0,
        NOW()
    ),
    -- Andi: 0 KFC points, 0 McD points (new member)
    (
        'aa0e8400-e29b-41d4-a716-446655440005',
        '990e8400-e29b-41d4-a716-446655440003',
        '660e8400-e29b-41d4-a716-446655440001',
        0,
        0,
        NOW()
    ),
    (
        'aa0e8400-e29b-41d4-a716-446655440006',
        '990e8400-e29b-41d4-a716-446655440003',
        '660e8400-e29b-41d4-a716-446655440002',
        0,
        0,
        NOW()
    );

-- ============================================================
-- 8. SAMPLE TRANSACTIONS (for history demo)
-- ============================================================
INSERT INTO trx_transaction (id, member_id, partner_id, type, points, trx_amount_idr, expires_at, created_at)
VALUES
    -- Budi earned 500 KFC points from IDR 500,000 purchase
    (
        'bb0e8400-e29b-41d4-a716-446655440001',
        '990e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440001',
        'EARN',
        500,
        500000,
        NOW() + INTERVAL '365 days',
        NOW() - INTERVAL '2 days'
    ),
    -- Budi earned 300 McD points from IDR 300,000 purchase
    (
        'bb0e8400-e29b-41d4-a716-446655440002',
        '990e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440002',
        'EARN',
        300,
        300000,
        NOW() + INTERVAL '365 days',
        NOW() - INTERVAL '1 day'
    ),
    -- Siti earned 1200 KFC points from IDR 1,200,000 purchase
    (
        'bb0e8400-e29b-41d4-a716-446655440003',
        '990e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440001',
        'EARN',
        1200,
        1200000,
        NOW() + INTERVAL '365 days',
        NOW() - INTERVAL '5 days'
    ),
    -- Siti earned 50 McD points from IDR 50,000 purchase
    (
        'bb0e8400-e29b-41d4-a716-446655440004',
        '990e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440002',
        'EARN',
        50,
        50000,
        NOW() + INTERVAL '365 days',
        NOW() - INTERVAL '3 days'
    );

-- ============================================================
-- 9. AUDIT TRAIL (for demonstration)
-- ============================================================
INSERT INTO trx_audit_trail (id, event_type, actor_id, actor_type, entity_type, entity_id, payload, created_at)
VALUES
    (
        'cc0e8400-e29b-41d4-a716-446655440001',
        'MEMBER_REGISTERED',
        NULL,
        'SYSTEM',
        'MEMBER',
        '990e8400-e29b-41d4-a716-446655440001',
        '{"name": "Budi Santoso", "email": "budi.santoso@example.com"}',
        NOW() - INTERVAL '2 days'
    ),
    (
        'cc0e8400-e29b-41d4-a716-446655440002',
        'POINTS_EARNED',
        '990e8400-e29b-41d4-a716-446655440001',
        'MEMBER',
        'TRANSACTION',
        'bb0e8400-e29b-41d4-a716-446655440001',
        '{"points": 500, "partner": "KFC", "trxAmount": 500000}',
        NOW() - INTERVAL '2 days'
    ),
    (
        'cc0e8400-e29b-41d4-a716-446655440003',
        'MEMBER_REGISTERED',
        NULL,
        'SYSTEM',
        'MEMBER',
        '990e8400-e29b-41d4-a716-446655440002',
        '{"name": "Siti Rahmawati", "email": "siti.rahmawati@example.com"}',
        NOW() - INTERVAL '5 days'
    ),
    (
        'cc0e8400-e29b-41d4-a716-446655440004',
        'POINTS_EARNED',
        '990e8400-e29b-41d4-a716-446655440002',
        'MEMBER',
        'TRANSACTION',
        'bb0e8400-e29b-41d4-a716-446655440003',
        '{"points": 1200, "partner": "KFC", "trxAmount": 1200000}',
        NOW() - INTERVAL '5 days'
    );

-- ============================================================
-- SEED DATA SUMMARY
-- ============================================================
-- 1 Admin: admin / Admin123!
-- 2 Partners: KFC, McDonald's (with API keys)
-- 2 Exchange Rates: KFC↔McD (0.8 and 0.9)
-- 11 Rewards: 5 KFC + 6 McD
-- 3 Test Members: Budi (500 KFC, 300 McD), Siti (1200 KFC, 50 McD), Andi (0/0)
-- 4 Sample Transactions (EARN)
-- 4 Sample Audit Trail entries
--
-- SECURITY NOTES:
-- - All passwords use the same bcrypt hash (Member123! / Admin123!)
-- - Regenerate hashes with BCryptPasswordEncoder before deployment
-- - API keys are for development/testing — rotate before production
-- - UUIDs are hardcoded for reproducible testing environments
-- ============================================================
