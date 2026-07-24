-- V9: Add indexes on foreign key columns for query performance
-- These columns are frequently used in WHERE, JOIN, and ORDER BY clauses

-- TRX_TRANSACTION indexes
CREATE INDEX IF NOT EXISTS idx_trx_transaction_member_id ON TRX_TRANSACTION(member_id);
CREATE INDEX IF NOT EXISTS idx_trx_transaction_partner_id ON TRX_TRANSACTION(partner_id);
CREATE INDEX IF NOT EXISTS idx_trx_transaction_type ON TRX_TRANSACTION(type);
CREATE INDEX IF NOT EXISTS idx_trx_transaction_created_at ON TRX_TRANSACTION(created_at);

-- TRX_POINT_BALANCE indexes
CREATE INDEX IF NOT EXISTS idx_trx_point_balance_member_id ON TRX_POINT_BALANCE(member_id);
CREATE INDEX IF NOT EXISTS idx_trx_point_balance_partner_id ON TRX_POINT_BALANCE(partner_id);

-- TRX_AUDIT_TRAIL indexes
CREATE INDEX IF NOT EXISTS idx_trx_audit_trail_entity_type ON TRX_AUDIT_TRAIL(entity_type);
CREATE INDEX IF NOT EXISTS idx_trx_audit_trail_entity_id ON TRX_AUDIT_TRAIL(entity_id);
CREATE INDEX IF NOT EXISTS idx_trx_audit_trail_created_at ON TRX_AUDIT_TRAIL(created_at);

-- MST_REWARD indexes
CREATE INDEX IF NOT EXISTS idx_mst_reward_partner_id ON MST_REWARD(partner_id);
CREATE INDEX IF NOT EXISTS idx_mst_reward_status ON MST_REWARD(status);

-- MST_EXCHANGE_RATE indexes
CREATE INDEX IF NOT EXISTS idx_mst_exchange_rate_from_partner ON MST_EXCHANGE_RATE(from_partner_id);
CREATE INDEX IF NOT EXISTS idx_mst_exchange_rate_to_partner ON MST_EXCHANGE_RATE(to_partner_id);
CREATE INDEX IF NOT EXISTS idx_mst_exchange_rate_effective_from ON MST_EXCHANGE_RATE(effective_from);

-- MST_MEMBER indexes
CREATE INDEX IF NOT EXISTS idx_mst_member_status ON MST_MEMBER(status);
CREATE INDEX IF NOT EXISTS idx_mst_member_created_at ON MST_MEMBER(created_at);
