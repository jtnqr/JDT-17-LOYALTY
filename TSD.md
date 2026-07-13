# Technical Specification Document (TSD)
# PISTOS – Loyalty App

**Author:** Julius (JDT-17 Apprentice)
**Version:** 1.2
**Last Update:** 08/Jul/2026
**Project:** PISTOS (Points Integration System for Transaction-Originated Services)

---

## Version History

| Version | Date | By | Change Summary |
|---------|------|----|----------------|
| 1.0 | 03/Jul/2026 | Julius | Initial document |
| 1.1 | 07/Jul/2026 | Julius | Corrected login request schema; fixed McD→KFC rate to 0.9; moved Point Exchange to member-scoped POST /api/v1/exchange; corrected metadata |
| 1.2 | 08/Jul/2026 | Julius | memberId resolved from JWT in /redeem; phone UNIQUE + V6 migration; register response aligned to login shape; audit trail documented as DB-only; exchange-rate REST endpoints; reward catalog scope note; CORS config; PUT /partners/{id} explicit fields; Actuator note |

---

## Executive Summary

PISTOS is a multi-partner loyalty platform for the Indivara Java Developer Apprenticeship (Batch 17). Two pilot partners: KFC and McDonald's.

**System delivers:**
- Unified Member Management — single profile, partner-scoped balances
- Point Accumulation — 1 point per IDR 1,000 (configurable per partner)
- Point Exchange — KFC→McD: 0.8, McD→KFC: 0.9
- Point Redemption — 11 rewards total
- Point Expiry — automated, 365 days (configurable per partner)
- Audit Trail — append-only, tamper-evident
- JWT Authentication — MEMBER, ADMIN, PARTNER roles (HS512)

**Stack:**
- Backend: Spring Boot 4.1.0, Java 21
- Database: PostgreSQL 18 (Flyway migrations)
- Frontend: Next.js 16 (React 19, App Router)
- Deployment: Docker Compose

**Access points (local):**
- Member/Admin UI: http://localhost:3000
- Backend API: http://localhost:8080/api/v1
- Swagger UI: http://localhost:8080/swagger-ui.html
- Database: postgresql://localhost:5432/jdt17_loyalty

---

## Technology Stack

| No. | Component | Details |
|-----|-----------|---------|
| 1 | Operating System | Linux (Docker containers) |
| 2 | Programming Language | Java 21 LTS, TypeScript 5 |
| 3 | Backend Framework | Spring Boot 4.1.0 (Spring Framework 7) |
| 4 | ORM | Spring Data JPA + Hibernate |
| 5 | Database | PostgreSQL 18 |
| 6 | Migration Tool | Flyway |
| 7 | Authentication | JWT via Spring Security (HS512) |
| 8 | API Documentation | SpringDoc OpenAPI 3 (Swagger UI) |
| 9 | Frontend Framework | Next.js 16 (React 19, App Router) |
| 10 | UI Components | shadcn/ui + Tailwind CSS |
| 11 | State Management | React Query (TanStack) |
| 12 | Build Tool (Backend) | Maven 3.9+ |
| 13 | Testing | JUnit 5 + Mockito (backend), Vitest (frontend) |
| 14 | Containerization | Docker 24+ + Docker Compose v2 |
| 15 | Version Control | Git |

---

## Logical Architecture

**Three-tier:**

**Presentation (Frontend — Next.js 16)**
- Member Web App: Home, Rewards Catalog, Exchange, Redeem, Transaction History, Profile
- Admin CMS: Member Management, Partner Management

**Application (Backend — Spring Boot 4.1.0)**
- Controllers: AuthController, MemberController, PartnerController, TransactionController, ExchangeController, RedemptionController
- Services: PointService, MemberService, PartnerService, RedemptionService, AuditTrailService
- Repositories: Spring Data JPA (auto-generated + custom queries)

**Data (PostgreSQL 18)**
- 5 master tables (MST_*), 3 transaction tables (TRX_*)
- Flyway migrations for schema versioning
- JSONB for audit trail payloads

---

## Package Structure (Backend)

```
com.jdt17.loyalty/
├── config/           # Spring config, security, virtual threads
├── controller/       # REST controllers
├── service/          # Business logic (TDD)
├── repository/       # Spring Data JPA repositories
├── entity/           # JPA entities
├── dto/              # Request/Response DTOs
├── exception/        # Custom exceptions + GlobalExceptionHandler
├── security/         # JWT filter, UserDetailsService
├── scheduler/        # Point expiry cron job
└── audit/            # AuditTrailService
```

---

## Entity Relation Diagram (Overview)

**Master Tables (MST_*):**
- MST_MEMBER — registered members
- MST_PARTNER — KFC, McDonald's config
- MST_REWARD — 11 reward catalog items
- MST_EXCHANGE_RATE — directional rates between partners
- MST_ADMIN — single CMS admin

**Transaction Tables (TRX_*):**
- TRX_POINT_BALANCE — current balance per (memberId, partnerId), `@Version` optimistic locking
- TRX_TRANSACTION — immutable log: EARN, REDEEM, EXCHANGE_IN, EXCHANGE_OUT, EXPIRED
- TRX_AUDIT_TRAIL — append-only compliance log

**Key design decisions:**
- Partner-scoped balances: one TRX_POINT_BALANCE per (memberId, partnerId)
- Optimistic locking: `version` on TRX_POINT_BALANCE; JPA auto-increments on update; second concurrent update throws OptimisticLockException
- UUID PKs on all tables
- All timestamps TIMESTAMPTZ (UTC)

---

## Tables Detail

