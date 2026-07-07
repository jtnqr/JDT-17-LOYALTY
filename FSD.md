# Functional Specification Document (FSD)
# PISTOS – Loyalty App

**Version:** 1.0.0
**Created By:** Verry Kurniawan
**Created Date:** 03/07/2026
**Project:** PISTOS (Points Integration System for Transaction-Originated Services)

---

## Revision History

| Version | Amendment | Updated By | Date |
|---------|-----------|------------|------|
| 1.0.0 | Initial Draft | Verry Kurniawan | 03/07/2026 |

---

## Glossary

| Item | Description |
|------|-------------|
| Points | The unit of loyalty currency managed by this platform |
| Partner | A third-party merchant (KFC, McDonald's) whose transactions generate points |
| Redemption | Exchange of points for a reward item |
| Exchange | Conversion of points from one partner's balance to another |
| Audit Trail | A tamper-evident log of every significant action in the system |
| CMS | Content Management System — the internal admin interface |

**Field Status:**

| Abbreviation | Description |
|---|---|
| M | Mandatory |
| O | Optional |
| D | Display |
| C | System Calculated |

**Controls Type:**

| Abbreviation | Description |
|---|---|
| TSL | Textbox Single Line |
| DDL | Dropdown List |
| DPL | Date Pick List |
| BTN | Button |
| LBL | Label |
| TXT | Static Text |
| LNK | Hyperlink |
| TBL | Table / Data Grid |
| CRD | Card |
| ICO | Icon |
| IMG | Image |

---

## Introduction

Pistos is a bootcamp mini-case project that implements a points-based loyalty platform. The platform acts as a central loyalty hub that manages points earned through third-party partner transactions (e.g., KFC, McDonald's), allows members to redeem points for rewards, and enables point exchange between partners.

### Purpose

This document describes the functional specifications of the Pistos Loyalty Platform. It serves as the primary reference for designers, developers, testers, and stakeholders during the design, implementation, testing, and acceptance phases.

### Scope

**Limitations:**
- The system only supports loyalty point management; does not handle payment processing or transaction settlement.
- Partner transactions are simulated through API requests — not integrated with real-time external partner systems.
- JWT authentication for API access only. MFA, SSO, and OAuth not included.

---

## High-Level Business Flows

| Business Flow | Description |
|---------------|-------------|
| Partner Setup & Configuration | CMS Admin creates a new partner and configures the default point conversion rate. System initializes the partner so it can participate in the loyalty ecosystem. |
| Member Registration | A new member registers. System creates the account, initializes point balances for every active partner, and records registration in audit trail. |
| Point Accumulation | Partner System submits a transaction. System validates member and partner, calculates earned points, credits balance, records transaction, writes audit log. |
| View Point Balance | Members can view their current point balances for each partner. |
| Point Exchange | Members exchange points from one partner to another using configured exchange rate. System validates balance, converts, updates both balances, records transactions, writes audit log. |
| Point Redemption | Members redeem available points for rewards. System validates balance, deducts points, records redemption transaction, stores audit trail. |
| Transaction History | Members can review transaction history including earning, redemption, exchange, and expiration. |
| Point Expiry Process | Scheduled background job checks expired points, deducts expired balances, creates expiration transactions, records audit trail. |
| Audit Trail | Every critical business event is recorded for traceability and accountability. |

---

## Module Index

| Module Name | Function |
|-------------|----------|
| Authentication Management | AUT.1 Authentication |
| Member Management | MEM.1 Manage Member |
| Partner Management | PAR.1 Manage Partner |
| Point Management | PNT.1 Manage Point |
| Exchange Management | EXC.1 Exchange Point |
| Audit Management | AUD.1 Audit Trail |

---

## AUT.1 — Authentication

### Use Cases

**UC: Member Registration**
- Actor: New Member
- Pre-condition: User not registered; Registration page accessible
- Normal Flow: Member fills form → system validates → creates account → initializes balances → issues JWT → redirects to dashboard
- Alternate Flow 1: Mandatory field missing → show field error
- Alternate Flow 2: Email or phone already registered → show error
- Alternate Flow 3: Password confirmation mismatch → show error
- Post-condition: Account created; point balances initialized for all active partners; JWT issued; audit trail recorded; member redirected to dashboard

**UC: Member Login**
- Actor: Member
- Pre-condition: Account registered and ACTIVE; Login page accessible
- Normal Flow: Member submits credentials → system validates → issues JWT → redirects to dashboard
- Alternate Flow 1: Mandatory field missing → show error
- Alternate Flow 2: Invalid credentials → show error
- Alternate Flow 3: Inactive member → show error
- Post-condition: JWT Access Token issued; login recorded in audit trail; redirected to dashboard

**UC: CMS Admin Login**
- Actor: CMS Admin
- Pre-condition: Admin account registered and ACTIVE
- Normal Flow: Admin submits credentials → system validates → issues JWT → redirects to CMS dashboard
- Alternate Flow 1: Mandatory field missing → show error
- Alternate Flow 2: Invalid credentials → show error
- Post-condition: JWT issued; login recorded in audit trail; redirected to CMS

**UC: Partner Authentication**
- Actor: Partner System
- Pre-condition: Partner API Key registered; Partner ACTIVE
- Normal Flow: Partner sends partnerId + apiKey → system validates → issues PARTNER JWT (1h)
- Alternate Flow 1: Invalid API key → 401
- Alternate Flow 2: Partner inactive → 400
- Post-condition: JWT issued; partner system can access POST /transactions

### Business Rules

| Business Rule | Description |
|---------------|-------------|
| Member Registration | Email and phone number must be unique |
| Point Initialization | System auto-initializes point balances for all ACTIVE partners after member registration |
| Automatic Authentication | After registration, system generates JWT for the member |
| Login Authorization | Only ACTIVE status users can authenticate |
| Token Generation | New JWT issued after successful authentication |
| Audit Trail | Every successful registration and login recorded in Audit Trail |

### Validation Rules

| Field | Validation Rule | Error Message |
|-------|----------------|---------------|
| Full Name | Mandatory | Full Name is required. |
| Email | Mandatory | Email is required. |
| Email | Valid format | Invalid email format. |
| Email | Unique | Email is already registered. |
| Phone Number | Mandatory | Phone Number is required. |
| Phone Number | Unique | Phone Number is already registered. |
| Password | Mandatory | Password is required. |
| Confirm Password | Must match Password | Password confirmation does not match. |
| Login Email | Mandatory | Email is required. |
| Login Password | Mandatory | Password is required. |
| Login Credentials | Match existing account | Invalid email or password. |
| Account Status | Must be ACTIVE | Your account is inactive. Please contact the administrator. |

### Field Description — Member Login

| # | Display Name | Required | Read Only | Display Type | Max Length | Remarks |
|---|---|---|---|---|---|---|
| 1 | Email Address | Yes | No | Text Box | 100 | Must match standard email format |
| 2 | Password | Yes | No | Text Box (Password) | 32 | Input masked |
| 3 | Show/Hide Password | N/A | N/A | Icon Button | N/A | Toggle password visibility |
| 4 | Forgot Password? | N/A | N/A | Link | N/A | Redirect to password reset |
| 5 | Create Account | N/A | N/A | Link | N/A | Redirect to Registration page |

### Field Description — Member Registration

| # | Display Name | Required | Default | Display Type | Max Length | Remarks |
|---|---|---|---|---|---|---|
| 1 | Full Name | Yes | — | Text Box | 100 | Alphabetical characters and spaces only |
| 2 | Email | Yes | — | Text Box | 100 | Active email for registration |
| 3 | Country Code | Yes | +62 | Drop Down | 5 | Default +62 |
| 4 | Phone Number | Yes | — | Text Box | 15 | Numeric, excluding leading zero |
| 5 | Password | Yes | — | Text Box (Password) | 32 | Masked input |
| 6 | Confirm Password | Yes | — | Text Box (Password) | 32 | Must match Password |
| 7 | Terms & Privacy Checkbox | Yes | Unchecked | Checkbox | N/A | Must be checked to register |

**Expected Performance:**
- Login/registration page full load: < 2 seconds (4G/Wi-Fi)
- Authentication + DB query: < 3 seconds

---

## MEM.1 — Manage Member

### Use Cases

**UC: View Member (Admin)**
- Post-condition: Member list displayed; Admin can select member for further action

**UC: View Member Detail (Admin)**
- Post-condition: Member profile displayed

**UC: Edit Member (Admin)**
- Normal Flow: Admin edits fields → validates unique constraints → saves → audit trail written
- Alternate Flow 1: Mandatory field missing
- Alternate Flow 2: Duplicate email or phone
- Post-condition: Member profile updated; Audit Trail recorded

**UC: Update Member Status (Admin)**
- Normal Flow: Admin selects status → applies → audit trail written
- Alternate Flow: Member not found
- Post-condition: Member status updated; Audit Trail recorded

### Business Rules

| Business Rule | Description |
|---------------|-------------|
| Member Visibility | Admin can view list of all registered members |
| Search Member | Admin can search by Full Name, Email, or Phone Number |
| Unique Member Information | Email and phone number must remain unique |
| Member Status | Admin can change status between ACTIVE and INACTIVE |
| Inactive Member Restriction | INACTIVE members cannot login or perform transactions |
| Historical Data Preservation | Updating member info/status does not modify point balances or transaction history |
| Audit Trail | Every update and status change recorded in Audit Trail |

### Validation Rules

| Screen | Field | Validation | Error Message |
|--------|-------|------------|---------------|
| View Member | Search Criteria | Optional | Display matching records |
| View Member | Search Result | No matching data | "No member found." |
| Edit Member | Full Name | Required | Display validation message |
| Edit Member | Email | Required; valid format; unique | Display validation message or "Email is already registered." |
| Edit Member | Phone Number | Required; unique | "Phone number is already registered." |
| Edit Member | Member Record | Member does not exist | "Member not found." |
| Update Member Status | Member Record | Member does not exist | "Member not found." |
| Update Member Status | Status | ACTIVE or INACTIVE only | Display validation message |

### Screen — Member List

| # | Display Name | Type | Remarks |
|---|---|---|---|
| 1 | Search Input | Text Box | Placeholder: "Search members by name, email or phone..." |
| 2 | Status Filter | Dropdown | Values: All Status, ACTIVE, INACTIVE |
| 3 | # (index) | Text | Row index / pagination counter |
| 4 | Member Name | Text/Link | Click → Member Detail view |
| 5 | Email | Text | Primary registered email |
| 6 | Phone | Text | Country code + phone |
| 7 | Registered Date | Text | Format: DD/MM/YYYY |
| 8 | Status | Badge | Color-coded: ACTIVE / INACTIVE |

### Screen — Member Detail

| # | Display Name | Required | Read Only | Type | Remarks |
|---|---|---|---|---|---|
| 1 | Full Name | Yes | Default | Text Box | Editable when edit mode active |
| 2 | Email Address | Yes | Default | Text Box | Editable when edit mode active |
| 3 | Phone Number | Yes | Default | Text Box | Editable when edit mode active |
| 4 | Member ID | N/A | Yes | Text Box | UUID |
| 5 | Registered Date | N/A | Yes | Text Box | Creation date |
| 6 | Last Activity | N/A | Yes | Text Box | Last action timestamp |
| 7 | Current Status | Yes | No | Dropdown | ACTIVE / INACTIVE |

**Expected Performance:**
- Member list full load + filtering: < 1.5 seconds
- Filter query refresh: < 1.0 second
- Pagination navigation: < 1.0 second
- Member detail page: < 1.5 seconds
- Data mutation + audit log: < 2.0 seconds

---

## PAR.1 — Manage Partner

### Use Cases

**UC: View Partner (Admin)**
- Post-condition: Partner list displayed

**UC: Add Partner (Admin)**
- Normal Flow: Admin fills form → validates unique code → creates partner → bulk-inits balances for all existing members → audit trail
- Alternate Flow 1: Mandatory field missing
- Alternate Flow 2: Duplicate partner code
- Post-condition: Partner created; point balances initialized for all existing members; Audit Trail recorded

**UC: Edit Partner (Admin)**
- Normal Flow: Admin edits name / conversion rate → saves → audit trail
- Post-condition: Partner info updated; Audit Trail recorded

**UC: Update Partner Status (Admin)**
- Post-condition: Partner status updated; Audit Trail recorded

### Business Rules

| Business Rule | Description |
|---------------|-------------|
| Partner Visibility | Admin can view all registered partners |
| Search Partner | Admin can search by name or code |
| Create Partner | System creates partner after all required info validated |
| Unique Partner Code | Each partner must have a unique Partner Code |
| Point Balance Initialization | After new partner created, system auto-initializes point balances for all existing members via native SQL (no findAll()) |
| Update Partner | Admin can update partner info without affecting existing member balances or history |
| Partner Status | Admin can toggle ACTIVE / INACTIVE |
| Inactive Partner Restriction | INACTIVE partner cannot participate in new earn, redeem, or exchange transactions |
| Audit Trail | Every partner creation, modification, and status update recorded |

### Validation Rules

| Screen | Field | Validation | Error Message |
|--------|-------|------------|---------------|
| Add Partner | Partner Name | Required | Display validation message |
| Add Partner | Partner Code | Required; unique | "Partner code already exists." |
| Add Partner | Point Conversion Rate | Required; > 0 | Display validation message |
| Edit Partner | Partner Name | Required | Display validation message |
| Edit Partner | Conversion Rate | Required; > 0 | Display validation message |
| Edit Partner | Partner Record | Partner not found | "Partner not found." |
| Update Partner Status | Status | ACTIVE or INACTIVE only | Display validation message |

### Screen — Add New Partner

| # | Display Name | Required | Display Type | Max Length | Remarks |
|---|---|---|---|---|---|
| 1 | Partner Name | Yes | Text Box | 100 | Complete partner entity name |
| 2 | Partner Code | Yes | Text Box | 30 | Unique uppercase key; locked after creation |
| 3 | Point Conversion Rate | Yes | Text Box (Decimal) | 10 | Points generated per IDR 1,000 spent |

**Expected Performance:**
- Partner list load + filter: < 1.2 seconds
- Save Partner (including bulk balance init): < 2.5 seconds (async)
- Status mutation: < 1.5 seconds

---

## PNT.1 — Manage Point

### Use Cases

**UC: Earn Point (Partner System)**
- Actor: Partner System
- Pre-condition: Member exists and ACTIVE; Partner exists and ACTIVE; Partner System authenticated (PARTNER JWT)
- Normal Flow: Partner submits transaction → system validates → calculates points (floor(trxAmount / 1000) × pointsPerThousandIDR) → credits balance → creates EARN transaction → writes audit trail
- Alternate Flow 1: Member not found → 404
- Alternate Flow 2: Partner not found or inactive → 404/400
- Post-condition: Member point balance updated; EARN transaction recorded; Audit Trail recorded

**UC: View Point Balance (Member)**
- Actor: Member
- Pre-condition: Member authenticated and ACTIVE
- Post-condition: Current point balances displayed per partner

**UC: Point Expiry (System Scheduler)**
- Actor: System Scheduler
- Schedule: Daily at 00:00 WIB (17:00 UTC) — cron `0 0 17 * * *`
- Pre-condition: Expired points exist; Scheduler running
- Normal Flow: Query EARN transactions where `expires_at <= now()` → deduct from balance → create EXPIRED transaction → write audit trail
- Alternate Flow: No expired points → complete job without changes
- Post-condition: Expired points deducted; EXPIRED transactions recorded; Audit Trail recorded

**UC: Redeem Point (Member)**
- Actor: Member
- Pre-condition: Member authenticated and ACTIVE; Partner of reward is ACTIVE; Sufficient points balance
- Normal Flow: Member selects reward → system validates balance → deducts points → creates REDEEM transaction → writes audit trail
- Alternate Flow 1: Insufficient balance → 422
- Alternate Flow 2: Inactive partner or reward → 400/404
- Post-condition: Partner point balance deducted; REDEEM transaction created; Audit Trail recorded

### Business Rules

| Business Rule | Description |
|---------------|-------------|
| Point Accumulation | Points = floor(trxAmountIDR / 1000) × pointsPerThousandIDR |
| Partner Eligibility | Only ACTIVE partners may accumulate points |
| Member Eligibility | Only existing and ACTIVE members may earn, view, or redeem points |
| Partner-Based Balance | Member balances maintained separately per partner |
| Earn Transaction | Every accumulation creates EARN transaction record |
| Point Expiry | System auto-deducts expired points via scheduled expiry process |
| Expired Transaction | Every expiry creates EXPIRED transaction record |
| Point Redemption | Members may redeem only when balance >= reward cost for that partner |
| Redeem Transaction | Redemption deducts points + creates REDEEM transaction record |
| Historical Data | Point transactions are immutable; never modified or deleted |
| Audit Trail | Every earn, expiry, and redemption recorded in Audit Trail |

### Validation Rules

| Screen | Field | Validation | Error Message |
|--------|-------|------------|---------------|
| Earn Point | Member Identifier | Member must exist | "Member not found." |
| Earn Point | Member Status | ACTIVE | "Member account is inactive." |
| Earn Point | Partner | Exist and ACTIVE | "Partner not found or inactive." |
| Earn Point | Transaction Amount | Required; > 0 | Display validation message |
| View Point Balance | Member | Must exist | "Member not found." |
| Redeem Point | Member Status | ACTIVE | Display validation message |
| Redeem Point | Partner | ACTIVE | "Reward or partner is inactive." |
| Redeem Point | Reward | ACTIVE | "Reward or partner is inactive." |
| Redeem Point | Point Balance | Balance >= reward point cost | "Not enough points." |

**Expected Performance:**
- Point balance page full load: < 1.2 seconds
- Backend query across partner ledgers: < 800ms
- Navigation transitions: < 300ms

---

## EXC.1 — Exchange Point

### Use Case

**UC: Exchange Points Between Partners (Member)**
- Actor: Member
- Pre-condition: Member authenticated and ACTIVE; Source and Destination partners ACTIVE; Exchange rate configured
- Normal Flow: Member selects source/destination partner + amount → system validates balance → calculates target points (floor(sourcePoints × rate)) → deducts source balance → credits destination balance → creates EXCHANGE_OUT and EXCHANGE_IN transactions → writes audit trail → shows success
- Alternate Flow 1: Insufficient balance → error
- Alternate Flow 2: Exchange rate not configured → error
- Alternate Flow 3: Partner inactive → error
- Post-condition: Source balance reduced; Destination balance increased; Both transactions recorded; Audit Trail recorded

### Business Rules

| Business Rule | Description |
|---------------|-------------|
| Exchange Eligibility | Only ACTIVE members may exchange |
| Partner Eligibility | Both source and destination partners must be ACTIVE |
| Exchange Rate | Uses configured rate for the source-destination partner pair |
| Sufficient Balance | Source balance must be sufficient |
| Point Conversion | Destination = floor(sourcePoints × exchangeRate) |
| Atomic Transaction | Deduction + credit in single @Transactional; rollback on failure |
| Transaction History | Creates both EXCHANGE_OUT and EXCHANGE_IN records |
| Historical Data | Exchange does not modify existing transactions |
| Audit Trail | Every exchange recorded in Audit Trail |
| Source ≠ Destination | Source and destination partner cannot be the same |

### Validation Rules

| Field | Validation | Error Message |
|-------|------------|---------------|
| Source Partner | Must exist and be ACTIVE | "Selected partner is inactive." |
| Destination Partner | Must exist and be ACTIVE | "Selected partner is inactive." |
| Exchange Amount | Required; > 0 | Display validation message |
| Point Balance | Source balance >= exchange amount | "Insufficient point balance." |
| Exchange Rate | Must be configured | "Exchange rate not configured." |
| Source ≠ Destination | Cannot be the same | Display validation message |

### Exchange Screen Fields

| # | Display Name | Required | Type | Remarks |
|---|---|---|---|---|
| 1 | From Partner | Yes | Dropdown | Shows logo, name, current balance |
| 2 | Points to Exchange | Yes | Numeric Input | Amount of source points to exchange |
| 3 | To Partner | Yes | Dropdown | Shows logo, name, current balance |
| 4 | Exchange Rate Banner | N/A | Text/Banner | Shows "1 KFC pt = 0.8 McD pts"; hidden if rate not configured |
| 5 | You send | N/A | Text (Calculated) | Mirrors input |
| 6 | You receive | N/A | Text (Calculated) | Auto-calculated: floor(input × rate) |

**Expected Performance:**
- Real-time "You receive" calculation: < 200ms (client-side, pre-fetched rate)
- Validation response: immediate, before backend call
- Confirm Exchange backend processing: < 2.0 seconds

---

## AUD.1 — Audit Management

The system automatically logs all critical business actions. Each row contains: actorId, actorType, eventType, entityType, entityId, payload (JSONB), createdAt.

### Audit Events

| Action | When | Payload Example |
|--------|------|----------------|
| PARTNER_CREATED | Admin creates partner | `{"partnerCode":"KFC","partnerName":"KFC Indonesia","conversionRate":1.00}` |
| PARTNER_UPDATED | Admin edits partner | `{"changes":{"pointConversionRate":{"before":1.00,"after":1.50}}}` |
| PARTNER_STATUS_CHANGED | Admin toggles partner status | `{"previousStatus":"ACTIVE","newStatus":"INACTIVE"}` |
| POINTS_EARNED | Partner earn API called | `{"memberIdentifier":"081234567890","partnerCode":"KFC","trxAmount":50000,"pointsEarned":50}` |
| POINT_EXPIRED | Daily scheduler runs | `{"jobId":"EXP-20260704","totalExpiredRecords":10,"totalPointsDeducted":500}` |
| POINTS_EXCHANGED (OUT) | Member exchanges points | `{"memberId":"...","sourcePartner":"KFC","amountDeducted":100,"exchangeRate":"1:0.8"}` |
| POINTS_EXCHANGED (IN) | Member exchange credited | `{"memberId":"...","destinationPartner":"MCD","amountCredited":80}` |

---

## Appendix

### Exchange Rates (Final)

| From | To | Rate | Meaning |
|------|----|------|---------|
| KFC | McDonald's | 0.8000 | 100 KFC pts → 80 McD pts |
| McDonald's | KFC | 0.9000 | 100 McD pts → 90 KFC pts |

### Seed Rewards

**KFC:**
| Name | Point Cost |
|------|------------|
| KFC Original Recipe Chicken 1pc | 250 |
| KFC French Fries Regular | 150 |
| KFC Zinger Burger | 400 |
| KFC Family Bucket (9pc) | 1200 |
| KFC Pepsi Regular | 100 |

**McDonald's:**
| Name | Point Cost |
|------|------------|
| Big Mac Burger | 350 |
| McNuggets 6pcs | 200 |
| McFlurry Oreo | 250 |
| French Fries Large | 150 |
| McCafe Latte | 180 |
| McValue Meal (Burger + Fries + Drink) | 500 |
