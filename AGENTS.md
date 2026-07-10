# PISTOS – Loyalty App | Agent Guidelines

**Project:** PISTOS (Points Integration System for Transaction-Originated Services)
**Team:** 2-person Indivara JDT-17 apprenticeship project, AI-assisted implementation
**Deadline:** 2026-07-14
**Context:** Backend + Frontend from scratch, demo-ready by deadline

---

## Stack

| Layer | Technology | Version |
|-------|-----------|---------|
| Backend | Spring Boot | 4.1.0 |
| Language | Java | 21 LTS |
| Database | PostgreSQL | 18.4 (postgres:18.4-alpine) |
| ORM | JPA / Hibernate | — |
| Migrations | Flyway | — |
| Auth | JWT HS512 (jjwt 0.12.5) | Spring Security |
| Testing | JUnit 5 + Mockito | — |
| Frontend | Next.js | 16.x (React 19, App Router) |
| UI | shadcn/ui + Tailwind | v4 |
| State | React Query (TanStack) | — |
| Deployment | Docker Compose | — |

---

## Architecture Rules

1. **JWT for all actors** — MEMBER, ADMIN, PARTNER roles in JWT claim (HS512)
2. **Optimistic locking** — `@Version` on `TRX_POINT_BALANCE` entity (prevents race conditions)
3. **Bulk SQL for partner creation** — NO `memberRepo.findAll()`, use native INSERT-SELECT
4. **TDD for services** — Red-Green-Refactor, write test first
5. **Paginated reads** — All list endpoints use `Pageable`, default page size 20
6. **Audit trail** — All writes log to `TRX_AUDIT_TRAIL` within same `@Transactional` scope
7. **Partner-scoped balances** — One `TRX_POINT_BALANCE` row per (memberId, partnerId)
8. **EXPIRED as transaction** — Point expiry creates visible TRX_TRANSACTION record
9. **Configurable expiry** — `expiryDays` per partner, `expiresAt = now + expiryDays`, computed at EARN time
10. **Error codes** — All error responses include `code` field (see TSD)
11. **Virtual threads** — `spring.threads.virtual.enabled=true` required in application.yml
12. **MST_ADMIN separate** — Admin credentials live in MST_ADMIN table, not MST_MEMBER; login checks both tables
13. **memberId from JWT** — POST /redeem and POST /exchange resolve memberId from JWT `sub`; never accept memberId in request body from MEMBER role
14. **phone uniqueness** — MST_MEMBER.phone has UNIQUE constraint (V6 migration); check at register → DUPLICATE_PHONE (400)
15. **CORS** — `CorsConfigurationSource` bean in `SecurityConfig`; allow `http://localhost:3000` for `/api/v1/**`; do not use `@CrossOrigin` on controllers
16. **Exchange rates append-only** — POST /exchange-rates inserts new rows only; never UPDATE existing rows (versioning via effective_from + UNIQUE constraint)

---

## Directory Map

```
├── FSD.md                  # Functional spec (use cases, scope, business rules)
├── TSD.md                  # Technical spec (ERD, API endpoints, auth matrix)
├── .hermes/plans/          # Implementation plan
├── docs/
│   └── seed-data.sql       # Demo data (1 admin, 2 partners, 11 rewards, 3 members)
├── backend/                # Spring Boot 4.1.0 (Maven)
├── frontend/               # Next.js 16
├── docker-compose.yml
├── .env.example
└── *.diagram.md / erd.md / bpmn.md / stitch-design-brief.md
```

**Sources of truth (in priority order):**
1. `TSD final.docx` / TSD.md (v1.2, 08-Jul-2026)
2. `FSD PISTOS LOYALTY APP_backup.docx` / FSD.md
3. Implementation plan (`.hermes/plans/`)
4. Diagram files (visual reference only)

---

## How to Run

**First time setup:**
```bash
cp .env.example .env
chmod 600 .env
# Edit .env: set POSTGRES_PASSWORD and JWT_SECRET (openssl rand -hex 64)
docker-compose up -d
docker-compose logs -f backend   # watch Flyway migrations
```

**Seed data credentials:**
- Admin: `admin@jdt17loyalty.com` / `Admin123!`
- Member: `budi.santoso@example.com` / `Member123!`
- KFC API Key: `kfc_api_key_2026_secure_demo_only`
- McD API Key: `mcd_api_key_2026_secure_demo_only`

---

## Package Structure (Backend)

```
com.jdt17.loyalty/
├── config/           # Spring config (Security, JWT, virtual threads)
├── entity/           # JPA entities (MST_*, TRX_*)
├── repository/       # Spring Data JPA repos
├── service/          # Business logic (TDD here)
├── controller/       # REST controllers (@RestController)
├── dto/              # Request/Response DTOs
├── exception/        # Custom exceptions + @ControllerAdvice
├── security/         # JWT filter, UserDetailsService
├── scheduler/        # @Scheduled jobs (point expiry)
└── audit/            # AuditTrailService
```