### MST_MEMBER

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | 990e8400-e29b-41d4-a716-446655440001 |
| name | VARCHAR(255) | N | | Budi Santoso |
| email | VARCHAR(255) | N | UNIQUE | budi.santoso@example.com |
| phone | VARCHAR(20) | Y | UNIQUE | 081234567890 |
| password_hash | VARCHAR(255) | N | | $2a$10$... (bcrypt) |
| status | VARCHAR(20) | N | CHECK (ACTIVE, INACTIVE) | ACTIVE |
| created_by | UUID | Y | FK → MST_ADMIN.id | NULL |
| updated_by | UUID | Y | FK → MST_ADMIN.id | |
| created_at | TIMESTAMPTZ | N | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Indexes:**
- `idx_member_email ON (email)` — login lookup
- `idx_member_phone ON (phone)` — earn transaction member resolution

### MST_PARTNER

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | 660e8400-...001 |
| name | VARCHAR(255) | N | | KFC Indonesia |
| code | VARCHAR(10) | N | UNIQUE | KFC |
| points_per_thousand_idr | INT | N | DEFAULT 1, CHECK > 0 | 1 |
| expiry_days | INT | N | DEFAULT 365, CHECK > 0 | 365 |
| api_key | VARCHAR(255) | Y | | SHA-256 hash of raw key |
| status | VARCHAR(20) | N | CHECK (ACTIVE, INACTIVE) | ACTIVE |
| created_by | UUID | Y | FK → MST_ADMIN.id | |
| updated_by | UUID | Y | FK → MST_ADMIN.id | |
| created_at | TIMESTAMPTZ | N | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Seeded partners:**

| id | name | code | pointsPerThousandIDR | expiryDays |
|----|------|------|---------------------|------------|
| 660e8400-...001 | KFC Indonesia | KFC | 1 | 365 |
| 660e8400-...002 | McDonald's Indonesia | MCD | 1 | 365 |

### MST_ADMIN

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | 550e8400-e29b-41d4-a716-446655440001 |
| name | VARCHAR(255) | N | | Admin PISTOS |
| email | VARCHAR(255) | N | UNIQUE | admin@jdt17loyalty.com |
| password_hash | VARCHAR(255) | N | | $2a$10$... (bcrypt) |
| status | VARCHAR(20) | N | CHECK (ACTIVE, INACTIVE) | ACTIVE |
| created_at | TIMESTAMPTZ | N | DEFAULT now() | |

### TRX_POINT_BALANCE

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | |
| member_id | UUID | N | FK → MST_MEMBER.id ON DELETE CASCADE | |
| partner_id | UUID | N | FK → MST_PARTNER.id ON DELETE RESTRICT | |
| balance | BIGINT | N | DEFAULT 0, CHECK >= 0 | 500 |
| version | BIGINT | N | DEFAULT 0 | 3 |
| updated_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Constraints:** UNIQUE (member_id, partner_id)

**Optimistic locking:** if two concurrent transactions read version=N and both try UPDATE, the second throws OptimisticLockException.

**Seeded balances:**

| Member | Partner | Balance |
|--------|---------|---------|
| Budi Santoso | KFC | 500 |
| Budi Santoso | McDonald's | 300 |
| Siti Rahmawati | KFC | 1200 |
| Siti Rahmawati | McDonald's | 50 |
| Andi Wijaya | KFC | 0 |
| Andi Wijaya | McDonald's | 0 |

### TRX_TRANSACTION

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | |
| member_id | UUID | N | FK → MST_MEMBER.id | |
| partner_id | UUID | N | FK → MST_PARTNER.id | |
| type | VARCHAR(20) | N | CHECK (EARN, REDEEM, EXCHANGE_IN, EXCHANGE_OUT, EXPIRED) | EARN |
| points | BIGINT | N | CHECK > 0 | 500 |
| trx_amount_idr | BIGINT | Y | | 500000 |
| related_tx_id | UUID | Y | FK → TRX_TRANSACTION.id | |
| reward_id | UUID | Y | FK → MST_REWARD.id | |
| expires_at | TIMESTAMPTZ | Y | | 2027-07-03T10:00:00Z |
| created_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Type rules:**

| Type | trx_amount_idr | expires_at | reward_id | related_tx_id |
|------|----------------|------------|-----------|---------------|
| EARN | Required | Required | NULL | NULL |
| REDEEM | NULL | NULL | Required | NULL |
| EXCHANGE_OUT | NULL | NULL | NULL | Required (→ EXCHANGE_IN) |
| EXCHANGE_IN | NULL | NULL | NULL | Required (→ EXCHANGE_OUT) |
| EXPIRED | NULL | NULL | NULL | Optional (→ original EARN) |

**Indexes:**
- `idx_transaction_member_date ON (member_id, created_at DESC)`
- `idx_transaction_expiry ON (expires_at) WHERE type = 'EARN'`

### MST_EXCHANGE_RATE

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | |
| from_partner_id | UUID | N | FK → MST_PARTNER.id | KFC |
| to_partner_id | UUID | N | FK → MST_PARTNER.id | MCD |
| rate | DECIMAL(10,4) | N | CHECK > 0, from ≠ to | 0.8000 |
| effective_from | TIMESTAMPTZ | N | DEFAULT now() | 2026-01-01T00:00:00Z |
| created_by | UUID | Y | FK → MST_ADMIN.id | |
| updated_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Constraints:** UNIQUE (from_partner_id, to_partner_id, effective_from)

**Active rate selection:** `WHERE effective_from <= now() ORDER BY effective_from DESC LIMIT 1`

**Seeded rates:**

| From | To | Rate | Meaning |
|------|----|------|---------|
| KFC | McDonald's | 0.8000 | 100 KFC pts → 80 McD pts |
| McDonald's | KFC | 0.9000 | 100 McD pts → 90 KFC pts |

### MST_REWARD

| Column | Data Type | Nullable | Constraint | Sample |
|--------|-----------|----------|------------|--------|
| id | UUID | N | PK | |
| partner_id | UUID | N | FK → MST_PARTNER.id | |
| name | VARCHAR(255) | N | | KFC Original Recipe Chicken 1pc |
| point_cost | INT | N | CHECK > 0 | 250 |
| status | VARCHAR(20) | N | CHECK (ACTIVE, INACTIVE) | ACTIVE |
| created_at | TIMESTAMPTZ | N | DEFAULT now() | |
| updated_at | TIMESTAMPTZ | N | DEFAULT now() | |

