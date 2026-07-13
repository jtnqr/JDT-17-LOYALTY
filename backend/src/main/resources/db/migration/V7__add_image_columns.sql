-- V7: Add image_url to mst_reward and logo_url to mst_partner
-- Author: JDT-17
-- Date: 2026-07-13

ALTER TABLE mst_reward ADD COLUMN image_url VARCHAR(500);
ALTER TABLE mst_partner ADD COLUMN logo_url VARCHAR(500);
