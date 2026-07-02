# Technical Specification Document (TSD)
## JDT-17-LOYALTY — Loyalty Points Platform
**Version:** 1.0  
**Date:** 2 July 2026  
**Deadline:** 14 July 2026  
**Author:** Technical Architect (AI-assisted)  
**References:** FSD.md, README.md

---

## 1. Proposed Tech Stack

| Layer | Technology | Justification |
|-------|-----------|---------------|
| **Language** | Java 17 (LTS) | Aligns with bootcamp context (project is under `java/` path); strong typing aids correctness |
| **Framework** | Spring Boot 3.x | Industry-standard, fast to scaffold REST APIs; auto-configuration reduces boilerplate; large ecosystem |
| **ORM** | Spring Data JPA + Hibernate | Handles DB mapping, transactions, and query generation with minimal SQL boilerplate |
| **Database** | PostgreSQL 15 | Reliable relational DB; ACID transactions essential for point balance integrity; free and widely available |
| **DB Migration** | Flyway | Version-controlled schema migrations; easy to seed initial data (partners, rewards, exchange rates) |
| **Build Tool** | Maven | Standard for Spring Boot; familiar to most Java developers |
| **Testing** | JUnit 5 + Mockito | Standard Java testing stack; Mockito enables service-layer unit testing without DB |
| **API Docs** | SpringDoc OpenAPI (Swagger UI) | Auto-generates interactive API docs from annotations; useful for demo |
| **Containerization** | Docker + Docker Compose | One-command local setup (`docker compose up`); eliminates "works on my machine" issues |

> **Why not Node.js / Python?** The project lives in a `java/` directory and the bootcamp context implies Java. Spring Boot is well-suited for 2-week delivery — abundant scaffolding tools (`spring initializr`), mature testing support, and straightforward REST + JPA patterns.

---

## 2. Entity Relationship Diagram (ERD)

```mermaid
erDiagram
    MEMBER {
        UUID id PK
        string name
        string email
        string phone
        enum status "ACTIVE | INACTIVE"
        timestamp createdAt
        timestamp updatedAt
    }

    PARTNER {
        UUID id PK
        string name
        string code "KFC | MCD"
        int pointsPerThousandIDR "default 1 — ASSUMPTION"
        enum status "ACTIVE | INACTIVE"
        timestamp createdAt
    }

    POINT_BALANCE {
        UUID id PK
        UUID memberId FK
        UUID partnerId FK
        long balance
        timestamp updatedAt
    }

    TRANSACTION {
        UUID id PK
        UUID memberId FK
        UUID partnerId FK
        enum type "EARN | REDEEM | EXCHANGE_IN | EXCHANGE_OUT"
        long points
        long trxAmountIDR "null for non-EARN"
        UUID relatedTxId "links EXCHANGE_OUT to EXCHANGE_IN"
        timestamp expiresAt "nullable — reserved for future expiry"
        timestamp createdAt
    }

    REDEMPTION_LOG {
        UUID id PK
        UUID memberId FK
        UUID partnerId FK
        UUID rewardId FK
        UUID transactionId FK
        long pointsDeducted
        timestamp redeemedAt
    }

    REWARD {
        UUID id PK
        UUID partnerId FK
        string name
        string description
        long pointCost
        enum status "ACTIVE | INACTIVE"
        timestamp createdAt
    }

    EXCHANGE_RATE {
        UUID id PK
        UUID fromPartnerId FK
        UUID toPartnerId FK
        decimal rate "e.g. 0.8 for KFC->McD"
        timestamp effectiveFrom
        timestamp updatedAt
    }

    AUDIT_TRAIL {
        UUID id PK
        string eventType
        UUID actorId "memberId or null for system"
        string actorType "MEMBER | SYSTEM | ADMIN"
        string entityType "MEMBER | TRANSACTION | REDEMPTION | EXCHANGE"
        UUID entityId
        jsonb payload "before/after snapshot"
        timestamp createdAt
    }

    MEMBER ||--o{ POINT_BALANCE : "has"
    PARTNER ||--o{ POINT_BALANCE : "tracked by"
    MEMBER ||--o{ TRANSACTION : "performs"
    PARTNER ||--o{ TRANSACTION : "associated with"
    MEMBER ||--o{ REDEMPTION_LOG : "redeems"
    PARTNER ||--o{ REWARD : "offers"
    REWARD ||--o{ REDEMPTION_LOG : "fulfilled by"
    TRANSACTION ||--o| REDEMPTION_LOG : "backs"
    PARTNER ||--o{ EXCHANGE_RATE : "fromPartner"
    PARTNER ||--o{ EXCHANGE_RATE : "toPartner"
```

