# JDT-17 Loyalty Platform

Multi-partner loyalty points management system supporting point accumulation, redemption, and cross-partner exchange. Developed as part of the Indivara Technology Java Developer Apprenticeship Program (Batch 17).

**Demo:** TBD (post-deployment)  
**Deadline:** July 14, 2026  
**Team:** 2-person development team

---

## Overview

A full-stack loyalty platform enabling members to earn, redeem, and exchange points across multiple partner merchants (KFC, McDonald's pilot). Features include:

- **Member Management** — Self-registration, profile management, balance tracking
- **Point Accumulation** — Partner-driven transaction recording via REST API
- **Point Redemption** — Exchange points for partner rewards
- **Cross-Partner Exchange** — Convert points between merchants (KFC ↔ McD)
- **Point Expiry** — Automated daily scheduler with configurable expiry per partner
- **Admin CMS** — Member management, status control, reporting
- **Audit Trail** — Complete activity logging for compliance

---

## Tech Stack

### Backend
- **Framework:** Spring Boot 4.1.x (Java 21 LTS)
- **Database:** PostgreSQL 18
- **ORM:** JPA / Hibernate
- **Migrations:** Flyway
- **Authentication:** JWT (Spring Security)
- **Testing:** JUnit 5 + Mockito (TDD approach)
- **Build:** Maven

### Frontend
- **Framework:** Next.js 16 (App Router)
- **UI Library:** shadcn/ui + Tailwind CSS
- **State Management:** React Query (TanStack)
- **Language:** TypeScript
- **Build:** Vite

### Infrastructure
- **Deployment:** Docker Compose
- **Orchestration:** docker-compose.yml (PostgreSQL + Backend + Frontend)

---

## Quick Start

### Prerequisites
- Docker Desktop 24.0+
- Node.js 20+ (for local frontend dev)
- Java 21 (for local backend dev)
- Git

### Setup

```bash
# 1. Clone repository
git clone https://github.com/jtnqr/JDT-17-LOYALTY.git
cd JDT-17-LOYALTY

# 2. Configure environment
cp .env.example .env
# Edit .env with:
#   - Strong POSTGRES_PASSWORD
#   - JWT_SECRET (generate with: openssl rand -hex 64)
#   - Partner API keys (e.g. kfc_api_key_2026_secure_demo_only)

chmod 600 .env

# 3. Start services
docker-compose up -d

# 4. Verify migrations (Flyway auto-seeds the DB)
docker-compose logs backend | grep Flyway

# 5. Access services
# Backend API: http://localhost:8080/api/v1
# Frontend: http://localhost:3000
# PostgreSQL: localhost:5432
```

### Default Credentials (Seed Data)

**Admin:**
- Email: `admin@jdt17loyalty.com`
- Password: `Admin123!`

**Test Member:**
- Email: `budi.santoso@example.com`
- Password: `Member123!`

**Partner API Keys:**
- KFC: `kfc_api_key_2026_secure_demo_only`
- McD: `mcd_api_key_2026_secure_demo_only`

⚠️ **Security Note:** Change all default credentials before production deployment.

---

## Architecture

### Database Schema (ERD)

```
MST_MEMBER (members)
MST_PARTNER (KFC, McD)
MST_REWARD (reward catalog)
MST_EXCHANGE_RATE (KFC↔McD rates)
TRX_POINT_BALANCE (balances per member per partner)
TRX_TRANSACTION (EARN | REDEEM | EXCHANGE_IN | EXCHANGE_OUT | EXPIRED)
TRX_AUDIT_TRAIL (compliance logging)
```

See `erd.md` for detailed schema.

### Authentication Flow

1. Member registers via `POST /auth/register` → JWT returned
2. Admin/Member login via `POST /auth/login` → JWT returned
3. Partner requests token via `POST /auth/partner/token` (validates API key) → JWT returned
4. All secured endpoints require `Authorization: Bearer <JWT>`
5. JWT contains role claim (MEMBER | ADMIN | PARTNER) for authorization

### Key Design Decisions

- **Optimistic Locking** — `@Version` on `TRX_POINT_BALANCE` prevents concurrent update race conditions
- **Bulk Balance Initialization** — Native SQL INSERT-SELECT for partner creation (scales to millions of members)
- **EXPIRED Transaction Type** — Point expiry creates visible transaction record (members see why balance decreased)
- **Configurable Expiry** — `expiryDays` per partner, computed at EARN time
- **Partner-Scoped Balances** — One balance row per member per partner (no cross-contamination)

---

## API Documentation

### Base URL
```
http://localhost:8080/api/v1
```

### Authentication Endpoints (Public)

**Register Member**
```http
POST /auth/register
Content-Type: application/json

{
  "name": "Budi Santoso",
  "email": "budi@example.com",
  "phone": "081234567890",
  "password": "SecurePass123!"
}

Response 201:
{
  "token": "eyJhbG...",
  "member": { "id": "...", "name": "Budi Santoso", ... }
}
```

**Login (Member or Admin)**
```http
POST /auth/login
Content-Type: application/json

{
  "email": "budi@example.com",
  "password": "SecurePass123!"
}

Response 200:
{
  "token": "eyJhbG...",
  "role": "MEMBER",
  "user": { ... }
}
```

**Partner Token**
```http
POST /auth/partner/token
Content-Type: application/json

{
  "partnerId": "...",
  "apiKey": "kfc_api_key_2026_..."
}

Response 200:
{
  "token": "eyJhbG...",
  "expiresIn": 3600
}
```

### Full API Specification
See `TSD.md` §4 for complete endpoint documentation, authorization matrix, and error codes.

---

## Development Workflow

### Backend (Spring Boot)

```bash
# Run locally (outside Docker)
cd backend
./mvnw spring-boot:run

# Run tests
./mvnw test

# Build
./mvnw clean package
```

**Package Structure:**
```
com.jdt17.loyalty/
├── config/        # Spring Security, JWT filter
├── entity/        # JPA entities
├── repository/    # Spring Data repos
├── service/       # Business logic (TDD here)
├── controller/    # REST controllers
├── dto/           # Request/Response DTOs
├── exception/     # Custom exceptions
└── scheduler/     # Expiry job
```

### Frontend (Next.js)

```bash
# Run locally
cd frontend
npm install
npm run dev

# Build
npm run build

# Type check
npm run type-check
```

**Route Structure:**
```
app/
├── register/      # Member registration
├── login/         # Login page
├── dashboard/     # Member home
├── rewards/       # Reward catalog
├── redeem/        # Redemption flow
├── exchange/      # Point exchange
├── history/       # Transaction history
└── admin/         # CMS (member list + detail)
```

### Testing Approach

**Backend (TDD):**
- Service layer: `@ExtendWith(MockitoExtension.class)`, mock repositories
- Controller layer: `@WebMvcTest`, mock services
- Write test first (RED), implement (GREEN), refactor
- Target: 80% coverage on service layer

**Frontend:**
- Component tests: React Testing Library
- E2E: Optional (Playwright if time permits)

---

## Deployment

### Docker Compose (Current)

```bash
docker-compose up -d        # Start all services
docker-compose logs -f      # Watch logs
docker-compose down         # Stop all
docker-compose restart      # Restart services
```

### Production Considerations

Before deploying to production:

1. **Security Hardening**
   - Regenerate all bcrypt hashes with strong passwords
   - Generate unique partner API keys
   - Use secure JWT secret (64+ bytes entropy)
   - Enable HTTPS (SSL/TLS termination at load balancer)
   - Configure CORS allowlist (no wildcards)

2. **Database**
   - Use managed PostgreSQL (AWS RDS, GCP Cloud SQL, etc.)
   - Enable automated backups
   - Configure read replicas for high traffic
   - Use connection pooling (PgBouncer)

3. **Application**
   - Set `SPRING_PROFILES_ACTIVE=prod`
   - Configure logging (JSON format, centralized aggregation)
   - Enable Spring Boot Actuator endpoints (`/actuator/health`)
   - Set up monitoring (Prometheus, Grafana)

4. **Frontend**
   - Build optimized production bundle (`npm run build`)
   - Configure CDN for static assets
   - Enable rate limiting on API gateway

---

## Project Structure

```
.
├── AGENTS.md                  # AI agent guidelines (auto-loaded)
├── FSD.md                     # Functional Specification
├── TSD.md                     # Technical Specification
├── README.md                  # This file
├── .env.example               # Environment variables template
├── docker-compose.yml         # Service orchestration
├── .hermes/
│   └── plans/                 # Implementation roadmap
├── activity.diagram.md        # Use case flowcharts
├── usecase.diagram.md         # Actor-use case relationships
├── erd.md                     # Entity relationship diagram
├── bpmn.md                    # Business process flows
├── backend/                   # Spring Boot application
└── frontend/                  # Next.js application
```

---

## Specifications

| Document | Purpose |
|----------|---------|
| `FSD.md` | Functional requirements, business rules, use cases |
| `TSD.md` | Technical design, ERD, API spec, architecture |
| `.hermes/plans/` | Implementation plan (5 phases, task breakdown) |
| `erd.md` | Detailed entity reference with field specs |
| `bpmn.md` | BPMN Level 0-3 process flows |
| `AGENTS.md` | Development guidelines for AI-assisted coding |

---

## Timeline

| Phase | Duration | Deliverables |
|-------|----------|--------------|
| **Phase 1: Infrastructure** | Day 1-2 | Spring Boot scaffold, Flyway migrations, Docker setup, Next.js init |
| **Phase 2: Backend Core** | Day 3-4 | Entities, repositories, JWT authentication, base services |
| **Phase 3: Business Logic** | Day 5-7 | EARN, expiry scheduler, exchange, redemption (TDD) |
| **Phase 4: Frontend** | Day 8-9 | Auth pages, member screens, admin CMS |
| **Phase 5: Integration** | Day 10-11 | E2E testing, bug fixes, FSD/TSD updates |

**Deadline:** July 14, 2026

---

## Deliverables (Apprenticeship Requirements)

- [x] Functional Specification (FSD)
- [x] Technical Specification (TSD)
- [x] Entity Relationship Diagram (ERD)
- [x] Use Cases & Activity Diagrams
- [x] Flow Chart / BPMN
- [x] API Specification
- [ ] Source Code (in progress)
- [ ] Unit Testing (TDD approach)
- [ ] Audit Trail Implementation
- [ ] Presentation Materials

---

## Known Limitations (MVP Scope)

- **No membership tiering** (Bronze/Silver/Gold) — out of scope for July 14 deadline
- **No point transfer between members** — exchange is partner-to-partner only
- **No stock management for rewards** — balance validation only
- **No WCAG compliance audit** — accessibility is best-effort
- **No load testing** — performance validation pending

These features are documented as future enhancements in `FSD.md` §2.2.

---

## Team

**Development Team:**
- [Your Name] — Backend & Infrastructure
- [Teammate Name] — Frontend & Integration

**Program:** Indivara Technology Java Developer Apprenticeship (Batch 17)  
**Mentor:** [Mentor Name]

---

## License

Proprietary — Indivara Technology Apprenticeship Project

---

## Contact

For questions or issues, contact:
- **Email:** [your-email]
- **Repository:** https://github.com/jtnqr/JDT-17-LOYALTY
- **Issue Tracker:** https://github.com/jtnqr/JDT-17-LOYALTY/issues