**Seeded KFC rewards:**

| Name | Point Cost |
|------|------------|
| KFC Original Recipe Chicken 1pc | 250 |
| KFC French Fries Regular | 150 |
| KFC Zinger Burger | 400 |
| KFC Family Bucket (9pc) | 1200 |
| KFC Pepsi Regular | 100 |

**Seeded McDonald's rewards:**

| Name | Point Cost |
|------|------------|
| Big Mac Burger | 350 |
| McNuggets 6pcs | 200 |
| McFlurry Oreo | 250 |
| French Fries Large | 150 |
| McCafe Latte | 180 |
| McValue Meal (Burger + Fries + Drink) | 500 |

### TRX_AUDIT_TRAIL

```sql
CREATE TABLE trx_audit_trail (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(50)  NOT NULL,   -- POINTS_EARNED, MEMBER_REGISTERED, etc.
    actor_id    UUID,                     -- memberId, adminId, or null (SYSTEM)
    actor_type  VARCHAR(20)  NOT NULL,   -- MEMBER | SYSTEM | ADMIN | PARTNER
    entity_type VARCHAR(50)  NOT NULL,   -- MEMBER | PARTNER | TRANSACTION | EXCHANGE
    entity_id   UUID         NOT NULL,   -- PK of the affected row
    payload     JSONB,                   -- before/after snapshot
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor   ON trx_audit_trail(actor_id);
CREATE INDEX idx_audit_entity  ON trx_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_created ON trx_audit_trail(created_at DESC);
```

---

## Flyway Migration Files