### Key Design Decisions

- **`POINT_BALANCE`** is a dedicated balance table (not computed from transaction sum on every read) — faster reads, simpler balance check logic. Balance is updated atomically with each transaction within a DB transaction.
- **`pointsPerThousandIDR`** on `PARTNER` is the configurable accumulation rate (see FSD §5.1 Assumption).
- **`EXCHANGE_RATE`** stores directional rates: one row for KFC→McD, another for McD→KFC. This allows asymmetric rates.
- **`AUDIT_TRAIL.payload`** stores a JSON snapshot for event reconstruction without joining other tables.
- `expiresAt` on `TRANSACTION` is nullable and unused in MVP — reserved for future point expiry feature.

---

## 3. Flowcharts

### 3.1 Point Accumulation Flow

```mermaid
flowchart TD
    A([Partner System calls POST /transactions]) --> B{Member exists?}
    B -- No --> ERR1[Return 404 Member Not Found]
    B -- Yes --> C{Partner exists & ACTIVE?}
    C -- No --> ERR2[Return 404 Partner Not Found]
    C -- Yes --> D{Member status ACTIVE?}
    D -- No --> ERR3[Return 400 Member Inactive]
    D -- Yes --> E[Calculate points\npointsEarned = floor trxAmount / 1000\ntimes pointsPerThousandIDR]
    E --> F[BEGIN DB Transaction]
    F --> G[Insert TRANSACTION record\ntype = EARN]
    G --> H[UPDATE POINT_BALANCE\nbalance += pointsEarned]
    H --> I[Insert AUDIT_TRAIL\neventType = POINTS_EARNED]
    I --> J[COMMIT]
    J --> K([Return 201 with transaction + new balance])
```

### 3.2 Point Redemption Flow

```mermaid
flowchart TD
    A([Member calls POST /redeem]) --> B{Member exists?}
    B -- No --> ERR1[Return 404]
    B -- Yes --> C{Reward exists?}
    C -- No --> ERR2[Return 404]
    C -- Yes --> D[Fetch reward.pointCost\nand reward.partnerId]
    D --> E{Member balance for partner\n>= pointCost?}
    E -- No --> ERR3[Return 400 Insufficient Balance]
    E -- Yes --> F[BEGIN DB Transaction]
    F --> G[Insert TRANSACTION record\ntype = REDEEM, points = pointCost]
    G --> H[UPDATE POINT_BALANCE\nbalance -= pointCost]
    H --> I[Insert REDEMPTION_LOG]
    I --> J[Insert AUDIT_TRAIL\neventType = POINTS_REDEEMED]
    J --> K[COMMIT]
    K --> L([Return 200 with redemption confirmation\nand remaining balance])
```

### 3.3 Point Exchange Flow

