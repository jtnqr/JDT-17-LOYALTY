# Kanban Board - PISTOS Loyalty App

## Legend
- 🔴 Backlog
- 🟡 In Progress
- 🟢 Completed

---

## 1. Backend Core & Infrastructure
- [e2e] Scaffold & config (Spring Boot + PostgreSQL + Flyway) 🟢
- [V1-V5] DB Schemas & seed data 🟢
- [V6] `phone` unique constraint migration 🟢
- [JWT] JWT auth security configurations & filters 🟢

## 2. Member & Auth Logic
- `POST /auth/register` (Register member + JWT response) 🟢
- `POST /auth/login` (Member / Admin login checks) 🟢
- `POST /auth/partner/token` (Partner API key auth) 🟢
- `GET /members` (Admin list paginated members) 🟢
- `GET /members/{id}` (Get member profiles) 🟢
- `PUT /members/{id}` (Admin update member status & profile) 🟢
- `GET /members/{id}/points` (Get point balances across active partners) 🟢
- `GET /members/{id}/transactions` (Get transaction history) 🔴
- `POST /exchange` (Exchange points McD <-> KFC) 🔴
- `POST /redeem` (Redeem points for partner rewards) 🔴

## 3. Partner & Rates
- `GET /partners` (List partners) 🟢
- `POST /partners` (Add partner + bulk init zero point balances) 🔴
- `PUT /partners/{id}` (Admin update partner configs) 🔴
- `GET /exchange-rates` (List directional exchange rates) 🔴
- `POST /exchange-rates` (Admin add new exchange rates) 🔴
- `POST /transactions` (Partner earns points for transactions) 🔴

## 4. System Cron & Auditing
- Point Expiry Scheduler (Daily at 17:00 UTC / 00:00 WIB) 🔴
- AuditTrailService logging linked to transactional operations 🟢

## 5. Frontend (Next.js 16)
- Login / Register UI 🟢
- Dashboard UI (Points list + basic navigation) 🟢
- Exchange page UI (Conversion preview + validations) 🟢
- Rewards catalog UI (Reward lists + details modal) 🟢
- Admin CMS member list UI 🟢
- History page UI (Filter & groups transaction history) 🟢
- Integration: E2E smoke tests and actual API wiring 🔴