---

## Database Tables

| Table | Alias | Description |
|-------|-------|-------------|
| MST_MEMBER | MEM | Registered member profiles |
| MST_PARTNER | PTR | Partner config (KFC, McD) |
| MST_REWARD | RWD | Reward catalog (11 items) |
| MST_EXCHANGE_RATE | XRT | Directional rates: KFC→McD 0.8, McD→KFC **0.9** |
| MST_ADMIN | ADM | CMS admin credentials (single admin) |
| TRX_POINT_BALANCE | BAL | Per member-partner balance + `@Version` |
| TRX_TRANSACTION | TXN | Immutable point movement log |
| TRX_AUDIT_TRAIL | AUD | Append-only audit log |

**Exchange rates (final):** KFC→McD = 0.8000, McD→KFC = 0.9000

---

## Coding Conventions

**Entity naming:**
- Master tables: `MST_*` — JPA entities PascalCase without prefix
- Transaction tables: `TRX_*`

**Error handling:**
- All service exceptions extend `LoyaltyException`
- `@ControllerAdvice` catches → error codes
- Format: `{status, error, message, code}`

**API conventions:**
- Base URL: `/api/v1`
- Auth: `/auth/register`, `/auth/login`, `/auth/partner/token`
- JWT: HS512, member/admin expiry 24h, partner expiry 1h

**Testing:**
- Service tests: `@ExtendWith(MockitoExtension.class)`, mock repos
- Controller tests: `@WebMvcTest`, mock services

**Frontend:**
- Routes: `/login`, `/register`, `/dashboard`, `/rewards`, `/redeem`, `/exchange`, `/history`, `/admin`, `/admin/members/[id]`
- Auth guard: `middleware.ts` at root
- API client: axios + JWT interceptor
- State: React Query for server state, localStorage for JWT

---

## What NOT to Do

1. **NO `findAll()` without pagination** — OOM risk
2. **NO hardcoded secrets** — use `.env`
3. **NO `@Transactional` on controllers** — service layer only
4. **NO manual balance calculation** — use cached TRX_POINT_BALANCE
5. **NO raw SQL in services** — JPA only except bulk partner init
6. **NO session cookies** — JWT only
7. **NO partnerId on member registration** — members are platform-wide
8. **NO skipping audit trail** — all writes log to TRX_AUDIT_TRAIL in same transaction
9. **NO placeholder bcrypt hash in production** — regenerate before deploy
10. **NO separate PUT /members/{id}/status** — status update merged into `PUT /members/{id}`

---

## API Authorization Matrix

| Endpoint | Public | MEMBER | ADMIN | PARTNER | Notes |
|----------|--------|--------|-------|---------|-------|
| `POST /auth/register` | ✓ | — | — | — | Returns JWT + role + user |
| `POST /auth/login` | ✓ | — | — | — | Checks MST_MEMBER + MST_ADMIN |
| `POST /auth/partner/token` | ✓ | — | — | — | Validates apiKey → PARTNER JWT (1h) |
| `POST /transactions` | — | — | — | ✓ | PARTNER JWT required |
| `GET /members` | — | — | ✓ | — | `?page&size&status` |
| `GET /members/{id}` | — | ✓ (own) | ✓ (any) | — | No financial data in response |
| `PUT /members/{id}` | — | — | ✓ | — | Update name/phone/status (single endpoint) |
| `GET /members/{id}/points` | — | ✓ (own) | — | — | Admin explicitly forbidden |
| `GET /members/{id}/transactions` | — | ✓ (own) | — | — | Admin explicitly forbidden |
| `POST /exchange` | — | ✓ | — | — | memberId from JWT sub |
| `POST /redeem` | — | ✓ | — | — | memberId from JWT sub |
| `GET /rewards` | — | ✓ | ✓ | — | `?partnerId={uuid}` |
| `GET /partners` | — | ✓ | ✓ | — | — |
| `POST /partners` | — | — | ✓ | — | Bulk-inits balances via native SQL |
| `PUT /partners/{id}` | — | — | ✓ | — | name/pointsPerThousandIDR/expiryDays/status; code immutable |
| `GET /exchange-rates` | — | ✓ | ✓ | — | Active rate per pair |
| `POST /exchange-rates` | — | — | ✓ | — | Inserts new row; append-only |

**Privacy:** Admin cannot view member point balances or transaction history (403).

---

## Standard Error Codes

