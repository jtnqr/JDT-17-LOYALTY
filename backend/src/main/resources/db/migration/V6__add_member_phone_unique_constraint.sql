-- V6: Add UNIQUE constraint on phone column in mst_member
-- Author: JDT-17
-- Date: 2026-07-09

ALTER TABLE mst_member
ADD CONSTRAINT uq_member_phone UNIQUE (phone);
