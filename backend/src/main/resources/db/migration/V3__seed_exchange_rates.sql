-- V3: Seed exchange rates (KFC ↔ McDonald's, bidirectional)
-- Author: JDT-17
-- Date: 2026-07-07
-- TSD v1.1 compliant
-- Rates: KFC→McD = 0.8, McD→KFC = 0.9

INSERT INTO mst_exchange_rate (id, from_partner_id, to_partner_id, rate, effective_from, updated_at)
VALUES
    (
        '770e8400-e29b-41d4-a716-446655440001',
        '660e8400-e29b-41d4-a716-446655440001',  -- KFC
        '660e8400-e29b-41d4-a716-446655440002',  -- McDonald's
        0.8000,
        '2026-01-01 00:00:00+00',
        NOW()
    ),
    (
        '770e8400-e29b-41d4-a716-446655440002',
        '660e8400-e29b-41d4-a716-446655440002',  -- McDonald's
        '660e8400-e29b-41d4-a716-446655440001',  -- KFC
        0.9000,
        '2026-01-01 00:00:00+00',
        NOW()
    );