| Code | HTTP | Description |
|------|------|-------------|
| MEMBER_NOT_FOUND | 404 | Member does not exist |
| MEMBER_INACTIVE | 400 | Member status INACTIVE |
| PARTNER_NOT_FOUND | 404 | Partner does not exist |
| PARTNER_INACTIVE | 400 | Partner status INACTIVE |
| REWARD_NOT_FOUND | 404 | Reward does not exist |
| REWARD_INACTIVE | 404 | Reward not ACTIVE |
| INSUFFICIENT_BALANCE | 422 | Not enough points |
| EXCHANGE_RATE_NOT_CONFIGURED | 404 | No rate for partner pair |
| INVALID_CREDENTIALS | 401 | Wrong email/password or API key |
| UNAUTHORIZED | 401 | Missing or invalid JWT |
| FORBIDDEN | 403 | Valid JWT, wrong role |
| DUPLICATE_EMAIL | 400 | Email already registered |
| DUPLICATE_PHONE | 400 | Phone already registered |
| DUPLICATE_PARTNER_CODE | 400 | Partner code already exists |
| INVALID_EXCHANGE_RATE_PAIR | 400 | fromPartnerId equals toPartnerId |
| DUPLICATE_EXCHANGE_RATE | 409 | Same pair + effectiveFrom already exists |

---

## Audit Events

| Event | Trigger | Actor |
|-------|---------|-------|
| MEMBER_REGISTERED | POST /auth/register | SYSTEM |
| MEMBER_UPDATED | PUT /members/{id} | ADMIN |
| MEMBER_STATUS_CHANGED | PUT /members/{id} (status change) | ADMIN |
| PARTNER_CREATED | POST /partners | ADMIN |
| POINTS_EARNED | POST /transactions | SYSTEM |
| POINT_EXPIRED | Daily cron | SYSTEM |
| POINTS_EXCHANGED | POST /exchange | MEMBER |
| POINTS_REDEEMED | POST /redeem | MEMBER |
| EXCHANGE_RATE_CREATED | POST /exchange-rates | ADMIN |

Audit writes are **within the same `@Transactional`** as the business op — rollback = no orphan audit entry. No DB triggers.

---

## Scheduler

```java
@Scheduled(cron = "0 0 17 * * *")  // 17:00 UTC = 00:00 WIB
```

Per-member try/catch — one member failure does not block others. Idempotent (won't re-expire already-expired points).

---

## Branching Strategy

Per-feature branches off `main`. One branch = one endpoint or feature. Max lifespan 1 day.

**Naming:** `feat/<thing>`, `fix/<thing>`, `chore/<thing>`

**Rules:**
- No direct push to `main`
- Open PR → teammate reviews → merge → delete branch
- Commit convention: `feat(earn): POST /transactions`, `fix(auth): token expiry`, `chore(db): V3 seed rates`

### Frontend branches (merged to main)

All frontend branches from UI slicing phase have been merged to main.

### Backend branches (merged to main)

- `feat/flyway-schema` (V1 migration)
- `feat/flyway-seed` (V2–V5 seed scripts)
- `feat/flyway-phone-unique` (V6 UNIQUE phone constraint)
- `feat/auth-core` (scaffold entities, repositories, register, login, partner tokens, security config)
- `feat/member-management` (GET /members, GET /members/{id}, PUT /members/{id})
- `feat/member-points` (GET /members/{id}/points)
- `feat/audit-trail` (AuditTrailService & implementations)

Please track the real-time completion state of remaining features in **KANBAN.md** at the project root.

---

## Implementation Phases (reference)

1. **Infrastructure** — Spring Boot scaffold, Flyway, Docker Compose, Next.js — **DONE**
2. **Backend Core** — Entities (incl. MST_ADMIN), repos, JWT auth, services (TDD)
3. **Business Logic** — EARN, expiry scheduler (17:00 UTC), exchange, redemption (TDD)
4. **Frontend** — Auth pages, member screens, admin CMS
5. **Integration** — E2E smoke test, seed data

---

## Known Constraints

- **Deadline:** July 14, 2026
- **Seed data bcrypt hash** — placeholder, regenerate before deployment
- **Partner api_key** — store SHA-256 hash at rest, not plaintext
- **No JWT revocation in MVP** — max 24h exposure window; use short-lived tokens + refresh in production
- **Single backend instance** — expiry scheduler not distributed-lock protected; scale carefully
- **No rate limiting in MVP** — add Bucket4j before public deployment
- **No reward stock management** — MVP, by design
- **No audit REST API** — TRX_AUDIT_TRAIL is DB-query only; deliberate scope decision
- **No Actuator health endpoint** — optional; low priority for MVP

---

**Last updated:** 2026-07-08
**TSD version:** 1.2 (08-Jul-2026)
**FSD version:** 1.0.0 (backup.docx, 03-Jul-2026)