| Migration File | Purpose |
|----------------|---------|
| V1__create_schema.sql | Create all tables (MST_* and TRX_*) |
| V2__seed_partners.sql | Insert KFC and McDonald's with pointsPerThousandIDR = 1 |
| V3__seed_exchange_rates.sql | Insert KFC→McD (0.8) and McD→KFC (0.9) |
| V4__seed_rewards.sql | Insert 11 rewards (5 KFC + 6 McDonald's) |
| V5__seed_demo_members.sql | Insert 1 admin + 3 demo members + initial balances |
| V6__add_phone_unique_constraint.sql | Add UNIQUE constraint to mst_member.phone |

---

## API Specification

### Authentication

#### POST /api/v1/auth/register
Access: Public

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "phone": "081234567890",
  "password": "Member123!"
}
```

**Success (201):**
```json
{
  "token": "eyJhbG...",
  "role": "MEMBER",
  "user": {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "name": "Budi Santoso",
    "email": "budi.santoso@example.com",
    "phone": "081234567890",
    "status": "ACTIVE",
    "createdAt": "2026-07-03T10:00:00Z"
  }
}
```

**Error (400):**
```json
{ "status": 400, "error": "BAD_REQUEST", "message": "Email already registered", "code": "DUPLICATE_EMAIL" }
```
```json
{ "status": 400, "error": "BAD_REQUEST", "message": "Phone number already registered", "code": "DUPLICATE_PHONE" }
```

**Backend Logic:**
1. Validate payload; verify email uniqueness (DUPLICATE_EMAIL 400) and phone uniqueness (DUPLICATE_PHONE 400)
2. BCrypt hash password (cost factor 10)
3. Insert into MST_MEMBER (status = ACTIVE)
4. Bulk-seed TRX_POINT_BALANCE for all active partners (balance = 0)
5. Write MEMBER_REGISTERED to TRX_AUDIT_TRAIL (actorType = SYSTEM)
6. Issue JWT: `{ sub: memberId, role: MEMBER, exp: now+24h }`
7. Return 201 with token + role + user

---

#### POST /api/v1/auth/login
Access: Public

**Request:**
```json
{
  "email": "budi@example.com",
  "password": "securePassword123"
}
```

**Success (200):**
```json
{
  "token": "eyJhbG...",
  "role": "MEMBER",
  "user": {
    "id": "990e8400-e29b-41d4-a716-446655440001",
    "name": "Budi Santoso",
    "email": "budi.santoso@example.com",
    "status": "ACTIVE"
  }
}
```

**Error (401):**
```json
{ "status": 401, "error": "UNAUTHORIZED", "message": "Invalid email or password", "code": "INVALID_CREDENTIALS" }
```

**Backend Logic:**
1. Query email against **both** MST_MEMBER and MST_ADMIN tables
2. Validate BCrypt password
3. Determine role from matching table (MEMBER or ADMIN)
4. Issue JWT with resolved role claim
5. Return token + role (frontend routes accordingly)

---

#### POST /api/v1/auth/partner/token
Access: Public

**Request:**
```json
{
  "partnerId": "660e8400-e29b-41d4-a716-446655440001",
  "apiKey": "kfc_api_key_2026_secure_demo_only"
}
```

**Success (200):**
```json
{ "token": "eyJhbG...", "expiresIn": 3600 }
```

**Error (401):**
```json
{ "status": 401, "error": "UNAUTHORIZED", "message": "Invalid partner credentials", "code": "INVALID_CREDENTIALS" }
```

**Backend Logic:**
1. Query MST_PARTNER by partnerId
2. Validate SHA-256(apiKey) matches stored hash
3. Issue JWT: `{ sub: partnerId, role: PARTNER, exp: now+1h }`

---

### Member Management

#### GET /api/v1/members
Access: ADMIN only

**Query Parameters:**

| Param | Type | Required | Description |
|-------|------|----------|-------------|
| page | int | No | Default 0 |
| size | int | No | Default 20 |
| status | string | No | ACTIVE or INACTIVE |

**Success (200):**
```json
{
  "data": [
    {
      "id": "990e8400-e29b-41d4-a716-446655440001",
      "name": "Budi Santoso",
      "email": "budi.santoso@example.com",
      "phone": "081234567890",
      "status": "ACTIVE",
      "createdAt": "2026-07-03T10:00:00Z"
    }
  ],
  "page": 0,
  "size": 20,
  "total": 1
}
```

---

#### GET /api/v1/members/{id}
Access: MEMBER (own only) or ADMIN (any)
Privacy: Point balances NOT included in response.

**Success (200):**
```json
{
  "id": "990e8400-e29b-41d4-a716-446655440001",
  "name": "Budi Santoso",
  "email": "budi.santoso@example.com",
  "phone": "081234567890",
  "status": "ACTIVE",
  "createdAt": "2026-07-03T10:00:00Z"
}
```

---

#### PUT /api/v1/members/{id}
Access: ADMIN only
Note: Single endpoint for profile update AND status change. No separate PUT /status endpoint.

**Request:**
```json
{ "name": "Budi S.", "phone": "089876543210", "status": "INACTIVE" }
```

**Success (200):** Updated member object

**Backend Logic:**
1. Verify ADMIN JWT
2. Query member by id (404 if not found)
3. Apply field updates
4. Write MEMBER_UPDATED to audit trail; if status changed, also write MEMBER_STATUS_CHANGED
5. Return updated member

---

#### GET /api/v1/members/{id}/points
Access: MEMBER (own only) — **ADMIN explicitly forbidden (403)**

**Success (200):**
```json
{
  "memberId": "990e8400-e29b-41d4-a716-446655440001",
  "memberName": "Budi Santoso",
  "balances": [
    { "partnerId": "660e8400-...001", "partnerName": "KFC Indonesia", "balance": 500 },
    { "partnerId": "660e8400-...002", "partnerName": "McDonald's Indonesia", "balance": 300 }
  ]
}
```

---

#### GET /api/v1/members/{id}/transactions
Access: MEMBER (own only) — **ADMIN explicitly forbidden (403)**

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| page | int | Default 0 |
| size | int | Default 20 |
| type | string | EARN, REDEEM, EXCHANGE_IN, EXCHANGE_OUT, EXPIRED |

**Success (200):**
```json
{
  "memberId": "990e8400-e29b-41d4-a716-446655440001",
  "page": 0,
  "size": 10,
  "total": 4,
  "transactions": [
    {
      "id": "bb0e8400-e29b-41d4-a716-446655440001",
      "type": "EARN",
      "partnerId": "660e8400-...001",
      "partnerName": "KFC Indonesia",
      "points": 500,
      "trxAmountIDR": 500000,
      "expiresAt": "2027-07-01T08:00:00Z",
      "createdAt": "2026-07-01T08:00:00Z"
    }
  ]
}
```

---

### Partner Management

#### GET /api/v1/partners
Access: ADMIN or MEMBER

**Success (200):**
```json
{
  "data": [
    { "id": "660e8400-...001", "name": "KFC Indonesia", "code": "KFC", "pointsPerThousandIDR": 1, "expiryDays": 365, "status": "ACTIVE" },
    { "id": "660e8400-...002", "name": "McDonald's Indonesia", "code": "MCD", "pointsPerThousandIDR": 1, "expiryDays": 365, "status": "ACTIVE" }
  ]
}
```

---

#### POST /api/v1/partners
Access: ADMIN only

**Request:**
```json
{ "name": "Starbucks Indonesia", "code": "SBUX", "pointsPerThousandIDR": 2, "expiryDays": 180 }
```

**Success (201):** Created partner object

**Backend Logic:**
1. Verify ADMIN JWT
2. Check partner code uniqueness (DUPLICATE_PARTNER_CODE if exists)
3. Insert into MST_PARTNER
4. Bulk-init TRX_POINT_BALANCE for all active members via native SQL:
   ```sql
   INSERT INTO trx_point_balance (id, member_id, partner_id, balance, version, updated_at)
   SELECT gen_random_uuid(), m.id, :partnerId, 0, 0, now()
   FROM mst_member m WHERE m.status = 'ACTIVE'
   ```
5. Write PARTNER_CREATED to audit trail
6. Return 201

---

#### PUT /api/v1/partners/{id}
Access: ADMIN only

Note: Partner code immutable after creation.

**Request:**
```json
{ "name": "KFC Indonesia Updated", "pointsPerThousandIDR": 2, "expiryDays": 180, "status": "ACTIVE" }
```

Updatable fields: `name`, `pointsPerThousandIDR`, `expiryDays`, `status`. All fields optional; omitted fields unchanged.

**Success (200):**
```json
{
  "id": "660e8400-...001",
  "name": "KFC Indonesia Updated",
  "code": "KFC",
  "pointsPerThousandIDR": 2,
  "expiryDays": 180,
  "status": "ACTIVE"
}
```

**Backend Logic:**
1. Verify ADMIN JWT
2. Query partner by id (404 PARTNER_NOT_FOUND if missing)
3. Apply provided field updates; skip code field (immutable)
4. Write PARTNER_UPDATED to audit trail
5. Return updated partner object

---

### Point Transaction

#### POST /api/v1/transactions
Access: **PARTNER JWT required**

**Request:**
```json
{ "memberIdentifier": "081234567890", "partner": "KFC", "trxAmount": 150000 }
```

**Success (201):**
```json
{
  "transactionId": "bb0e8400-...",
  "memberId": "990e8400-...",
  "partner": "KFC",
  "trxAmountIDR": 150000,
  "pointsEarned": 150,
  "newBalance": 650,
  "expiresAt": "2027-07-03T10:00:00Z",
  "createdAt": "2026-07-03T10:00:00Z"
}
```

**Calculation:**
```
pointsEarned = floor(trxAmountIDR / 1000) × pointsPerThousandIDR
expiresAt    = now() + partner.expiryDays
```

Example: IDR 150,000 × 1 pt/1000 IDR = 150 pts

**Errors:**
- 404 MEMBER_NOT_FOUND — memberIdentifier matches no member
- 404 PARTNER_NOT_FOUND — partner code not found
- 400 MEMBER_INACTIVE — member is disabled

---

### Exchange

#### POST /api/v1/exchange
Access: MEMBER only (memberId resolved from JWT sub)

**Request:**
```json
{ "fromPartnerId": "660e8400-...001", "toPartnerId": "660e8400-...002", "points": 100 }
```

**Success (200):**
```json
{
  "memberId": "990e8400-...",
  "fromPartner": "KFC Indonesia",
  "toPartner": "McDonald's Indonesia",
  "pointsDeducted": 100,
  "pointsCredited": 80,
  "exchangeRate": 0.8,
  "updatedBalances": { "KFC": 400, "MCD": 380 },
  "outTransactionId": "tx-out-uuid",
  "inTransactionId": "tx-in-uuid",
  "exchangedAt": "2026-07-03T10:00:00Z"
}
```

**Calculation:**
```
pointsCredited = floor(points × exchangeRate)
```

Example: 100 KFC pts × 0.8 = 80 McD pts

**Errors:**
- 404 EXCHANGE_RATE_NOT_CONFIGURED
- 404 PARTNER_NOT_FOUND
- 422 INSUFFICIENT_BALANCE

---

### Exchange Rate Management

#### GET /api/v1/exchange-rates
Access: ADMIN or MEMBER

Returns the currently active rate for every from/to partner pair. Active rate selection: `WHERE effective_from <= now() ORDER BY effective_from DESC LIMIT 1`, per pair.

**Success (200):**
```json
{
  "data": [
    {
      "fromPartnerId": "660e8400-...001",
      "fromPartner": "KFC Indonesia",
      "toPartnerId": "660e8400-...002",
      "toPartner": "McDonald's Indonesia",
      "rate": 0.8,
      "effectiveFrom": "2026-01-01T00:00:00Z"
    }
  ]
}
```

---

#### POST /api/v1/exchange-rates
Access: ADMIN only

**Request:**
```json
{
  "fromPartnerId": "660e8400-...001",
  "toPartnerId": "660e8400-...002",
  "rate": 0.85,
  "effectiveFrom": "2026-08-01T00:00:00Z"
}
```

`effectiveFrom` is optional; defaults to `now()`.

**Success (201):**
```json
{
  "id": "uuid",
  "fromPartnerId": "660e8400-...001",
  "fromPartner": "KFC Indonesia",
  "toPartnerId": "660e8400-...002",
  "toPartner": "McDonald's Indonesia",
  "rate": 0.85,
  "effectiveFrom": "2026-08-01T00:00:00Z",
  "createdAt": "2026-07-08T10:00:00Z"
}
```

**Backend Logic:**
1. Verify ADMIN JWT
2. Validate `fromPartnerId != toPartnerId` (400 INVALID_EXCHANGE_RATE_PAIR)
3. Validate both partners exist (404 PARTNER_NOT_FOUND) and `rate > 0`
4. Insert a new row — existing rows are never updated in place; follows the versioning pattern implied by `effective_from` and the `UNIQUE(from_partner_id, to_partner_id, effective_from)` constraint
5. Set `created_by` from the ADMIN JWT `sub`
6. Write EXCHANGE_RATE_CREATED to audit trail (payload: fromPartnerId, toPartnerId, rate, previousRate, effectiveFrom)
7. Return 201 with created rate object

**Errors:**
- 404 PARTNER_NOT_FOUND
- 400 INVALID_EXCHANGE_RATE_PAIR
- 409 DUPLICATE_EXCHANGE_RATE (same pair + same effectiveFrom already exists)

---

### Redemption

#### GET /api/v1/rewards
Access: Any authenticated user (MEMBER or ADMIN)

**Query Parameters:**

| Param | Type | Description |
|-------|------|-------------|
| partnerId | UUID | Optional — filter by partner |

**Success (200):**
```json
{
  "data": [
    {
      "id": "880e8400-...001",
      "partnerId": "660e8400-...001",
      "partnerName": "KFC Indonesia",
      "partnerCode": "KFC",
      "name": "KFC Original Recipe Chicken 1pc",
      "pointCost": 250,
      "status": "ACTIVE",
      "imageUrl": "/uploads/rewards/kfc_chicken.png"
    }
  ],
  "total": 11
}
```

---

#### POST /api/v1/redeem
Access: MEMBER only (memberId resolved from JWT sub)

**Request:**
```json
{ "rewardId": "880e8400-...001" }
```

**Success (200):**
```json
{
  "transactionId": "tx-uuid-redeem",
  "rewardName": "KFC Original Recipe Chicken 1pc",
  "partnerId": "660e8400-...001",
  "partnerName": "KFC Indonesia",
  "pointsDeducted": 250,
  "newBalance": 250,
  "redeemedAt": "2026-07-03T10:00:00Z"
}
```

**Error (422):**
```json
{ "status": 422, "error": "UNPROCESSABLE_ENTITY", "message": "Insufficient points. Required: 250, Available: 100", "code": "INSUFFICIENT_BALANCE" }
```

**Errors:**
- 404 REWARD_NOT_FOUND
- 404 REWARD_INACTIVE
- 422 INSUFFICIENT_BALANCE

**Backend Logic:**
1. Verify MEMBER JWT; resolve memberId from JWT `sub` claim
2. Load reward by rewardId (404 REWARD_NOT_FOUND, 404 REWARD_INACTIVE)
3. Load member's TRX_POINT_BALANCE for reward's partner (422 INSUFFICIENT_BALANCE if balance < pointCost)
4. Deduct points; insert TRX_TRANSACTION (type=REDEEM); write POINTS_REDEEMED to audit trail
5. Return 200 with redeem summary

---

### Reward Management (Admin)

#### POST /api/v1/rewards
Access: ADMIN only

**Request:**
```json
{
  "name": "KFC Bucket 9 Pcs",
  "pointCost": 900,
  "partnerId": "660e8400-e29b-41d4-a716-446655440001"
}
```

**Success (201):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440012",
  "name": "KFC Bucket 9 Pcs",
  "pointCost": 900,
  "status": "ACTIVE",
  "imageUrl": null,
  "partnerCode": "KFC"
}
```

