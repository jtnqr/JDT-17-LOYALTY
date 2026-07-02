# JDT-17-LOYALTY — Use Cases

**Version:** 1.0  
**Date:** 2026-07-02  
**Source:** Functional Specification Document (FSD.md)

---

## Quick Index

| Use Case | Title | Description |
|----------|-------|-------------|
| [UC-01](#uc-01-member-registration) | Member Registration | Register a new loyalty member and initialize point balances for all active partners |
| [UC-02](#uc-02-partner-master-management) | Partner Master Management | Retrieve the list of registered loyalty partners with their configuration |
| [UC-03](#uc-03-point-accumulation) | Point Accumulation | Earn points from a purchase transaction at a participating partner |
| [UC-04](#uc-04-point-redemption) | Point Redemption | Redeem accumulated points for a reward from the catalog |
| [UC-05](#uc-05-point-exchange-between-partners) | Point Exchange Between Partners | Convert points from one partner balance to another using a configured exchange rate |
| [UC-06](#uc-06-view-reward-catalog) | View Reward Catalog | Browse available rewards, optionally filtered by partner |
| [UC-07](#uc-07-view-transaction-history) | View Transaction History | Retrieve paginated transaction history for a member |
| [UC-08](#uc-08-view-point-balance) | View Point Balance | Retrieve a member's current point balances across all partners |

---

## UC-01: Member Registration

| Field | Detail |
|-------|--------|
| **Actor** | Member (self-registration) or CMS Admin |
| **Trigger** | `POST /members` called with `name`, `email`, `phone` |
| **Pre-conditions** | None — no existing member or session required |
| **Post-conditions** | Member record exists in DB; a `POINT_BALANCE` row with `balance = 0` is created for every currently ACTIVE partner; an `AUDIT_TRAIL` event of type `MEMBER_REGISTERED` is persisted |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Caller | Sends `POST /members` with JSON body `{ name, email, phone }` |
| 2 | System | Generates a unique `memberId` (UUID or auto-increment per implementation) |
| 3 | System | Persists a new `MEMBER` record with status `ACTIVE` |
| 4 | System | Queries all partners where `status = ACTIVE` |
| 5 | System | Inserts a `POINT_BALANCE` row (`memberId`, `partnerId`, `balance = 0`) for each active partner |
| 6 | System | Inserts an `AUDIT_TRAIL` record with event type `MEMBER_REGISTERED` and the new `memberId` |
| 7 | System | Returns `201 Created` with the newly created member object |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| *(No validation in MVP)* | — | No error flows defined; all input is accepted as-is |

### Business Rules Applied

- **BR-1:** Every new member starts with a `balance = 0` for each active partner — not on-demand.
- **BR-2:** Balance initialization is scoped to partners that are `ACTIVE` at the moment of registration; partners added later require a separate migration/seed step.
- **BR-3:** The `MEMBER_REGISTERED` audit event is written in the same unit of work as balance initialization to maintain consistency.

### API Mapping

- **Request:** `POST /members`
- **Request Body:** `{ "name": "string", "email": "string", "phone": "string" }`
- **Success Response:** `201 Created` — member object `{ memberId, name, email, phone, status }`
- **Error Responses:** None defined in MVP

---

## UC-02: Partner Master Management

| Field | Detail |
|-------|--------|
| **Actor** | CMS Admin |
| **Trigger** | `GET /partners` |
| **Pre-conditions** | At least two partners (KFC, McDonald's) have been seeded into the database via Flyway migration |
| **Post-conditions** | Admin receives the current partner list; no data is mutated |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | CMS Admin | Sends `GET /partners` |
| 2 | System | Queries the `PARTNER` table for all records |
| 3 | System | Returns `200 OK` with an array of partner objects containing `name`, `pointRate`, `status` |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| No partners seeded | 2 | Returns `200 OK` with an empty array `[]` |

### Business Rules Applied

- **BR-1:** Partner master data is read-only via API in MVP; creation and modification are handled exclusively through Flyway DB migrations.
- **BR-2:** Both `ACTIVE` and `INACTIVE` partners are returned; consumers must filter by `status` if needed.
- **BR-3:** `pointRate` is the earn rate used in UC-03 (points per 1,000 currency units). Default rate: 1 point per 1,000.

### API Mapping

- **Request:** `GET /partners`
- **Success Response:** `200 OK` — array of `{ partnerId, name, pointRate, status }`
- **Error Responses:** None defined

---

## UC-03: Point Accumulation

| Field | Detail |
|-------|--------|
| **Actor** | Partner System (simulated via API call) |
| **Trigger** | `POST /transactions` with `memberId`, `partner`, `trxAmount` |
| **Pre-conditions** | Member exists and is `ACTIVE`; partner exists and is `ACTIVE`; `POINT_BALANCE` row for the member–partner pair exists |
| **Post-conditions** | A `TRANSACTION` record of type `EARN` is created; `POINT_BALANCE` for the member–partner pair is incremented by `pointsEarned`; an `AUDIT_TRAIL` record of type `POINTS_EARNED` is persisted |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Partner System | Sends `POST /transactions` with `{ memberId, partner, trxAmount }` |
| 2 | System | Looks up member by `memberId`; verifies member exists |
| 3 | System | Looks up partner by `partner` identifier; verifies partner exists and `status = ACTIVE` |
| 4 | System | Verifies member `status = ACTIVE` |
| 5 | System | Calculates `pointsEarned = floor(trxAmount / 1000)` |
| 6 | System | **BEGIN TRANSACTION** |
| 7 | System | Inserts `TRANSACTION` record: `type = EARN`, `memberId`, `partnerId`, `trxAmount`, `pointsEarned`, `timestamp` |
| 8 | System | Executes `UPDATE POINT_BALANCE SET balance = balance + pointsEarned WHERE memberId = ? AND partnerId = ?` |
| 9 | System | Inserts `AUDIT_TRAIL` record with event type `POINTS_EARNED`, `transactionId`, `memberId`, `pointsEarned` |
| 10 | System | **COMMIT** |
| 11 | System | Returns `201 Created` with transaction details and updated `balance` |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| Member not found | 2 | Return `404 Not Found` — `{ error: "Member not found" }` |
| Partner not found | 3 | Return `404 Not Found` — `{ error: "Partner not found" }` |
| Partner is `INACTIVE` | 3 | Return `404 Not Found` — `{ error: "Partner not active" }` |
| Member is `INACTIVE` | 4 | Return `400 Bad Request` — `{ error: "Member is inactive" }` |
| DB error during transaction | 6–10 | **ROLLBACK**; return `500 Internal Server Error` |

### Business Rules Applied

- **BR-1:** Points formula: `pointsEarned = floor(trxAmount / 1000)`. Fractional results are truncated (floor), not rounded.
- **BR-2:** A `trxAmount` of less than 1,000 earns 0 points; the transaction is still recorded.
- **BR-3:** All three writes (TRANSACTION, POINT_BALANCE update, AUDIT_TRAIL) occur within a single DB transaction — all succeed or all roll back.
- **BR-4:** Only `ACTIVE` partners are eligible to generate earn transactions.
- **BR-5:** Only `ACTIVE` members can earn points.

### API Mapping

- **Request:** `POST /transactions`
- **Request Body:** `{ "memberId": "string", "partner": "string", "trxAmount": number }`
- **Success Response:** `201 Created` — `{ transactionId, type: "EARN", pointsEarned, newBalance }`
- **Error Responses:**
  - `400 Bad Request` — member is inactive
  - `404 Not Found` — member not found; partner not found or inactive

---

## UC-04: Point Redemption

| Field | Detail |
|-------|--------|
| **Actor** | Member |
| **Trigger** | `POST /redeem` with `memberId`, `rewardId` |
| **Pre-conditions** | Member exists; reward exists (seeded via Flyway); member's `POINT_BALANCE` for the reward's partner is >= `reward.pointCost` |
| **Post-conditions** | A `TRANSACTION` record of type `REDEEM` is created; `POINT_BALANCE` for the member–partner pair is decremented by `pointCost`; a `REDEMPTION_LOG` record is persisted; an `AUDIT_TRAIL` record of type `POINTS_REDEEMED` is persisted |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Member | Sends `POST /redeem` with `{ memberId, rewardId }` |
| 2 | System | Looks up reward by `rewardId`; retrieves `pointCost` and `partnerId` |
| 3 | System | Looks up member by `memberId`; verifies member exists |
| 4 | System | Queries `POINT_BALANCE` for `(memberId, reward.partnerId)`; checks `balance >= pointCost` |
| 5 | System | **BEGIN TRANSACTION** |
| 6 | System | Inserts `TRANSACTION` record: `type = REDEEM`, `memberId`, `partnerId`, `pointsUsed = pointCost`, `rewardId`, `timestamp` |
| 7 | System | Executes `UPDATE POINT_BALANCE SET balance = balance - pointCost WHERE memberId = ? AND partnerId = ?` |
| 8 | System | Inserts `REDEMPTION_LOG` record: `memberId`, `rewardId`, `pointCost`, `redeemedAt` |
| 9 | System | Inserts `AUDIT_TRAIL` record with event type `POINTS_REDEEMED`, `transactionId`, `memberId`, `pointCost` |
| 10 | System | **COMMIT** |
| 11 | System | Returns `200 OK` with redemption confirmation and `remainingBalance` |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| Member not found | 3 | Return `404 Not Found` — `{ error: "Member not found" }` |
| Reward not found | 2 | Return `404 Not Found` — `{ error: "Reward not found" }` |
| Insufficient balance | 4 | Return `400 Bad Request` — `{ error: "Insufficient points balance" }` |
| DB error during transaction | 5–10 | **ROLLBACK**; return `500 Internal Server Error` |

### Business Rules Applied

- **BR-1:** Redemption is partner-scoped — a reward belongs to a specific partner, and only that partner's balance is debited.
- **BR-2:** The balance check (`balance >= pointCost`) is performed before the DB transaction begins to provide an early fast-fail; the actual deduction is atomic within the transaction.
- **BR-3:** Reward stock / quantity validation is **out of scope** for MVP — no stock limit is enforced.
- **BR-4:** All four writes (TRANSACTION, POINT_BALANCE update, REDEMPTION_LOG, AUDIT_TRAIL) occur within a single DB transaction.
- **BR-5:** A `REDEMPTION_LOG` record provides a dedicated audit trail for reward fulfillment, separate from the general `AUDIT_TRAIL`.

### API Mapping

- **Request:** `POST /redeem`
- **Request Body:** `{ "memberId": "string", "rewardId": "string" }`
- **Success Response:** `200 OK` — `{ redemptionId, rewardName, pointsUsed, remainingBalance }`
- **Error Responses:**
  - `400 Bad Request` — insufficient points balance
  - `404 Not Found` — member not found; reward not found

---

## UC-05: Point Exchange Between Partners

| Field | Detail |
|-------|--------|
| **Actor** | Member |
| **Trigger** | `POST /exchange` with `memberId`, `fromPartnerId`, `toPartnerId`, `points` |
| **Pre-conditions** | Member exists; both `fromPartner` and `toPartner` exist and are `ACTIVE`; an exchange rate is configured for the `fromPartner -> toPartner` direction; member's balance for `fromPartner` >= `points` |
| **Post-conditions** | A `TRANSACTION(EXCHANGE_OUT)` record is created for the source partner; a linked `TRANSACTION(EXCHANGE_IN)` record is created for the target partner; `POINT_BALANCE` for `fromPartner` is decremented by `points`; `POINT_BALANCE` for `toPartner` is incremented by `targetPoints`; an `AUDIT_TRAIL` record of type `POINTS_EXCHANGED` is persisted |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Member | Sends `POST /exchange` with `{ memberId, fromPartnerId, toPartnerId, points }` |
| 2 | System | Looks up member by `memberId`; verifies member exists and is `ACTIVE` |
| 3 | System | Looks up `fromPartner`; verifies exists and `status = ACTIVE` |
| 4 | System | Looks up `toPartner`; verifies exists and `status = ACTIVE` |
| 5 | System | Queries `EXCHANGE_RATE` table for row `(fromPartnerId, toPartnerId)`; retrieves `rate` |
| 6 | System | Queries `POINT_BALANCE` for `(memberId, fromPartnerId)`; checks `balance >= points` |
| 7 | System | Calculates `targetPoints = floor(points * rate)` |
| 8 | System | **BEGIN TRANSACTION** |
| 9 | System | Inserts `TRANSACTION` record: `type = EXCHANGE_OUT`, `memberId`, `partnerId = fromPartnerId`, `points`, `timestamp` — captures `outTxId` |
| 10 | System | Inserts `TRANSACTION` record: `type = EXCHANGE_IN`, `memberId`, `partnerId = toPartnerId`, `points = targetPoints`, `relatedTxId = outTxId`, `timestamp` |
| 11 | System | Executes `UPDATE POINT_BALANCE SET balance = balance - points WHERE memberId = ? AND partnerId = fromPartnerId` |
| 12 | System | Executes `UPDATE POINT_BALANCE SET balance = balance + targetPoints WHERE memberId = ? AND partnerId = toPartnerId` |
| 13 | System | Inserts `AUDIT_TRAIL` record with event type `POINTS_EXCHANGED`, `outTxId`, `inTxId`, `memberId`, `points`, `targetPoints` |
| 14 | System | **COMMIT** |
| 15 | System | Returns `200 OK` with both updated balances |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| Member not found | 2 | Return `404 Not Found` — `{ error: "Member not found" }` |
| `fromPartner` not found or inactive | 3 | Return `404 Not Found` — `{ error: "Source partner not found or inactive" }` |
| `toPartner` not found or inactive | 4 | Return `404 Not Found` — `{ error: "Target partner not found or inactive" }` |
| Exchange rate not configured | 5 | Return `404 Not Found` — `{ error: "Exchange rate not configured for this partner pair" }` |
| Insufficient balance | 6 | Return `400 Bad Request` — `{ error: "Insufficient points balance" }` |
| DB error during transaction | 8–14 | **ROLLBACK**; return `500 Internal Server Error` |

### Business Rules Applied

- **BR-1:** Exchange rates are directional and asymmetric — `KFC -> McDonald's = 0.8`, `McDonald's -> KFC = 1.25`. The reverse rate is a separate row in `EXCHANGE_RATE`.
- **BR-2:** `targetPoints = floor(points * rate)`. Fractional results are truncated (floor), not rounded.
- **BR-3:** The `EXCHANGE_IN` transaction carries a `relatedTxId` foreign key pointing to the `EXCHANGE_OUT` transaction, linking the two sides of a single exchange operation.
- **BR-4:** All five writes (2x TRANSACTION, 2x POINT_BALANCE update, AUDIT_TRAIL) occur within a single DB transaction — all succeed or all roll back.
- **BR-5:** Exchange rates are stored in the `EXCHANGE_RATE` table and seeded via Flyway. No API to modify them in MVP.
- **BR-6:** `fromPartnerId` and `toPartnerId` must be different; self-exchange is not a valid operation.

### API Mapping

- **Request:** `POST /exchange`
- **Request Body:** `{ "memberId": "string", "fromPartnerId": "string", "toPartnerId": "string", "points": number }`
- **Success Response:** `200 OK` — `{ fromPartnerBalance, toPartnerBalance, pointsExchanged, pointsReceived }`
- **Error Responses:**
  - `400 Bad Request` — insufficient points balance
  - `404 Not Found` — member not found; partner not found or inactive; exchange rate not configured

---

## UC-06: View Reward Catalog

| Field | Detail |
|-------|--------|
| **Actor** | Member |
| **Trigger** | `GET /rewards` (optionally with query param `?partnerId=`) |
| **Pre-conditions** | Rewards have been seeded into the database via Flyway migration |
| **Post-conditions** | Member receives the current reward catalog; no data is mutated |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Member | Sends `GET /rewards` (optionally appending `?partnerId={id}`) |
| 2 | System | If `partnerId` query param is present, filters `REWARD` table by `partnerId`; otherwise returns all rewards |
| 3 | System | Joins with `PARTNER` table to resolve `partnerName` |
| 4 | System | Returns `200 OK` with reward list |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| No rewards match the filter | 2 | Return `200 OK` with an empty array `[]` |
| `partnerId` provided but partner does not exist | 2 | Return `200 OK` with an empty array `[]` (no strict 404 in MVP) |

### Business Rules Applied

- **BR-1:** Reward catalog is read-only via API; creation and modification are handled via Flyway migrations.
- **BR-2:** Each reward record contains `name`, `pointCost`, and `partnerName` (resolved via join).
- **BR-3:** No member context is required — the catalog is public and does not show affordability per member.
- **BR-4:** Filtering by `partnerId` is optional; omitting the parameter returns the full catalog across all partners.

### API Mapping

- **Request:** `GET /rewards?partnerId={partnerId}` (param optional)
- **Success Response:** `200 OK` — array of `{ rewardId, name, pointCost, partnerId, partnerName }`
- **Error Responses:** None defined

---

## UC-07: View Transaction History

| Field | Detail |
|-------|--------|
| **Actor** | Member or CMS Admin |
| **Trigger** | `GET /members/{id}/transactions` |
| **Pre-conditions** | Member identified by `{id}` exists in the system |
| **Post-conditions** | Caller receives a paginated, date-descending list of the member's transactions; no data is mutated |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Caller | Sends `GET /members/{id}/transactions` with optional query params `?page=0&size=10&type=` |
| 2 | System | Looks up member by `{id}`; verifies member exists |
| 3 | System | Queries `TRANSACTION` table filtered by `memberId = {id}` |
| 4 | System | If `type` query param is provided (`EARN`, `REDEEM`, `EXCHANGE_IN`, `EXCHANGE_OUT`), further filters by transaction type |
| 5 | System | Orders results by `timestamp DESC` |
| 6 | System | Applies pagination: `LIMIT size OFFSET (page * size)` |
| 7 | System | Returns `200 OK` with paginated result set and pagination metadata |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| Member not found | 2 | Return `404 Not Found` — `{ error: "Member not found" }` |
| No transactions match filter | 3–4 | Return `200 OK` with empty `content: []` and `totalElements: 0` |
| `page` beyond available data | 6 | Return `200 OK` with empty `content: []` |

### Business Rules Applied

- **BR-1:** Default pagination: `page = 0`, `size = 10` if not specified.
- **BR-2:** Results are always sorted by `timestamp DESC` (most recent first); sort order is not configurable in MVP.
- **BR-3:** Supported filter values for `type`: `EARN`, `REDEEM`, `EXCHANGE_IN`, `EXCHANGE_OUT`. An unrecognized type value returns an empty list (no error).
- **BR-4:** Both the member themselves and a CMS Admin may call this endpoint; no role-based access control is enforced in MVP.
- **BR-5:** `EXCHANGE_IN` and `EXCHANGE_OUT` records for the same exchange operation are returned as separate rows; they are linked via `relatedTxId` for tracing.

### API Mapping

- **Request:** `GET /members/{id}/transactions?page=0&size=10&type=EARN`
- **Query Params:** `page` (default 0), `size` (default 10), `type` (optional — `EARN | REDEEM | EXCHANGE_IN | EXCHANGE_OUT`)
- **Success Response:** `200 OK` — `{ content: [{ transactionId, type, partnerId, points, timestamp, relatedTxId }], page, size, totalElements, totalPages }`
- **Error Responses:**
  - `404 Not Found` — member not found

---

## UC-08: View Point Balance

| Field | Detail |
|-------|--------|
| **Actor** | Member or CMS Admin |
| **Trigger** | `GET /members/{id}/points` |
| **Pre-conditions** | Member identified by `{id}` exists in the system; `POINT_BALANCE` rows have been initialized (during UC-01 registration) |
| **Post-conditions** | Caller receives the current point balances for all partners; no data is mutated |

### Main Flow

| Step | Actor | Action |
|------|-------|--------|
| 1 | Caller | Sends `GET /members/{id}/points` |
| 2 | System | Looks up member by `{id}`; verifies member exists |
| 3 | System | Queries `POINT_BALANCE` table for all rows where `memberId = {id}` |
| 4 | System | Joins with `PARTNER` table to resolve `partnerName` for each balance row |
| 5 | System | Returns `200 OK` with an array of per-partner balances |

### Alternate / Error Flows

| Condition | Step | Response |
|-----------|------|----------|
| Member not found | 2 | Return `404 Not Found` — `{ error: "Member not found" }` |
| No balance rows exist (edge case) | 3 | Return `200 OK` with an empty array `[]` |

### Business Rules Applied

- **BR-1:** One balance row per active partner is created at member registration (UC-01); this endpoint reflects the current state of those rows.
- **BR-2:** Balances are returned for **all** partners for which a `POINT_BALANCE` row exists — including partners that may have since become `INACTIVE`.
- **BR-3:** Both the member themselves and a CMS Admin may call this endpoint; no role-based access control is enforced in MVP.
- **BR-4:** Balance values reflect the real-time state of the `POINT_BALANCE` table — no caching layer in MVP.

### API Mapping

- **Request:** `GET /members/{id}/points`
- **Success Response:** `200 OK` — array of `{ partnerId, partnerName, balance }`
- **Error Responses:**
  - `404 Not Found` — member not found
