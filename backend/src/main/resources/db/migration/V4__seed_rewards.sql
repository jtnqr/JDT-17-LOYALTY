-- V4: Seed rewards (5 KFC + 6 McDonald's)
-- Author: JDT-17
-- Date: 2026-07-07
-- TSD v1.1 compliant

-- KFC Rewards
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

-- McDonald's Rewards
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
        'McNuggets 6pcs',
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