**Errors:**
- 404 PARTNER_NOT_FOUND

---

#### PUT /api/v1/rewards/{id}
Access: ADMIN only

**Request:**
```json
{
  "name": "KFC Bucket 9 Pcs Special",
  "pointCost": 950,
  "status": "INACTIVE"
}
```

**Success (200):**
```json
{
  "id": "880e8400-e29b-41d4-a716-446655440012",
  "name": "KFC Bucket 9 Pcs Special",
  "pointCost": 950,
  "status": "INACTIVE",
  "imageUrl": null,
  "partnerCode": "KFC"
}
```

**Errors:**
- 404 REWARD_NOT_FOUND

---

#### PUT /api/v1/rewards/{id}/image
Access: ADMIN only
Content-Type: multipart/form-data

**Request:**
- `file`: MultipartFile (max 2MB, JPEG/PNG/WEBP only)

**Success (200):**
```json
{
  "imageUrl": "/uploads/rewards/e57bc080-d128-4bc2-9653-e8bb65715201.png"
}
```

**Errors:**
- 404 REWARD_NOT_FOUND
- 400 (Invalid file size / format)

---

#### PUT /api/v1/partners/{id}/logo
Access: ADMIN only
Content-Type: multipart/form-data

**Request:**
- `file`: MultipartFile (max 2MB, JPEG/PNG/WEBP only)

