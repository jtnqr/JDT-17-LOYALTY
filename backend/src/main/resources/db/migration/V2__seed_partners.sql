-- V2: Seed partners (KFC, McDonald's)
-- Author: JDT-17
-- Date: 2026-07-07
-- TSD v1.1 compliant

INSERT INTO mst_partner (id, name, code, points_per_thousand_idr, expiry_days, api_key, status, created_at, updated_at)
VALUES
    (
        '660e8400-e29b-41d4-a716-446655440001',
        'KFC Indonesia',
        'KFC',
        1,
        365,
        '2e4dacfd25f1a535ccc120c6a0cc00f6be0761f1eeb4befa475b0c10d3ee9e1c',  -- SHA-256 of kfc_api_key_2026_secure_demo_only
        'ACTIVE',
        NOW(),
        NOW()
    ),
    (
        '660e8400-e29b-41d4-a716-446655440002',
        'McDonald''s Indonesia',
        'MCD',
        1,
        365,
        '71d07834a59c7820e4f09c661c3cfebbb6ab14598f199261d55e3e42c43a6938',  -- SHA-256 of mcd_api_key_2026_secure_demo_only
        'ACTIVE',
        NOW(),
        NOW()
    );