```mermaid
flowchart TD
    A([Member calls POST /exchange]) --> B{Member exists?}
    B -- No --> ERR1[Return 404]
    B -- Yes --> C{fromPartner & toPartner\nexist and ACTIVE?}
    C -- No --> ERR2[Return 404]
    C -- Yes --> D{ExchangeRate exists for\nfromPartner -> toPartner?}
    D -- No --> ERR3[Return 404 Exchange Rate Not Configured]
    D -- Yes --> E{Member balance for fromPartner\n>= requestedPoints?}
    E -- No --> ERR4[Return 400 Insufficient Balance]
    E -- Yes --> F[Calculate target points\ntargetPoints = floor points x rate]
    F --> G[BEGIN DB Transaction]
    G --> H[Insert TRANSACTION\ntype=EXCHANGE_OUT, fromPartner]
    H --> I[Insert TRANSACTION\ntype=EXCHANGE_IN, toPartner\nrelatedTxId = EXCHANGE_OUT.id]
    I --> J[UPDATE POINT_BALANCE\nfromPartner balance -= points]
    J --> K[UPDATE POINT_BALANCE\ntoPartner balance += targetPoints]
    K --> L[Insert AUDIT_TRAIL\neventType = POINTS_EXCHANGED]
    L --> M[COMMIT]
    M --> N([Return 200 with both updated balances])
```

---

## 4. API Specification

### Conventions

- **Base URL:** `http://localhost:8080/api/v1`
- **Content-Type:** `application/json`
- **Admin endpoints** require header: `X-Admin-Key: <configured-value>`
- **Error response format** (all errors):
  ```json
  {
    "status": 400,
    "error": "BAD_REQUEST",
    "message": "Insufficient point balance"
  }
  ```

---

### 4.1 `POST /members` — Register Member

**Description:** Register a new loyalty member. No input validation.  
**Auth:** None

**Request:**
```json
{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890"
}
```

**Response `201 Created`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "status": "ACTIVE",
  "pointBalances": [
    { "partnerId": "kfc-uuid", "partnerName": "KFC", "balance": 0 },
    { "partnerId": "mcd-uuid", "partnerName": "McDonald's", "balance": 0 }
  ],
  "createdAt": "2026-07-02T10:00:00Z"
}
```

**Status Codes:** `201` (created), `500` (unexpected error)

---

### 4.2 `GET /members` — List Members

**Description:** List all members. Supports optional `?status=ACTIVE|INACTIVE`.  
**Auth:** `X-Admin-Key` (admin endpoint)

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "name": "Budi Santoso",
      "email": "budi@example.com",
      "status": "ACTIVE",
      "createdAt": "2026-07-02T10:00:00Z"
    }
  ],
  "total": 1
}
```

**Status Codes:** `200`, `401` (missing/invalid admin key)

---

### 4.3 `GET /members/{id}` — Get Member Detail

**Description:** Get a single member's profile.  
**Auth:** None

**Response `200 OK`:**
```json
{
  "id": "550e8400-e29b-41d4-a716-446655440001",
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "status": "ACTIVE",
  "createdAt": "2026-07-02T10:00:00Z"
}
```

**Status Codes:** `200`, `404` (member not found)

---

### 4.4 `PUT /members/{id}` — Edit Member (CMS)

**Description:** Update member details or status.  
**Auth:** `X-Admin-Key`

**Request:**
```json
{
  "name": "Budi S.",
  "phone": "089876543210",
  "status": "INACTIVE"
}
```

**Response `200 OK`:** Updated member object (same shape as 4.3).  
**Status Codes:** `200`, `401`, `404`

---

### 4.5 `GET /members/{id}/points` — Get Point Balances

**Description:** Get a member's point balances across all partners.  
**Auth:** None

**Response `200 OK`:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "memberName": "Budi Santoso",
  "balances": [
    { "partnerId": "kfc-uuid", "partnerName": "KFC", "balance": 350 },
    { "partnerId": "mcd-uuid", "partnerName": "McDonald's", "balance": 120 }
  ]
}
```

**Status Codes:** `200`, `404`

---

### 4.6 `GET /members/{id}/transactions` — Get Transaction History

**Description:** Paginated transaction history for a member.  
**Query Params:** `?page=0&size=10&type=EARN|REDEEM|EXCHANGE_IN|EXCHANGE_OUT`  
**Auth:** None

**Response `200 OK`:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "page": 0,
  "size": 10,
  "total": 2,
  "transactions": [
    {
      "id": "tx-uuid-001",
      "type": "EARN",
      "partnerId": "kfc-uuid",
      "partnerName": "KFC",
      "points": 150,
      "trxAmountIDR": 150000,
      "createdAt": "2026-07-02T10:05:00Z"
    },
    {
      "id": "tx-uuid-002",
      "type": "EXCHANGE_OUT",
      "partnerId": "kfc-uuid",
      "partnerName": "KFC",
      "points": -100,
      "relatedTxId": "tx-uuid-003",
      "createdAt": "2026-07-02T10:10:00Z"
    }
  ]
}
```