**Success (200):**
```json
{
  "logoUrl": "/uploads/partners/d58cb123-d345-42bc-8653-d8bb41235122.png"
}
```

**Errors:**
- 404 PARTNER_NOT_FOUND
- 400 (Invalid file size / format)

---

## Authorization Matrix

| Endpoint | Public | MEMBER | ADMIN | PARTNER |
|----------|--------|--------|-------|---------|
| POST /auth/register | ✓ | — | — | — |
| POST /auth/login | ✓ | — | — | — |
| POST /auth/partner/token | ✓ | — | — | — |
| POST /transactions | — | — | — | ✓ |
| GET /members | — | — | ✓ | — |
| GET /members/{id} | — | ✓ (own) | ✓ (any) | — |
| PUT /members/{id} | — | — | ✓ | — |
| GET /members/{id}/points | — | ✓ (own) | — (403) | — |
| GET /members/{id}/transactions | — | ✓ (own) | — (403) | — |
| POST /exchange | — | ✓ | — | — |
| POST /redeem | — | ✓ | — | — |
| GET /rewards | — | ✓ | ✓ | — |
| GET /partners | — | ✓ | ✓ | — |
| POST /partners | — | — | ✓ | — |
| PUT /partners/{id} | — | — | ✓ | — |
| PUT /partners/{id}/logo | — | — | ✓ | — |
| POST /rewards | — | — | ✓ | — |
| PUT /rewards/{id} | — | — | ✓ | — |
| PUT /rewards/{id}/image | — | — | ✓ | — |
| GET /exchange-rates | — | ✓ | ✓ | — |
| POST /exchange-rates | — | — | ✓ | — |

Legend: ✓ = allowed, — = forbidden (403 if JWT valid, 401 if no JWT)

---

## Security

### JWT Configuration

```
Algorithm: HS512 (HMAC-SHA512)
Secret: 128-character hex string (openssl rand -hex 64)
Member/Admin expiry: 24 hours
Partner expiry: 1 hour
```

**JWT Payload:**
```json
{
  "sub": "990e8400-e29b-41d4-a716-446655440001",
  "role": "MEMBER",
  "iat": 1751500800,
  "exp": 1751587200
}
```

### Password Encryption

- Algorithm: BCrypt (BCryptPasswordEncoder, cost factor 10)
- ~100ms per hash on modern hardware
- Each hash includes random salt
- Seed data uses placeholder hash; regenerate before production

### Security Controls

| No. | Component | Control | Implementation |
|-----|-----------|---------|----------------|
| 1 | API | RBAC | JWT role claim per endpoint |
| 2 | API | Financial data privacy | Admin blocked from points/transactions endpoints |
| 3 | API | Auth required | All non-public endpoints require valid JWT |
| 4 | DB | No raw SQL in services | Spring Data JPA except bulk partner init |
| 5 | DB | Optimistic locking | @Version on TRX_POINT_BALANCE |
| 6 | Secrets | Env vars | .env file (chmod 600), no hardcoded values |
| 7 | Passwords | BCrypt | Cost factor 10 |
| 8 | Transactions | Atomic | @Transactional on service methods |
| 9 | Audit | Tamper-evident | TRX_AUDIT_TRAIL append-only; no UPDATE/DELETE |
| 10 | API keys | Hashed | Partner API keys stored as SHA-256 hash |

### CORS Configuration

Spring Security must allow the Next.js frontend origin for all API routes:

- Allowed origins: `http://localhost:3000`
- Allowed paths: `/api/v1/**`
- Allowed methods: `GET`, `POST`, `PUT`, `DELETE`
- Allowed headers: `Authorization`, `Content-Type`
- Allow credentials: `true`

Configure via `CorsConfigurationSource` bean in `SecurityConfig`. Do not rely on `@CrossOrigin` annotations on controllers.

---

## Audit Trail

### Events

