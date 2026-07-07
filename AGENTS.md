# JDT-17-LOYALTY Agent Guidelines

**Project:** Multi-partner loyalty platform (KFC / McDonald's pilot)  
**Team:** 2-person bootcamp project, AI-assisted implementation  
**Deadline:** 2026-07-14 (11 days remaining)  
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
| Auth | JWT (jjwt 0.12.5) | Spring Security |
| Testing | JUnit 5 + Mockito | — |
| Frontend | Next.js | 16.x |
| UI | shadcn/ui + Tailwind | v4 |
| State | React Query (TanStack) | — |
| Deployment | Docker Compose | — |

---

## Architecture Rules

1. **JWT for all actors** — MEMBER, ADMIN, PARTNER roles in JWT claim
2. **Optimistic locking** — `@Version` on `PointBalance` entity (prevents race conditions)
3. **Bulk SQL for partner creation** — NO `memberRepo.findAll()`, use native INSERT-SELECT
4. **TDD for services** — Red-Green-Refactor, write test first
5. **Paginated reads** — All list endpoints use `Pageable`, default page size 20
6. **Audit trail** — All writes log to `TRX_AUDIT_TRAIL` (actorId, actorType, eventType, payload)
7. **Partner-scoped balances** — One `TRX_POINT_BALANCE` row per member per partner
8. **EXPIRED as transaction** — Point expiry creates visible transaction record for members
9. **Configurable expiry** — `expiryDays` per partner, computed at EARN time
10. **Error codes** — All error responses include `code` field (see TSD §4)

---

## Directory Map

```
├── FSD.md                  # Functional spec (use cases, scope, business rules)
├── TSD.md                  # Technical spec (ERD, API endpoints, auth matrix)
├── .hermes/plans/          # Implementation plan (5 phases, task breakdown)
├── docs/
│   └── seed-data.sql       # Demo data (1 admin, 2 partners, 11 rewards, 3 members)
├── .env.example            # Environment variables template
├── activity.diagram.md     # UC-01 to UC-06 flowcharts
├── usecase.diagram.md      # Actor-use case relationships
├── erd.md                  # Entity reference (detailed field specs)
├── bpmn.md                 # BPMN Level 0-3 process flows
└── stitch-design-brief.md  # Frontend UI/UX design system
```

**Sources of truth (in priority order):**
1. Implementation plan (`.hermes/plans/`)
2. TSD.md (API spec, ERD, conventions)
3. FSD.md (business rules, scope)
4. Diagram files (visual reference only)

---

## How to Run

**First time setup:**
```bash
# 1. Copy environment template
cp .env.example .env
chmod 600 .env

# 2. Generate JWT secret
openssl rand -hex 64

# 3. Edit .env with real values (POSTGRES_PASSWORD, JWT_SECRET)

# 4. Start stack
docker-compose up -d

# 5. Verify migrations ran
docker-compose logs backend | grep Flyway

# 6. Load seed data
docker-compose exec db psql -U loyalty -d jdt17_loyalty -f /docker-entrypoint-initdb.d/seed-data.sql
```

**Daily dev:**
```bash
docker-compose up        # Start all services
docker-compose logs -f   # Watch logs
docker-compose down      # Stop all
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
├── config/           # Spring config (Security, JWT, Flyway)
├── entity/           # JPA entities (MST_*, TRX_*)
├── repository/       # Spring Data JPA repos
├── service/          # Business logic (TDD here)
├── controller/       # REST controllers (@RestController)
├── dto/              # Request/Response DTOs
├── exception/        # Custom exceptions + @ControllerAdvice
├── security/         # JWT filter, UserDetailsService
└── scheduler/        # @Scheduled jobs (point expiry)
```

---

## Coding Conventions

**Entity naming:**
- Master tables: `MST_*` (partners, members, rewards, exchange rates)
- Transaction tables: `TRX_*` (transactions, point balance, audit trail)
- JPA entities: PascalCase without prefix (`Member`, `Partner`, `Transaction`)

**Error handling:**
- All service exceptions extend `LoyaltyException`
- `@ControllerAdvice` catches and maps to error codes (TSD §4)
- Return consistent format: `{status, error, message, code}`

**API conventions:**
- Base URL: `/api/v1`
- Auth endpoints: `/auth/*` (public)
- Resource endpoints: `/members`, `/partners`, `/rewards`, `/transactions`
- Action endpoints: `/exchange`, `/redeem`

**Testing:**
- Service tests: `@ExtendWith(MockitoExtension.class)`, mock repos
- Controller tests: `@WebMvcTest`, mock services
- Integration tests: optional, use Testcontainers if time permits

**Frontend:**
- Route structure: `/dashboard`, `/rewards`, `/exchange`, `/redeem`, `/history`, `/admin`
- Auth guard: `middleware.ts` at root
- API client: axios with JWT injection interceptor
- State: React Query for server state, localStorage for JWT

---

## What NOT to Do

1. **NO `findAll()` without pagination** — OOM risk at scale
2. **NO hardcoded secrets** — use `.env` for all credentials
3. **NO `@Transactional` on controller methods** — only on service layer
4. **NO manual balance calculation** — always SUM from transactions or use cached balance
5. **NO raw SQL in services** — use JPA except for bulk operations (partner creation)
6. **NO session cookies** — JWT only for all authentication
7. **NO partnerId on member registration** — members are platform-wide
8. **NO skipping audit trail** — all writes must log to `TRX_AUDIT_TRAIL`
9. **NO modifying specs during implementation** — specs are locked, raise issues if conflicts found
10. **NO placeholder bcrypt hash in production** — regenerate with BCryptPasswordEncoder

---

## API Authorization Matrix (Summary)

| Endpoint | Public | MEMBER | ADMIN | PARTNER | Notes |
|----------|--------|--------|-------|---------|-------|
| `POST /auth/register` | ✓ | — | — | — | Returns JWT + member (auto-login) |
| `POST /auth/login` | ✓ | — | — | — | Returns JWT + role |
| `POST /auth/partner/token` | ✓ | — | — | — | Validates apiKey, returns PARTNER JWT |
| `POST /transactions` | ✓ | — | — | — | Simulated partner call — no auth in MVP (FSD §7.6) |
| `GET /members` | — | — | ✓ | — | Supports `?status=ACTIVE\|INACTIVE` |
| `GET /members/{id}` | — | ✓ (own) | ✓ (any) | — | — |
| `PUT /members/{id}` | — | — | ✓ | — | Update name/phone/status |
| `PUT /members/{id}/status` | — | — | ✓ | — | Toggle ACTIVE/INACTIVE |
| `GET /members/{id}/points` | — | ✓ (own) | — | — | Privacy: admin blocked |
| `GET /members/{id}/transactions` | — | ✓ (own) | — | — | Privacy: admin blocked |
| `POST /exchange` | — | ✓ | — | — | — |
| `POST /redeem` | — | ✓ | ✓ | — | — |
| `GET /rewards` | — | ✓ | ✓ | — | Supports `?partnerId={id}` |
| `GET /partners` | — | ✓ | ✓ | — | — |
| `POST /partners` | — | — | ✓ | — | Bulk-inits balances for existing members |
| `PUT /partners/{id}` | — | — | ✓ | — | Update partner config |

**Privacy:** Admin can manage member profiles but cannot view point balances or transaction history.

Full matrix: TSD.md §4

---

## Branching Strategy

Per-feature branches off `main`. Each branch = 1 endpoint or 1 logical feature. Max lifespan 1 day.

**Naming:** `feat/<thing>`, `fix/<thing>`, `chore/<thing>`

**Example branches:**
```
feat/auth-register
feat/auth-login
feat/flyway-schema
feat/entities-all
feat/member-earn-points
feat/member-exchange-points
feat/member-redeem-reward
feat/member-point-expiry-scheduler
feat/admin-partner-create
feat/admin-member-list
feat/frontend-auth
feat/frontend-dashboard
feat/frontend-rewards
feat/frontend-exchange
feat/frontend-history
feat/frontend-admin
```

**Rules:**
- No direct push to `main`
- Open PR when done → teammate reviews (lightweight: does it work? any obvious bug? follows conventions?)
- Merge → delete branch
- Commit convention: `feat(earn): POST /transactions earn points`, `fix(auth): token expiry`, `chore(db): V2 seed partners`

## Implementation Phases (reference)

1. **Infrastructure** — Spring Boot scaffold, Flyway migrations, Docker Compose, Next.js init — **DONE**
2. **Backend Core** — Entities, repos, JWT auth, services (TDD)
3. **Business Logic** — EARN, expiry scheduler, exchange, redemption (TDD)
4. **Frontend** — Auth pages, member screens 2-6, admin CMS screens 7-8
5. **Integration** — E2E smoke test, FSD/TSD updates

---

## Known Constraints

- **Deadline:** July 14, 2026 — 11 days remaining
- **Scope:** 93 story points across 6 use cases (aggressive for 2-person team)
- **No Jira** — using plan file + commit messages for tracking
- **Seed data bcrypt hash** — placeholder used, regenerate before deployment
- **No WCAG compliance audit** — accessibility is best-effort, not formally validated
- **MVP scope** — membership tiers, point transfer between members, dashboard analytics deferred to post-MVP

**Production Readiness:**
- Core architecture is production-capable (JWT, optimistic locking, audit trail, TDD)
- Security hardening required before public deployment (rotate secrets, HTTPS, rate limiting)
- Performance testing pending (load test, stress test)
- This is apprenticeship work presented to higher-ups — code quality matters

---

## Questions / Issues

If specs conflict or requirements unclear:
1. Check TSD.md §4 (API spec) and plan file (`.hermes/plans/`)
2. Refer to FSD.md §7 (assumptions & decisions)
3. Raise in team chat — do NOT make unilateral spec changes

For implementation blockers:
- Check `docs/seed-data.sql` for demo credentials
- Review ERD in `erd.md` for table relationships
- Check BPMN Level 3 flows in `bpmn.md` for transaction boundaries

---

**Last updated:** 2026-07-07
**Spec version:** 1.0 (locked for implementation)