**Status Codes:** `200`, `404`

---

### 4.7 `POST /transactions` — Simulate Partner Transaction (Point Earn)

**Description:** Simulates a partner sending a transaction to earn points for a member.  
**Auth:** None (simulated partner call; no API key in MVP — see FSD §7.6)

**Request:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "partner": "KFC",
  "trxAmount": 150000
}
```

**Response `201 Created`:**
```json
{
  "transactionId": "tx-uuid-001",
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "partner": "KFC",
  "trxAmountIDR": 150000,
  "pointsEarned": 150,
  "newBalance": 350,
  "createdAt": "2026-07-02T10:05:00Z"
}
```

**Status Codes:** `201`, `400` (member inactive), `404` (member or partner not found)

---

### 4.8 `GET /partners` — List Partners

**Description:** List all registered partners.  
**Auth:** None

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "kfc-uuid",
      "name": "KFC",
      "code": "KFC",
      "pointsPerThousandIDR": 1,
      "status": "ACTIVE"
    },
    {
      "id": "mcd-uuid",
      "name": "McDonald's",
      "code": "MCD",
      "pointsPerThousandIDR": 1,
      "status": "ACTIVE"
    }
  ]
}
```

**Status Codes:** `200`

---

### 4.9 `GET /rewards` — List Reward Catalog

**Description:** List all rewards (seeded dummy data). Filter by partner using `?partnerId=`.  
**Auth:** None

**Response `200 OK`:**
```json
{
  "data": [
    {
      "id": "reward-uuid-001",
      "partnerId": "kfc-uuid",
      "partnerName": "KFC",
      "name": "KFC Original Bucket",
      "description": "1 bucket of KFC Original 8 pcs",
      "pointCost": 500,
      "status": "ACTIVE"
    },
    {
      "id": "reward-uuid-002",
      "partnerId": "mcd-uuid",
      "partnerName": "McDonald's",
      "name": "McD BigMac Voucher",
      "description": "1 BigMac sandwich",
      "pointCost": 300,
      "status": "ACTIVE"
    }
  ]
}
```

**Status Codes:** `200`

---

### 4.10 `POST /redeem` — Redeem Points for Reward

**Description:** Redeem a member's points for a reward. Validates balance only — no stock check.  
**Auth:** None

**Request:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "rewardId": "reward-uuid-001"
}
```

**Response `200 OK`:**
```json
{
  "redemptionId": "red-uuid-001",
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "reward": {
    "id": "reward-uuid-001",
    "name": "KFC Original Bucket",
    "partnerName": "KFC"
  },
  "pointsDeducted": 500,
  "remainingBalance": 0,
  "redeemedAt": "2026-07-02T11:00:00Z"
}
```

**Status Codes:** `200`, `400` (insufficient balance), `404` (member or reward not found)

---

### 4.11 `POST /exchange` — Exchange Points Between Partners

**Description:** Convert a member's points from one partner to another at the configured rate.  
**Auth:** None

**Request:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "fromPartnerId": "kfc-uuid",
  "toPartnerId": "mcd-uuid",
  "points": 100
}
```

