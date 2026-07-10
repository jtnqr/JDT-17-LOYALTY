-- V5: Seed demo data (1 admin + 3 members + balances + sample transactions + audit trail)
-- Author: JDT-17
-- Date: 2026-07-07
-- TSD v1.1 compliant
-- NOTE: All passwords use bcrypt hash of 'Admin123!' / 'Member123!' — regenerate before production

-- ============================================================
-- 1. ADMIN USER
-- ============================================================
INSERT INTO mst_admin (id, name, email, password_hash, status, created_at)
VALUES (
    '550e8400-e29b-41d4-a716-446655440001',
    'Admin PISTOS',
    'admin@jdt17loyalty.com',
    '$2a$12$Y7G9EqKlck2VIfejUBq3PuyxjhvQMpno4Ql1ydAVstvYszRLGwLjG',  -- Admin123!
    'ACTIVE',
    NOW()
);

-- ============================================================
-- 2. TEST MEMBERS
-- ============================================================
INSERT INTO mst_member (id, name, email, phone, password_hash, status, created_at, updated_at)
VALUES
    (
        '990e8400-e29b-41d4-a716-446655440001',
        'Budi Santoso',
        'budi.santoso@example.com',
        '081234567890',
        '$2a$12$qGcI.Co1Nit1oN9mgPRzIumvffyCicmvhI4UxmJEMXzDzeobV7z36',  -- Member123!
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '990e8400-e29b-41d4-a716-446655440002',
        'Siti Rahmawati',
        'siti.rahmawati@example.com',
        '081298765432',
        '$2a$12$qGcI.Co1Nit1oN9mgPRzIumvffyCicmvhI4UxmJEMXzDzeobV7z36',  -- Member123!
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '990e8400-e29b-41d4-a716-446655440003',
        'Andi Wijaya',
        'andi.wijaya@example.com',
        '081287654321',
        '$2a$12$qGcI.Co1Nit1oN9mgPRzIumvffyCicmvhI4UxmJEMXzDzeobV7z36',  -- Member123!
        'ACTIVE',
        NOW(),
        NOW()
    );

-- ============================================================
-- 3. POINT BALANCES (initialize for test members)
-- ============================================================
INSERT INTO trx_point_balance (id, member_id, partner_id, balance, version, updated_at)
VALUES
    -- Budi: 500 KFC, 300 McD
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
    -- Siti: 1200 KFC, 50 McD
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
    -- Andi: 0 KFC, 0 McD (new member)
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
-- 4. SAMPLE TRANSACTIONS (for history demo)
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
-- 5. AUDIT TRAIL (for demonstration)
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
