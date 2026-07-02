# JDT-17-LOYALTY — Jira Backlog

> **Version:** 1.0.0 | **Date:** 2026-07-02 | **Project:** Loyalty Bootcamp (KFC & McDonald's) | **Scope:** MVP / Bootcamp Deliverable

---

## Summary Table

| # | Epic | Stories | Total SP |
|---|------|---------|----------|
| 1 | Member Management | 4 | 13 |
| 2 | Partner Master | 2 | 4 |
| 3 | Point Accumulation | 3 | 10 |
| 4 | Point Redemption | 3 | 10 |
| 5 | Point Exchange | 3 | 11 |
| 6 | Reward Catalog | 2 | 5 |
| 7 | Transaction History & Point Balance | 3 | 8 |
| 8 | Audit Trail | 3 | 8 |
| 9 | CMS Admin | 4 | 11 |
| 10 | Unit Testing | 4 | 13 |
| — | **Total** | **31** | **93** |

---

## 1. Member Management

### US-01 · Register a New Member

**Title:** As a Member, I want to register an account so that I can start earning loyalty points.

**Description:** Expose `POST /members` to create a new member record with ACTIVE status. No input validation is required for this MVP.

**Acceptance Criteria:**
> - Calling `POST /members` with a JSON body containing `name`, `email`, and `partnerId` returns HTTP 201 with the created member object.
> - The created member has `status = ACTIVE` and an initial `pointBalance = 0`.
> - A `MEMBER_REGISTERED` audit event is written to the audit trail.
> - Duplicate email handling is out of scope for this bootcamp deliverable.
> - Member ID is auto-generated (UUID or sequence).

**Story Points:** 3 | **Priority:** High

---

### US-02 · Retrieve Member by ID

**Title:** As a Member, I want to view my profile so that I can confirm my registration details.

**Description:** Expose `GET /members/{id}` to return a single member's details including current point balance.

**Acceptance Criteria:**
> - `GET /members/{id}` returns HTTP 200 with member object for a valid ID.
> - Response includes `id`, `name`, `email`, `status`, `pointBalance`, and `partnerId`.
> - Returns HTTP 404 with a meaningful error message when the ID does not exist.

**Story Points:** 2 | **Priority:** High

---

### US-03 · List All Members

**Title:** As a CMS Admin, I want to list all members so that I can have an overview of the registered base.

**Description:** Expose `GET /members` to return a paginated or full list of all registered members.

**Acceptance Criteria:**
> - `GET /members` returns HTTP 200 with an array of member objects.
> - Response includes at minimum `id`, `name`, `email`, `status`, and `pointBalance` per member.
> - Returns an empty array (not 404) when no members exist.

**Story Points:** 2 | **Priority:** High

---

### US-04 · Update Member Profile

**Title:** As a CMS Admin, I want to edit a member's profile so that I can correct or update their information.

**Description:** Expose `PUT /members/{id}` to update member fields such as `name` and `email`. A `MEMBER_UPDATED` audit event must be recorded.

**Acceptance Criteria:**
> - `PUT /members/{id}` with a valid body returns HTTP 200 with the updated member object.
> - Only provided fields are updated; unset fields retain their current values.
> - A `MEMBER_UPDATED` event is written to the audit trail upon successful update.
> - Returns HTTP 404 when the member ID does not exist.

**Story Points:** 3 | **Priority:** Med

---

## 2. Partner Master

### US-05 · Seed Partner Data via Flyway

**Title:** As a Partner System, I want partner records for KFC and McDonald's to be pre-seeded so that the system is ready to run without manual setup.

**Description:** Create a Flyway migration script that seeds KFC and McDonald's as partners with their `pointsPerThousandIDR` values.

**Acceptance Criteria:**
> - On application startup, the `partners` table contains at least two rows: KFC and McDonald's.
> - Each partner record includes `id`, `name`, and `pointsPerThousandIDR`.
> - `GET /partners` returns HTTP 200 with both seeded partners.
> - Re-running the migration is idempotent (no duplicate inserts).

**Story Points:** 2 | **Priority:** High

---

### US-06 · Retrieve Partner List

**Title:** As a Member, I want to view available partners so that I know which brands I can earn points with.

**Description:** Expose `GET /partners` to return all active partners in the system.

**Acceptance Criteria:**
> - `GET /partners` returns HTTP 200 with an array of partner objects.
> - Each partner object includes `id`, `name`, and `pointsPerThousandIDR`.
> - Returns an empty array (not 404) when no partners are seeded.

**Story Points:** 2 | **Priority:** Med

---

## 3. Point Accumulation

### US-07 · Earn Points via Transaction Simulation

**Title:** As a Partner System, I want to post a transaction so that the member earns the correct number of loyalty points.

**Description:** Expose `POST /transactions` to simulate a purchase. Points are calculated as `floor(trxAmount / 1000) × pointsPerThousandIDR` and added to the member's balance.

**Acceptance Criteria:**
> - `POST /transactions` with `memberId`, `partnerId`, and `trxAmount` returns HTTP 201 with the transaction record and `pointsEarned`.
> - `pointsEarned` is computed correctly: `floor(trxAmount / 1000) × pointsPerThousandIDR`.
> - Member's `pointBalance` increases by `pointsEarned` after the call.
> - A `POINTS_EARNED` audit event is written to the audit trail.
> - Returns HTTP 400 or HTTP 422 when the member's status is `INACTIVE`.

**Story Points:** 5 | **Priority:** High

---

### US-08 · Prevent Inactive Member from Earning Points

**Title:** As a Partner System, I want the system to reject transactions for inactive members so that only active members accumulate points.

**Description:** Validate member status before processing any transaction. If the member is INACTIVE, return an appropriate error response.

**Acceptance Criteria:**
> - `POST /transactions` for an `INACTIVE` member returns HTTP 422 with an error message.
> - No points are added to the member's balance.
> - No audit event is written for rejected transactions.

**Story Points:** 2 | **Priority:** High

---

### US-09 · Retrieve Member's Point Balance

**Title:** As a Member, I want to check my current point balance so that I know how many points I have available.

**Description:** Expose `GET /members/{id}/points` to return the member's current point balance.

**Acceptance Criteria:**
> - `GET /members/{id}/points` returns HTTP 200 with `memberId` and `pointBalance`.
> - Balance reflects the latest state after all earn, redeem, and exchange operations.
> - Returns HTTP 404 when the member ID does not exist.

**Story Points:** 2 | **Priority:** High

---

## 4. Point Redemption

### US-10 · Redeem Points for a Reward

**Title:** As a Member, I want to redeem my points for a reward so that I get value from my accumulated loyalty points.

**Description:** Expose `POST /redeem` to deduct points from a member's balance for a chosen reward. No stock validation is required.

**Acceptance Criteria:**
> - `POST /redeem` with `memberId` and `rewardId` returns HTTP 200 with a redemption confirmation.
> - Member's `pointBalance` is reduced by the reward's `pointCost`.
> - A `POINTS_REDEEMED` audit event is written to the audit trail.
> - Returns HTTP 422 when the member has insufficient points.
> - No reward stock check is performed (points-only deduction).

**Story Points:** 5 | **Priority:** High

---

### US-11 · Prevent Insufficient Balance Redemption

**Title:** As a Member, I want to be prevented from redeeming points I don't have so that my balance is never negative.

**Description:** Before processing a redemption, check that the member's `pointBalance >= reward.pointCost`. Reject if not.

**Acceptance Criteria:**
> - `POST /redeem` returns HTTP 422 when `pointBalance < pointCost`.
> - The member's balance remains unchanged on rejection.
> - The error response includes a descriptive message (e.g., "Insufficient points").

**Story Points:** 2 | **Priority:** High

---

### US-12 · Prevent Inactive Member from Redeeming

**Title:** As a Partner System, I want the system to reject redemptions for inactive members so that deactivated accounts cannot use their points.

**Description:** Validate member status before processing any redemption request.

**Acceptance Criteria:**
> - `POST /redeem` for an `INACTIVE` member returns HTTP 422 with an error message.
> - No points are deducted from the member's balance.
> - No `POINTS_REDEEMED` audit event is written.

**Story Points:** 2 | **Priority:** High

---

## 5. Point Exchange

### US-13 · Exchange Points Between Partners

**Title:** As a Member, I want to exchange my KFC points for McDonald's points (or vice versa) so that I can consolidate my loyalty points.

**Description:** Expose `POST /exchange` to convert points from a source partner to a target partner using the configurable exchange rate stored in the DB.

**Acceptance Criteria:**
> - `POST /exchange` with `memberId`, `sourcePartnerId`, `targetPartnerId`, and `sourcePoints` returns HTTP 200 with a confirmation.
> - `targetPoints = floor(sourcePoints × exchangeRate)` using the rate from the DB.
> - Source partner balance decreases by `sourcePoints`; target partner balance increases by `targetPoints`.
> - A `POINTS_EXCHANGED` audit event is written.
> - Returns HTTP 422 for insufficient source balance.

**Story Points:** 5 | **Priority:** High

---

### US-14 · Seed Exchange Rates via Flyway

**Title:** As a Partner System, I want KFC↔McDonald's exchange rates to be pre-seeded so that exchanges can happen without manual DB configuration.

**Description:** Create a Flyway migration that seeds exchange rates: KFC→McD = 0.8, McD→KFC = 1.25 in the `exchange_rates` table.

**Acceptance Criteria:**
> - On startup, `exchange_rates` table contains at minimum two rows: KFC→McD and McD→KFC.
> - Rates are stored as configurable DB values, not hardcoded in Java.
> - Exchange API reads rates from the DB at runtime.

**Story Points:** 2 | **Priority:** High

---

### US-15 · Prevent Inactive Member from Exchanging

**Title:** As a Partner System, I want the system to reject exchanges for inactive members so that deactivated accounts cannot transfer points.

**Description:** Validate member status before processing any exchange request.

**Acceptance Criteria:**
> - `POST /exchange` for an `INACTIVE` member returns HTTP 422 with an error message.
> - Neither source nor target partner balance is modified.
> - No `POINTS_EXCHANGED` audit event is written.

**Story Points:** 2 | **Priority:** High

---

## 6. Reward Catalog

### US-16 · Seed Reward Catalog via Flyway

**Title:** As a Member, I want dummy rewards to be pre-seeded so that I can test the redemption flow without manual data entry.

**Description:** Create a Flyway migration that seeds at least 3–5 dummy reward records with `name`, `pointCost`, and `partnerId`.

**Acceptance Criteria:**
> - On startup, the `rewards` table contains at least 3 dummy rewards across KFC and McDonald's.
> - Each reward includes `id`, `name`, `pointCost`, and `partnerId`.
> - `GET /rewards` returns HTTP 200 with the seeded rewards.

**Story Points:** 2 | **Priority:** Med

---

### US-17 · Retrieve Reward Catalog

**Title:** As a Member, I want to browse the available rewards so that I can decide what to redeem my points for.

**Description:** Expose `GET /rewards` to return all available reward items from the catalog.

**Acceptance Criteria:**
> - `GET /rewards` returns HTTP 200 with an array of reward objects.
> - Each reward includes `id`, `name`, `pointCost`, and `partnerId`.
> - Returns an empty array (not 404) when no rewards are seeded.

**Story Points:** 2 | **Priority:** Med

---

## 7. Transaction History & Point Balance

### US-18 · View Transaction History

**Title:** As a Member, I want to view my transaction history so that I can track all my earning and redemption activity.

**Description:** Expose `GET /members/{id}/transactions` to return a list of all transactions (earn, redeem, exchange) associated with the member.

**Acceptance Criteria:**
> - `GET /members/{id}/transactions` returns HTTP 200 with an ordered list of transactions (newest first).
> - Each transaction includes `type`, `amount`, `pointsEarned`/`pointsDeducted`, `partnerId`, and `createdAt`.
> - Returns an empty array when the member has no transactions.
> - Returns HTTP 404 when the member ID does not exist.

**Story Points:** 3 | **Priority:** Med

---

### US-19 · Transaction Record Persistence

**Title:** As a Partner System, I want every earn, redeem, and exchange action to be persisted as a transaction record so that history is never lost.

**Description:** Ensure every operation that changes point balance writes a corresponding record to the `transactions` table with full context.

**Acceptance Criteria:**
> - Each `POST /transactions`, `POST /redeem`, and `POST /exchange` call results in at least one new row in the `transactions` table.
> - Each record captures `memberId`, `partnerId`, `type`, `pointsDelta`, and `createdAt`.
> - Rejected operations (e.g., inactive member, insufficient balance) do not persist a transaction record.

**Story Points:** 3 | **Priority:** High

---

### US-20 · Balance Consistency After Operations

**Title:** As a Member, I want my point balance to always reflect the sum of my transactions so that I trust the displayed balance.

**Description:** Ensure the `pointBalance` field on the member record is updated atomically with every transaction within a database transaction.

**Acceptance Criteria:**
> - After any earn/redeem/exchange operation, `GET /members/{id}/points` returns the updated balance.
> - Balance updates and transaction record writes occur in the same DB transaction.
> - A rollback on error leaves both the balance and transaction table unchanged.

**Story Points:** 2 | **Priority:** High

---

## 8. Audit Trail

### US-21 · Audit Member Registration and Update Events

**Title:** As a CMS Admin, I want member registration and update events to be logged in the audit trail so that I have a complete record of account lifecycle changes.

**Description:** Write `MEMBER_REGISTERED` and `MEMBER_UPDATED` events to the `audit_logs` table whenever a member is created or updated.

**Acceptance Criteria:**
> - `POST /members` triggers a `MEMBER_REGISTERED` audit entry with `memberId`, `actorType`, and `timestamp`.
> - `PUT /members/{id}` triggers a `MEMBER_UPDATED` audit entry.
> - Audit entries are written in the same transaction as the main operation.

**Story Points:** 2 | **Priority:** High

---

### US-22 · Audit Point Events

**Title:** As a CMS Admin, I want all point-changing events to be logged so that I can trace every change to a member's balance.

**Description:** Write `POINTS_EARNED`, `POINTS_REDEEMED`, and `POINTS_EXCHANGED` audit events for the respective operations.

**Acceptance Criteria:**
> - Every successful earn records a `POINTS_EARNED` event with `memberId`, `partnerId`, `pointsEarned`, and `timestamp`.
> - Every successful redemption records a `POINTS_REDEEMED` event.
> - Every successful exchange records a `POINTS_EXCHANGED` event with source/target partner and points.
> - Failed/rejected operations do not write audit events.

**Story Points:** 3 | **Priority:** High

---

### US-23 · Audit Member Status Change

**Title:** As a CMS Admin, I want member status changes to be logged in the audit trail so that I can track who was activated or deactivated and when.

**Description:** Write a `MEMBER_STATUS_CHANGED` audit event whenever a member's status transitions between ACTIVE and INACTIVE.

**Acceptance Criteria:**
> - Toggling member status via the CMS endpoint writes a `MEMBER_STATUS_CHANGED` audit entry.
> - Audit entry captures `memberId`, `previousStatus`, `newStatus`, and `timestamp`.
> - Status changes not routed through the CMS toggle (e.g., direct DB changes) are out of scope.

**Story Points:** 2 | **Priority:** Med

---

## 9. CMS Admin

### US-24 · View Member Details (CMS)

**Title:** As a CMS Admin, I want to view the full details of any member so that I can support and manage their account.

**Description:** The CMS leverages `GET /members/{id}` to display complete member information including point balance and status.

**Acceptance Criteria:**
> - `GET /members/{id}` returns all required fields: `id`, `name`, `email`, `status`, `pointBalance`, `partnerId`.
> - Response is consistent whether called from the CMS or the member-facing context.
> - HTTP 404 is returned for unknown member IDs.

**Story Points:** 2 | **Priority:** High

---

### US-25 · Edit Member Information (CMS)

**Title:** As a CMS Admin, I want to edit a member's name and email so that I can keep member data accurate.

**Description:** The CMS uses `PUT /members/{id}` to update member profile fields. A `MEMBER_UPDATED` audit event is written.

**Acceptance Criteria:**
> - `PUT /members/{id}` with updated `name` or `email` returns HTTP 200 with the updated member.
> - Fields not included in the request body remain unchanged (partial update).
> - A `MEMBER_UPDATED` event is recorded in the audit trail.
> - Returns HTTP 404 for unknown member IDs.

**Story Points:** 3 | **Priority:** High

---

### US-26 · Toggle Member Status (CMS)

**Title:** As a CMS Admin, I want to activate or deactivate a member account so that I can control who can use the loyalty platform.

**Description:** Provide a CMS-accessible endpoint (part of `PUT /members/{id}`) to toggle member `status` between ACTIVE and INACTIVE.

**Acceptance Criteria:**
> - Setting `status = INACTIVE` prevents the member from earning, redeeming, or exchanging points immediately.
> - Setting `status = ACTIVE` re-enables the member for all point operations.
> - A `MEMBER_STATUS_CHANGED` audit event is written on every status change.
> - The response reflects the new status.

**Story Points:** 3 | **Priority:** High

---

### US-27 · List Members with Status Filter (CMS)

**Title:** As a CMS Admin, I want to list members filtered by status so that I can quickly identify active or inactive accounts.

**Description:** Extend `GET /members` to accept an optional `status` query parameter for filtering.

**Acceptance Criteria:**
> - `GET /members?status=ACTIVE` returns only active members.
> - `GET /members?status=INACTIVE` returns only inactive members.
> - `GET /members` without the query param returns all members.
> - Returns an empty array (not 404) when no members match the filter.

**Story Points:** 3 | **Priority:** Med

---

## 10. Unit Testing

### US-28 · Unit Tests for Member Service

**Title:** As a Developer, I want unit tests for the Member service so that member registration and profile logic is verified in isolation.

**Description:** Write JUnit 5 + Mockito tests covering `MemberService` methods: create, findById, update, and status toggle.

**Acceptance Criteria:**
> - At least one test per public method in `MemberService`.
> - Tests mock the repository layer using Mockito.
> - Tests cover both happy path and error scenarios (e.g., member not found).
> - All tests pass with `./mvnw test`.

**Story Points:** 3 | **Priority:** High

---

### US-29 · Unit Tests for Transaction / Point Accumulation Service

**Title:** As a Developer, I want unit tests for the transaction service so that points calculation logic is verified.

**Description:** Write JUnit 5 tests for `TransactionService.earn()`, verifying the `floor(trxAmount / 1000) × pointsPerThousandIDR` formula and inactive member rejection.

**Acceptance Criteria:**
> - Tests verify correct `pointsEarned` for various `trxAmount` and `pointsPerThousandIDR` combinations.
> - Test confirms `pointsEarned = 0` when `trxAmount < 1000`.
> - Test confirms an exception/error is thrown for an INACTIVE member.
> - All tests pass with `./mvnw test`.

**Story Points:** 3 | **Priority:** High

---

### US-30 · Unit Tests for Redemption Service

**Title:** As a Developer, I want unit tests for the redemption service so that balance-check and deduction logic is verified.

**Description:** Write JUnit 5 + Mockito tests for `RedemptionService.redeem()`, covering sufficient balance, insufficient balance, and inactive member cases.

**Acceptance Criteria:**
> - Test verifies balance is deducted correctly on a successful redemption.
> - Test verifies an exception is thrown when `pointBalance < pointCost`.
> - Test verifies an exception is thrown for an INACTIVE member.
> - All tests pass with `./mvnw test`.

**Story Points:** 3 | **Priority:** High

---

### US-31 · Unit Tests for Exchange Service

**Title:** As a Developer, I want unit tests for the exchange service so that the exchange rate formula and guard rails are verified.

**Description:** Write JUnit 5 + Mockito tests for `ExchangeService.exchange()`, verifying `floor(sourcePoints × exchangeRate)` and rejection scenarios.

**Acceptance Criteria:**
> - Test verifies `targetPoints` is computed correctly using the seeded exchange rate.
> - Test confirms correct behaviour for both KFC→McD (0.8) and McD→KFC (1.25) directions.
> - Test verifies an exception is thrown for insufficient source balance.
> - Test verifies an exception is thrown for an INACTIVE member.
> - All tests pass with `./mvnw test`.

**Story Points:** 5 | **Priority:** High

---

*Last updated: 2026-07-02 · Author: JDT-17-LOYALTY Bootcamp Team*