| Event Type | Trigger | Actor Type |
|------------|---------|------------|
| MEMBER_REGISTERED | POST /auth/register | SYSTEM |
| MEMBER_UPDATED | PUT /members/{id} | ADMIN |
| MEMBER_STATUS_CHANGED | Status toggle via PUT /members/{id} | ADMIN |
| PARTNER_CREATED | POST /partners | ADMIN |
| POINTS_EARNED | POST /transactions | SYSTEM |
| POINT_EXPIRED | Expiry Cron Job | SYSTEM |
| POINTS_EXCHANGED | POST /exchange | MEMBER |
| POINTS_REDEEMED | POST /redeem | MEMBER |
| EXCHANGE_RATE_CREATED | POST /exchange-rates | ADMIN |

### Payload Examples

**POINTS_EARNED:**
```json
{
  "memberId": "990e8400...",
  "partnerId": "660e8400...",
  "trxAmountIDR": 150000,
  "pointsEarned": 150,
  "balanceBefore": 500,
  "balanceAfter": 650,
  "expiresAt": "2027-07-03T10:00:00Z"
}
```

**POINTS_EXCHANGED:**
```json
{
  "memberId": "990e8400...",
  "fromPartnerId": "660e8400-...-001",
  "toPartnerId": "660e8400-...-002",
  "pointsDeducted": 100,
  "pointsCredited": 80,
  "exchangeRate": 0.8,
  "fromBalanceBefore": 500, "fromBalanceAfter": 400,
  "toBalanceBefore": 300, "toBalanceAfter": 380
}
```

**POINTS_REDEEMED:**
```json
{
  "memberId": "990e8400...",
  "rewardId": "880e8400...",
  "rewardName": "KFC Original Recipe Chicken 1pc",
  "partnerId": "660e8400...",
  "pointsDeducted": 250,
  "balanceBefore": 500,
  "balanceAfter": 250
}
```

**POINT_EXPIRED:**
```json
{
  "memberId": "990e8400...",
  "partnerId": "660e8400...",
  "originalTxId": "bb0e8400...",
  "pointsExpired": 500,
  "balanceBefore": 500,
  "balanceAfter": 0
}
```

**EXCHANGE_RATE_CREATED:**
```json
{
  "fromPartnerId": "660e8400-...-001",
  "toPartnerId": "660e8400-...-002",
  "rate": 0.85,
  "previousRate": 0.8,
  "effectiveFrom": "2026-08-01T00:00:00Z"
}
```

### Implementation Notes

- Audit writes are **within the same `@Transactional`** — if business op rolls back, audit entry also rolls back (consistent state)
- No DB triggers — all in service layer for testability
- TRX_AUDIT_TRAIL is a write-only compliance log with no REST read API in this MVP; access is via direct DB query. This is a deliberate scope decision, not a gap.

---

## Scheduler

```java
@Component
@EnableScheduling
public class PointExpiryScheduler {

    @Scheduled(cron = "0 0 17 * * *")  // Daily 00:00 WIB = 17:00 UTC
    @Transactional
    public void expirePoints() {
        // 1. Query EARN transactions where expiresAt <= now()
        // 2. For each member: deduct points from TRX_POINT_BALANCE
        // 3. Insert TRX_TRANSACTION (type=EXPIRED)
        // 4. Insert TRX_AUDIT_TRAIL (POINT_EXPIRED)
        // Per-member try/catch — one failure does not block others
        // Idempotent — won't re-expire already-expired points
    }
}
```

---

## Configuration Reference

| Property | Default | Description |
|----------|---------|-------------|
| spring.datasource.url | jdbc:postgresql://db:5432/jdt17_loyalty | DB connection |
| spring.datasource.username | loyalty | DB username |
| spring.datasource.password | (env var) | DB password |
| spring.jpa.hibernate.ddl-auto | validate | Flyway manages schema |
| spring.threads.virtual.enabled | true | Java 21 virtual threads (Loom) |
| jwt.secret | (env var) | HS512 signing key |
| cors.allowed-origins | http://localhost:3000 | Allowed frontend origin(s) |

---

## Unit Testing Plan

**Philosophy:** Service layer only. No DB, no HTTP. Mock repos with Mockito.

| Class Under Test | Test Case |
|-----------------|-----------|
| PointService#earnPoints | Correct points from trxAmount: floor(trxAmount/1000) |
| PointService#earnPoints | Member resolved via phone or email |
| PointService#earnPoints | MemberNotFoundException when member not found |
| PointService#earnPoints | PartnerNotFoundException when partner not found |
| PointService#earnPoints | MemberInactiveException when INACTIVE |
| PointService#expirePoints | Expired points deducted; EXPIRED transaction logged |
| PartnerService#createPartner | Partner created; balances initialized for existing members |
| PointService#exchangePoints | Exchange succeeds; target = floor(sourcePoints × rate) |
| PointService#exchangePoints | InsufficientBalanceException when balance < requested |
| PointService#exchangePoints | ExchangeRateNotFoundException when rate not configured |
| MemberService#registerMember | Member created; point balances initialized to 0 for all active partners |
| AuditTrailService#log | Audit record written with correct event type, actor, entity |

**Run with:** `mvn test`

---

## Standard Error Response Format

```json
{ "status": 400, "error": "BAD_REQUEST", "message": "Insufficient point balance", "code": "INSUFFICIENT_BALANCE" }
```

### HTTP Status Codes

| Code | Meaning | When |
|------|---------|------|
| 200 | OK | Successful GET, PUT, POST |
| 201 | Created | Resource creation |
| 400 | Bad Request | Invalid input or business rule violation |
| 401 | Unauthorized | Missing or invalid JWT |
| 403 | Forbidden | Valid JWT, insufficient role or ownership |
| 404 | Not Found | Resource does not exist |
| 422 | Unprocessable Entity | Logically valid but fails business constraint |
| 500 | Internal Server Error | Unexpected server error |

### Application Error Codes