**Response `200 OK`:**
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "fromPartner": "KFC",
  "toPartner": "McDonald's",
  "pointsDeducted": 100,
  "pointsCredited": 80,
  "exchangeRate": 0.8,
  "updatedBalances": {
    "KFC": 250,
    "McDonald's": 200
  },
  "outTransactionId": "tx-uuid-004",
  "inTransactionId": "tx-uuid-005",
  "exchangedAt": "2026-07-02T11:15:00Z"
}
```

**Status Codes:** `200`, `400` (insufficient balance), `404` (member, partner, or exchange rate not found)

---

## 5. Audit Trail Design

### 5.1 Purpose

Every significant state-changing action is logged in the `AUDIT_TRAIL` table. This provides a tamper-evident history of member activity and admin operations without modifying business tables.

### 5.2 Events Logged

| Event Type | Trigger | Actor Type |
|------------|---------|-----------|
| `MEMBER_REGISTERED` | `POST /members` | SYSTEM |
| `MEMBER_UPDATED` | `PUT /members/{id}` | ADMIN |
| `MEMBER_STATUS_CHANGED` | Status toggle via `PUT /members/{id}` | ADMIN |
| `POINTS_EARNED` | `POST /transactions` | SYSTEM |
| `POINTS_REDEEMED` | `POST /redeem` | MEMBER |
| `POINTS_EXCHANGED` | `POST /exchange` | MEMBER |

### 5.3 Audit Trail Schema

```sql
CREATE TABLE audit_trail (
    id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    event_type  VARCHAR(50)  NOT NULL,               -- e.g. POINTS_EARNED
    actor_id    UUID,                                  -- memberId or null
    actor_type  VARCHAR(20)  NOT NULL,               -- MEMBER | SYSTEM | ADMIN
    entity_type VARCHAR(50)  NOT NULL,               -- MEMBER | TRANSACTION | REDEMPTION | EXCHANGE
    entity_id   UUID         NOT NULL,               -- PK of the affected row
    payload     JSONB,                                -- before/after snapshot
    created_at  TIMESTAMPTZ  NOT NULL DEFAULT now()
);

CREATE INDEX idx_audit_actor   ON audit_trail(actor_id);
CREATE INDEX idx_audit_entity  ON audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_created ON audit_trail(created_at DESC);
```

### 5.4 Sample Payload Structure

For `POINTS_EARNED`:
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "partnerId": "kfc-uuid",
  "trxAmountIDR": 150000,
  "pointsEarned": 150,
  "balanceBefore": 200,
  "balanceAfter": 350
}
```

For `POINTS_EXCHANGED`:
```json
{
  "memberId": "550e8400-e29b-41d4-a716-446655440001",
  "fromPartnerId": "kfc-uuid",
  "toPartnerId": "mcd-uuid",
  "pointsDeducted": 100,
  "pointsCredited": 80,
  "exchangeRate": 0.8,
  "fromBalanceBefore": 350, "fromBalanceAfter": 250,
  "toBalanceBefore": 120,   "toBalanceAfter": 200
}
```

### 5.5 Audit Trail Implementation Notes

- Audit writes happen **within the same DB transaction** as the business operation — if the business operation rolls back, the audit entry is also rolled back (consistent state).
- Use a Spring `@Transactional` service method that writes both the business record and audit record.
- Do **not** use DB triggers for audit writes — keep logic in the service layer for testability.

---

## 6. Database Migration & Seeding Strategy (Flyway)

| Migration File | Purpose |
|----------------|---------|
| `V1__create_schema.sql` | Create all tables (member, partner, point_balance, transaction, reward, redemption_log, exchange_rate, audit_trail) |
| `V2__seed_partners.sql` | Insert KFC and McDonald's partner records with `pointsPerThousandIDR = 1` |
| `V3__seed_exchange_rates.sql` | Insert KFC→McD (rate: 0.8) and McD→KFC (rate: 1.25) |
| `V4__seed_rewards.sql` | Insert 3–5 dummy rewards per partner |
| `V5__seed_demo_members.sql` | (Optional) Insert 2–3 demo members for presentation |

---

## 7. Project Package Structure

