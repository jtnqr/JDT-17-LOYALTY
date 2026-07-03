# Functional Specification Document (FSD)
## JDT-17-LOYALTY — Loyalty Points Platform
**Version:** 1.0  
**Date:** 2 July 2026  
**Deadline:** 14 July 2026  
**Author:** Business/System Analyst (AI-assisted)  
**Source of Truth:** `README.md` in this repository

---

## 1. Overview

JDT-17-LOYALTY is a bootcamp mini-case project that implements a **points-based loyalty platform**. The platform acts as a central loyalty hub that manages points earned through third-party partner transactions (KFC and McDonald's), allows members to redeem points for rewards, and enables point exchange between partners.

This document covers **requirements 1–5** as scoped for the 14 July 2026 deadline.

---

## 2. Scope

### 2.1 In Scope (Must Have)

| # | Feature | Description |
|---|---------|-------------|
| 1 | **Member Registration** | Register a new loyalty member; no input validation required |
| 2 | **Partner Master** | Add and manage partner data; supports dynamic partner addition |
| 3 | **Point Balance & Accumulation** | View member point balance; accumulate points from simulated partner transactions |
| 4 | **Point Expiry** | Expire points via a scheduled job for points past their expiry date |
| 5 | **Point Exchange** | Exchange points between partners (KFC ↔ McDonald's) at a configurable rate |
| 6 | **Point Redemption** | Redeem points for rewards from the catalog; balance validation only (no stock check) |
| + | **JWT Authentication** | JWT for all actors: Member, Admin, and Partner API calls |
| + | **Transaction History** | View member transaction and exchange history |
| + | **Audit Trail** | Log all significant system events (registration, earn, redeem, exchange, expiry, partner creation) |
| + | **Unit Testing** | Unit tests covering core business logic |
| + | **Web UI** | Mobile-first member app (6 screens) + desktop admin CMS (2 screens) built with Next.js 16 |

### 2.2 Out of Scope / Future

The following are recognized but **not implemented** in this MVP:

- **Membership Tiering** (Bronze/Silver/Gold) — tier upgrade logic and tier-based benefits
- **Dashboard Summary** (`GET /dashboard`) — aggregate statistics for CMS admin
- **Transfer Point Between Members** — peer-to-peer point gifting
- **Admin UI for Exchange Rate Management** — the rate is configurable in DB/config but no UI CRUD is built

---

## 3. Actors & Roles

| Actor | Description |
|-------|-------------|
| **Member** | A registered loyalty program member who earns, redeems, and exchanges points via the platform API or a future front-end. |
| **CMS Admin** | An internal operator who can view member profiles, edit member data, and change member status (active/inactive) via the CMS. A single admin role is assumed (see Assumptions §7). |
| **Partner System** | A simulated third-party system (KFC or McDonald's) that submits transaction events to trigger point accumulation. In MVP, this is simulated by a direct `POST /transactions` API call with dummy data. |

---

## 4. Use Cases

### UC-01: Member Registration

**Actor:** Member (or CMS Admin on behalf of member)  
**Pre-conditions:** None  
**Trigger:** Member submits registration data

**Main Flow:**
1. Actor calls `POST /auth/register` with name, email, phone, and password.
2. System generates a unique internal member ID.
3. System creates a point balance record (balance = 0) for each active partner.
4. System writes an audit trail event: `MEMBER_REGISTERED`.
5. System returns a JWT token and the created member object.

**Post-conditions:** Member record exists in the system; point balance initialized to 0.  
**Exceptions:** None (no input validation required per scope).

---

### UC-02: Partner Master Management

**Actor:** CMS Admin  
**Pre-conditions:** Admin is authenticated via JWT.  
**Trigger:** Admin queries partner list or creates a new partner.

**Main Flow (View):**
1. Admin calls `GET /partners` to retrieve the list of registered partners.
2. System returns partner ID, name, point conversion rate, and status.

**Main Flow (Create):**
1. Admin calls `POST /partners` with name, code, and points conversion rate.
2. System creates a new partner record.
3. System initializes empty point balances for all existing members for the new partner.
4. System writes an audit trail event: `PARTNER_CREATED`.

**Post-conditions:** New partner is created, or admin can see all active partners.

---

### UC-03: Point Accumulation (via Partner Transaction)

**Actor:** Partner System (simulated)  
**Pre-conditions:** Member exists; Partner exists and is active  
**Trigger:** A `POST /transactions` call is made with member identifier (phone or email), partner, and transaction amount

**Main Flow:**
1. Partner System calls `POST /transactions` with `memberIdentifier`, `partner`, and `trxAmount`.
2. System resolves the member using the provided identifier (lookup by phone or email).
3. System validates that the member exists and the partner is active.
4. System calculates points earned using the conversion formula (see Business Rules §5.1).
5. System credits the member's point balance for the given partner.
6. System creates a transaction record (type: `EARN`).
7. System writes an audit trail event: `POINTS_EARNED`.
8. System returns the transaction record including points awarded.

**Post-conditions:** Member's point balance is increased; transaction record created.  
**Exceptions:** Member not found → `404`; Partner not found or inactive → `404`/`400`.

---

### UC-04: Point Expiry (Background Process)

**Actor:** System Scheduler  
**Pre-conditions:** `EARN` transactions exist with an `expiresAt` date in the past.  
**Trigger:** Scheduled job runs daily.

**Main Flow:**
1. System queries all `EARN` transactions where `expiresAt <= now()` and points have not been fully consumed/expired.
2. For each applicable transaction, system calculates remaining unexpired points.
3. System deducts the expired points from the member's partner point balance.
4. System creates a transaction record (type: `EXPIRED`).
5. System writes an audit trail event: `POINT_EXPIRED`.

**Post-conditions:** Member's point balance is reduced by the expired amount; expired transactions are logged.

---

### UC-05: Point Exchange Between Partners

**Actor:** Member  
**Pre-conditions:** Member exists; both source and target partners are active; exchange rate is configured; member has sufficient source-partner balance  
**Trigger:** Member calls `POST /exchange`

**Main Flow:**
1. Member calls `POST /exchange` with `memberId`, `fromPartnerId`, `toPartnerId`, and `points`.
2. System looks up the exchange rate between `fromPartner` → `toPartner` from the ExchangeRate table.
3. System checks the member's balance for `fromPartner`.
4. If balance ≥ requested points:
   - Deduct `points` from `fromPartner` balance.
   - Calculate target points = `points × exchangeRate`.
   - Credit target points to `toPartner` balance.
   - Create two transaction records (type: `EXCHANGE_OUT` and `EXCHANGE_IN`).
5. System writes an audit trail event: `POINTS_EXCHANGED`.
6. System returns confirmation with both updated balances.

**Post-conditions:** Source partner balance decreased; target partner balance increased; exchange logged.  
**Exceptions:**
- Member not found → `404`
- Partner not found or inactive → `404`
- Exchange rate not configured → `404`
- Insufficient balance → `400`

---



---

### UC-07: View Transaction History

**Actor:** Member  
**Pre-conditions:** Member exists  
**Trigger:** Caller queries `GET /members/{id}/transactions`

**Main Flow:**
1. Caller provides member ID.
2. System returns paginated list of all transaction records (EARN, EXCHANGE_IN, EXCHANGE_OUT, EXPIRED) for that member, sorted by date descending.

**Post-conditions:** Transaction history displayed.

---

### UC-08: View Point Balance

**Actor:** Member  
**Pre-conditions:** Member exists  
**Trigger:** Caller queries `GET /members/{id}/points`

**Main Flow:**
1. Caller provides member ID.
2. System returns point balances broken down by partner.

**Post-conditions:** Current balances returned.

---

## 5. Business Rules

### 5.1 Point Accumulation Formula

> **⚠️ ASSUMPTION — easy to override**
>
> The README does not specify a conversion rate. The following is a proposed default:
>
> **1 point earned per every IDR 1,000 of transaction amount** (integer division, no rounding up).
>
> Formula: `pointsEarned = floor(trxAmount / 1000)`
>
> Example: A KFC transaction of IDR 150,000 earns `floor(150000 / 1000) = 150` points.
>
> This rate is stored as a configurable field (`pointsPerThousandIDR`) on the `Partner` table, defaulting to `1`. Changing the per-partner rate does not retroactively recalculate existing balances.

### 5.2 Exchange Rate Rules

- Exchange rates are **bidirectional but not symmetric** — the rate from KFC→McD and McD→KFC are stored as separate records in the `ExchangeRate` table.
- The default seeded rates:
  - KFC → McDonald's: **1 KFC point = 0.8 McD points** (as noted in README)
  - McDonald's → KFC: **1 McD point = 1.25 KFC points** (proposed symmetric inverse)
- Rates are stored in the DB and can be updated directly (no admin API in MVP).
- Resulting target points are **floor-rounded** to avoid fractional points.
- Formula: `targetPoints = floor(sourcePoints × exchangeRate)`

### 5.3 Point Expiry Rules

- Points earned have an expiration date (e.g., 1 year from the earn date).
- Expiry is processed by a background job that deducts the appropriate amount from the member's balance.
- A transaction of type `EXPIRED` is logged to reflect the point deduction.

### 5.4 Member Status

- A member can be `ACTIVE` or `INACTIVE`.
- `INACTIVE` members cannot earn, redeem, or exchange points.
- Status can be changed by a CMS Admin.

---

## 6. CMS Features

| Feature | Description |
|---------|-------------|
| View Member | List/search members; view individual member profile |
| Edit Member | Update member name, phone, email, status |
| Member Status | Toggle ACTIVE / INACTIVE |

CMS features are exposed as admin-facing API endpoints (see TSD for details). A minimal single-admin-role security model is assumed (§7.5).

---

## 7. Assumptions & Open Questions

The following items are **not specified in the README**. Each is given a reasonable default assumption for MVP. They should be explicitly reviewed and confirmed or overridden before final implementation.

### 7.1 Member Identity Across Partners

**Question:** Does a member have a single internal ID used for both KFC and McD, or does each partner assign its own member ID linked to the internal member?

**Assumption:** A **single internal member ID** (e.g., `M001`) is used by the loyalty platform. Partner-specific member identifiers are not modelled in MVP. Dummy transactions reference only the internal member ID. Point balances are tracked **per member per partner** within the loyalty system itself — not via a partner-side member mapping.

*Override: If partners send their own member references, a `PartnerMember` mapping table (partnerMemberId → internalMemberId) must be added.*

---

### 7.2 Dummy Transaction Data Source

**Question:** Are dummy transactions pre-seeded in the database, or submitted via an API call that simulates a partner webhook?

**Assumption:** Dummy transactions are **submitted via API** (`POST /transactions`) with manually crafted payloads. This is simpler to demo, allows interactive testing, and aligns with the API-first requirement. No automatic seeding of transaction history is done, but seed scripts may insert a handful of sample transactions for demo purposes.

*Override: If a webhook simulation is required, a `POST /partner-webhook/simulate` endpoint can be added that generates multiple dummy transactions for a given partner.*

---

### 7.3 Point Expiry

**Question:** Do points expire? The README says "possible for point."

**Assumption:** **Yes.** Points expire based on the `expiresAt` date set when they are earned. A daily background job calculates and deducts expired points. 

---

### 7.4 Authentication Strategy

**Question:** How are endpoints secured?

**Decision:** JWT authentication for all actors:
- **Members:** Obtain JWT via `POST /auth/register` or `POST /auth/login`. Role claim = `MEMBER`.
- **Admin:** Obtain JWT via `POST /auth/login` (email/password). Role claim = `ADMIN`.
- **Partners:** Obtain JWT via `POST /auth/partner/token` (API key validation). Role claim = `PARTNER`.

All secured endpoints validate JWT and check role claim. Frontend (Next.js) stores JWT in localStorage and includes it in `Authorization: Bearer <token>` header.

---

## 8. Glossary

| Term | Definition |
|------|------------|
| Points | The unit of loyalty currency managed by this platform |
| Partner | A third-party merchant (KFC, McDonald's) whose transactions generate points |
| Exchange | Conversion of points from one partner's balance to another |
| Audit Trail | A tamper-evident log of every significant action in the system |
| Dummy Data | Manually injected or seeded test data used to simulate real transactions in MVP |
| CMS | Content Management System — the internal admin interface |