| Error Code | HTTP | Description |
|------------|------|-------------|
| MEMBER_NOT_FOUND | 404 | Member ID or identifier does not exist |
| MEMBER_INACTIVE | 400 | Member account status is INACTIVE |
| PARTNER_NOT_FOUND | 404 | Partner ID or code does not exist |
| PARTNER_INACTIVE | 400 | Partner status is INACTIVE |
| REWARD_NOT_FOUND | 404 | Reward ID does not exist |
| REWARD_INACTIVE | 404 | Reward exists but is not ACTIVE |
| INSUFFICIENT_BALANCE | 422 | Member does not have enough points |
| EXCHANGE_RATE_NOT_CONFIGURED | 404 | No exchange rate for given partner pair |
| INVALID_CREDENTIALS | 401 | Wrong email/password or invalid API key |
| UNAUTHORIZED | 401 | Missing or invalid JWT token |
| FORBIDDEN | 403 | JWT valid but role insufficient |
| DUPLICATE_EMAIL | 400 | Email address already registered |
| DUPLICATE_PHONE | 400 | Phone number already registered |
| DUPLICATE_PARTNER_CODE | 400 | Partner code already exists |
| INVALID_EXCHANGE_RATE_PAIR | 400 | fromPartnerId equals toPartnerId |
| DUPLICATE_EXCHANGE_RATE | 409 | Exchange rate for same pair + effectiveFrom already exists |

---

## Known Limitations

| # | Limitation | Risk | Planned Mitigation |
|---|------------|------|-------------------|
| L-1 | No rate limiting on auth endpoints | Brute-force susceptible | Add Bucket4j; per-IP lockout after N failures |
| L-2 | No idempotency key on POST /transactions | Partner retries cause duplicate awards | Require partner-supplied idempotencyKey; unique DB constraint |
| L-3 | JWTs not revocable before expiry | Deactivated member can use token up to 24h | Short-lived access + refresh token; or Redis denylist |
| L-4 | Single JWT signing secret for all roles | Secret compromise forges any role token | Separate keys per role or distinct `aud` claim per endpoint |
| L-5 | Expiry scheduler: single backend instance | Horizontal scale causes double-expiry | ShedLock distributed lock |
| L-6 | No password complexity policy | Weak passwords | Enforce minimum length + character variety at DTO validation |
| L-7 | DUPLICATE_EMAIL error enables account enumeration | Attacker confirms registered emails | Generic error messaging |
| L-8 | No reward stock limits (MVP by design) | Unlimited redemptions | Add stock tracking in future release |
| L-9 | Partner api_key stored as SHA-256 hash | Plaintext DB exposure enables impersonation | Already hashed; add rotation endpoint post-MVP |
| L-10 | No REST endpoints to manage MST_REWARD | Reward catalog (add/edit/deactivate) is migration-only in this MVP | Add admin CRUD endpoints post-MVP if catalog needs to change without a deploy |
| L-11 | Spring Boot Actuator health endpoint not yet exposed | No /actuator/health for liveness/readiness probes | Optional, low priority; enable Actuator and expose only health endpoint when needed |

---

## Sizing Estimates

| Assumption | Value |
|------------|-------|
| Initial pilot members | ~500 (demo: 3) |
| Partners in MVP | 2 (KFC, McDonald's) |
| Peak transactions/day | ~1,000 earn transactions |
| Transaction history retained | 2 years |
| Concurrent API requests (peak) | ~50 |
| Average response time target | < 500ms |
| Total reward catalog | 11 |
| JWT expiry: member | 24 hours |
| JWT expiry: partner | 1 hour |

| Table | Expected Rows | Estimated Size |
|-------|--------------|----------------|
| MST_MEMBER | 500 | 0.25 MB |
| MST_PARTNER | 2 | < 1 KB |
| MST_REWARD | 11 | < 1 KB |
| MST_EXCHANGE_RATE | 2 | < 1 KB |
| TRX_POINT_BALANCE | 1,000 | 0.13 MB |
| TRX_TRANSACTION | 730,000 | 186 MB |
| TRX_AUDIT_TRAIL | 730,000 | 373 MB |
| **Total DB (2 years)** | | **~600 MB** |

---

## Appendix

### Glossary

| Term | Definition |
|------|------------|
| Points | Loyalty currency; stored as BIGINT (no fractions) |
| Partner | Third-party merchant (KFC, McDonald's) whose transactions generate points |
| Member | Registered loyalty participant with single platform identity |
| Exchange | Conversion of points from one partner's balance to another |
| Redemption | Using accumulated points to claim a reward |
| Audit Trail | Tamper-evident, append-only log of every significant action |
| Optimistic Locking | Concurrency control via version field; detects conflicts at write time |
| EARN | Points credited from purchase |
| REDEEM | Points deducted for reward claim |
| EXCHANGE_OUT | Points deducted from source in an exchange |
| EXCHANGE_IN | Points credited to destination in an exchange |
| EXPIRED | Points deducted by system when earn passes expiry date |
| CMS | Content Management System — admin interface |
| JWT | JSON Web Token — stateless auth for all actors |
| IDR | Indonesian Rupiah — transaction currency for point calculation |
| BCrypt | Password hashing algorithm |
| Flyway | Database migration tool |
| PISTOS | Points Integration System for Transaction-Originated Services |

### Appendix Files

| No. | File | Description |
|-----|------|-------------|
| 1 | docs/seed-data.sql | Demo seed: 1 admin, 2 partners, 11 rewards, 3 members, transactions, audit entries |
| 2 | erd.md | Entity Relationship Diagram |
| 3 | FSD.md | Functional Specification Document |
| 4 | TSD.md | This document |
| 5 | .env.example | Environment variables template |
| 6 | docker-compose.yml | Docker Compose stack |
| 7 | AGENTS.md | AI agent development guidelines |

### Swagger

Auto-generated by SpringDoc OpenAPI 3:
- Swagger UI: http://localhost:8080/swagger-ui.html
- OpenAPI JSON: http://localhost:8080/v3/api-docs