```
src/
└── main/java/com/jdt/loyalty/
    ├── config/           # Spring config, API key filter
    ├── controller/       # REST controllers (MemberController, etc.)
    ├── service/          # Business logic (MemberService, PointService, etc.)
    ├── repository/       # Spring Data JPA repositories
    ├── entity/           # JPA entities (Member, Partner, Transaction, etc.)
    ├── dto/              # Request/Response DTOs
    ├── exception/        # Custom exceptions + GlobalExceptionHandler
    └── audit/            # AuditTrailService
src/
└── test/java/com/jdt/loyalty/
    ├── service/          # Unit tests for service layer
    └── controller/       # Integration tests (optional)
```

---

## 8. Unit Testing Plan

### 8.1 Philosophy

- **Service layer only** for unit tests — no DB, no HTTP in unit tests.
- Use **Mockito** to mock repositories and dependencies.
- Use **@SpringBootTest** only for integration smoke tests (optional in MVP scope).

### 8.2 Test Cases

| Class Under Test | Test Case |
|-----------------|-----------|
| `PointService#earnPoints` | Correct points calculated from trxAmount using `floor(trxAmount / 1000)` |
| `PointService#earnPoints` | Throws `MemberNotFoundException` when member does not exist |
| `PointService#earnPoints` | Throws `PartnerNotFoundException` when partner does not exist |
| `PointService#earnPoints` | Throws `MemberInactiveException` when member is INACTIVE |
| `PointService#redeemPoints` | Redemption succeeds when balance ≥ cost; balance correctly deducted |
| `PointService#redeemPoints` | Throws `InsufficientBalanceException` when balance < cost |
| `PointService#redeemPoints` | Throws `RewardNotFoundException` when reward does not exist |
| `PointService#exchangePoints` | Exchange succeeds; target points = `floor(sourcePoints × rate)` |
| `PointService#exchangePoints` | Throws `InsufficientBalanceException` when source balance < requested |
| `PointService#exchangePoints` | Throws `ExchangeRateNotFoundException` when rate not configured |
| `MemberService#registerMember` | Member created; point balances initialized to 0 for all active partners |
| `AuditTrailService#log` | Audit record written with correct event type, actor, entity |

### 8.3 Tools & Configuration

```xml
<!-- pom.xml test dependencies -->
<dependency>
    <groupId>org.springframework.boot</groupId>
    <artifactId>spring-boot-starter-test</artifactId>
    <scope>test</scope>
    <!-- Includes JUnit 5, Mockito, AssertJ -->
</dependency>
```

Run tests with: `mvn test`

---

## 9. Configuration Reference

All values below should be set in `application.properties` or via environment variables for local/Docker deployment.

| Property | Default | Description |
|----------|---------|-------------|
| `spring.datasource.url` | `jdbc:postgresql://localhost:5432/loyalty` | DB connection URL |
| `spring.datasource.username` | `loyalty_user` | DB username |
| `spring.datasource.password` | *(env var)* | DB password |
| `spring.jpa.hibernate.ddl-auto` | `validate` | Flyway manages schema; Hibernate validates |
| `loyalty.admin.api-key` | *(env var)* | Static API key for admin endpoints |
| `loyalty.points.default-rate` | `1` | Default points per IDR 1,000 (overridden per partner) |

---

## 10. Assumptions (Technical)

| # | Assumption | Impact if Wrong |
|---|-----------|----------------|
| T-1 | Point balances are stored as `long` (integer). No fractional points. | If fractional points needed, change to `decimal`/`BigDecimal` |
| T-2 | Exchange rate stored as `decimal(10,4)`. Target points floor-rounded. | If rounding rule changes, update `PointService#exchangePoints` |
| T-3 | All IDs are UUIDs generated by the DB (`gen_random_uuid()`). | Sequential IDs can be used — change `@GeneratedValue` strategy |
| T-4 | All timestamps stored as `TIMESTAMPTZ` (UTC). | Client-side timezone handling may be needed for display |
| T-5 | `AUDIT_TRAIL.payload` is `JSONB` (PostgreSQL-specific). | For portability, change to `TEXT` and serialize manually |
