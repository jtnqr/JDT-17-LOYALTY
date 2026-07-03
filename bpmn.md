# JDT-17-LOYALTY — Process Flows (BPMN Levels 0–3)

> Version: 3.0 · Date: 2026-07-02
> Description: Process models mapped across standard BPMN hierarchy levels (Level 0 to Level 3) for the Loyalty Points Platform.

---

## 📌 BPMN Modeling Levels Overview

To provide clear communication across different stakeholders (business executives, system analysts, and developers), this document structures the process flows into four distinct levels of detail:

*   **Level 0: Ecosystem Landscape (Value Chain)**
    *   *Audience:* Executive sponsors, business owners.
    *   *Purpose:* High-level context diagram showing core actors, integration boundaries, and overall flow of value.
*   **Level 1: Business Process Flow (Conceptual)**
    *   *Audience:* Business users, project managers.
    *   *Purpose:* Simplified "happy path" sequences of the core business scenarios without technical details or gateways.
*   **Level 2: Process Detail & Gateways (Analytical)**
    *   *Audience:* Business Analysts, QA testers.
    *   *Purpose:* End-to-end process maps with **swimlanes per actor**, decision points (gateways), validation rules, error handling, and alternative paths. Covers all core + supporting flows.
*   **Level 3: Technical Execution (Implementation)**
    *   *Audience:* Backend engineers, integration developers.
    *   *Purpose:* Low-level technical diagrams specifying API endpoints, database transaction boundaries (`BEGIN` and `COMMIT`), specific database updates, and exact HTTP response status codes.

---

## 🗺️ LEVEL 0: Ecosystem Landscape

This diagram depicts the high-level business environment, illustrating the relationship between the **Member**, the **CMS Admin**, the third-party **Partner Systems** (KFC/McDonald's), and the **Loyalty Platform Core**.

```mermaid
flowchart TB
    subgraph MEMBERS["👤 Member Domain"]
        M[Loyalty Member]
    end

    subgraph ADMIN["🔧 Admin Domain"]
        A[CMS Admin]
    end

    subgraph PARTNERS["🏪 Partner Systems"]
        KFC[KFC POS / App]
        MCD[McDonald's POS / App]
    end

    subgraph LOYALTY_CORE["⚙️ Loyalty Points Platform (Core)"]
        REG[Member & Account Management]
        ACC[Point Accumulation Engine]
        RED[Point Redemption Service]
        EXC[Cross-Partner Exchange]
        CAT[Reward Catalog]
        HIST[Transaction & Audit History]
    end

    %% Member Interactions
    M -->|1. Register Profile| REG
    M -->|2. View Balance & History| HIST
    M -->|3. Browse & Redeem Rewards| RED
    M -->|4. Exchange Points KFC ↔ McD| EXC

    %% Admin Interactions
    A -->|5. Manage Members & Partners| REG
    A -->|6. View Audit Trail| HIST

    %% Partner Interactions
    KFC & MCD -->|7. Send Sales Transactions| ACC

    %% Internal Value Loop
    ACC -->|Credit Points| REG
    RED -->|Deduct Points & Issue Voucher| REG
    EXC -->|Rebalance Points| REG
    CAT -->|Provide Reward Catalog| RED
    REG -->|Feed Data| HIST
```

---

## 🏃 LEVEL 1: Business Process Flow (Conceptual)

These high-level, linear flows represent the conceptual steps for each core process, focusing strictly on the successful path.

### 1. Member Registration (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Submits Name, Email, Phone] --> C[System Creates Profile] --> D[Initialize Empty Point Balances for Each Active Partner] --> E([End: Member Ready])
```

### 2. Point Accumulation (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Makes Purchase at Partner POS] --> C[Partner Sends Transaction Amount] --> D[System Calculates & Credits Points] --> E([End: Points Credited])
```

### 3. Point Redemption (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Selects Reward from Catalog] --> C[System Validates Balance] --> D[Points Deducted & Reward Issued] --> E([End: Reward Issued])
```

### 4. Point Exchange (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Chooses Source Partner & Amount] --> C[System Converts Points Using Exchange Rate] --> D[Deduct Source Balance & Credit Target Balance] --> E([End: Balances Rebalanced])
```

### 5. View Point Balance (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Requests Balance] --> C[System Retrieves Partner Balances] --> D([End: Balances Returned])
```

### 6. View Transaction History (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Member Requests History] --> C[System Fetches Earn / Redeem / Exchange Records] --> D([End: History Returned])
```

### 7. Member Status Update by Admin (Conceptual)
```mermaid
flowchart LR
    A([Start]) --> B[Admin Selects Member] --> C[Admin Changes Status Active / Inactive] --> D[System Persists New Status] --> E([End: Status Updated])
```

---

## 🔀 LEVEL 2: Process Detail & Gateways (Analytical)

These detailed workflows map out all actor swim-lanes, validation checkpoints, decision-making pathways, and business error scenarios for every core and supporting flow.

### Flow 1: Member Registration Detail
```mermaid
flowchart TD
    subgraph CLIENT["👤 Member / Admin"]
        C1[Submit Registration Data\nname, email, phone]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1[Create Member Profile Record\nstatus = ACTIVE]
        S2{Active Partners\nExist?}
        S3[Initialize balance = 0\nfor each Active Partner]
        S4[Write Audit: MEMBER_REGISTERED]
        S5([End: Profile Activated])
    end

    C1 --> S1
    S1 --> S2
    S2 -- Yes --> S3
    S2 -- No --> S4
    S3 --> S4
    S4 --> S5
```

---

### Flow 2: Point Accumulation Detail
```mermaid
flowchart TD
    subgraph PARTNER["🏪 Partner POS"]
        P1[Send Transaction\nmemberId, partnerCode, trxAmount]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member\nExists?}
        S2{Member\nStatus ACTIVE?}
        S3{Partner\nRegistered & ACTIVE?}
        S4[Calculate Points\nfloor trxAmount ÷ 1000 × pointsPerThousandIDR]
        S5[Credit Points to\nMember-Partner Balance]
        S6[Log Transaction: EARN]
        S7[Write Audit: POINTS_EARNED]
        S8([End: Points Credited])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Not Found\nHTTP 404]
        E2[Reject: Member Suspended\nHTTP 400]
        E3[Reject: Partner Invalid / Inactive\nHTTP 404]
        E4([End: Accumulation Failed])
    end

    P1 --> S1
    S1 -- No --> E1 --> E4
    S1 -- Yes --> S2
    S2 -- No --> E2 --> E4
    S2 -- Yes --> S3
    S3 -- No --> E3 --> E4
    S3 -- Yes --> S4 --> S5 --> S6 --> S7 --> S8
```

---

### Flow 3: Point Redemption Detail
```mermaid
flowchart TD
    subgraph MEMBER["👤 Member"]
        M1[Request Redemption\nmemberId, rewardId]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member Exists\n& Status ACTIVE?}
        S2{Reward Exists\nin Catalog?}
        S3[Retrieve Reward\nPointCost & Associated Partner]
        S4{Member Balance ≥\nReward PointCost?}
        S5[Deduct PointCost\nfrom Partner Balance]
        S6[Log Transaction: REDEEM]
        S7[Create Redemption Log Record]
        S8[Write Audit: POINTS_REDEEMED]
        S9[Generate Reward Voucher / Confirmation]
        S10([End: Redemption Completed])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Invalid / Inactive\nHTTP 404 / 400]
        E2[Reject: Reward Not Found\nHTTP 404]
        E3[Reject: Insufficient Points\nHTTP 400]
        E4([End: Redemption Failed])
    end

    M1 --> S1
    S1 -- No --> E1 --> E4
    S1 -- Yes --> S2
    S2 -- No --> E2 --> E4
    S2 -- Yes --> S3 --> S4
    S4 -- No --> E3 --> E4
    S4 -- Yes --> S5 --> S6 --> S7 --> S8 --> S9 --> S10
```

---

### Flow 4: Point Exchange Detail
```mermaid
flowchart TD
    subgraph MEMBER["👤 Member"]
        M1[Request Exchange\nmemberId, fromPartner, toPartner, points]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member Exists\n& Status ACTIVE?}
        S2{Both Source & Target\nPartners ACTIVE?}
        S3{Exchange Rate\nConfigured?}
        S4{Source Balance ≥\nRequested Points?}
        S5[Calculate Target Points\nfloor sourcePoints × exchangeRate]
        S6[Deduct Points from\nSource Partner Balance]
        S7[Credit Converted Points to\nTarget Partner Balance]
        S8[Log Transaction: EXCHANGE_OUT]
        S9[Log Transaction: EXCHANGE_IN\nlinked to EXCHANGE_OUT]
        S10[Write Audit: POINTS_EXCHANGED]
        S11([End: Exchange Executed])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Invalid / Inactive\nHTTP 404 / 400]
        E2[Reject: Partners Invalid / Inactive\nHTTP 404]
        E3[Reject: Exchange Route Unsupported\nHTTP 404]
        E4[Reject: Insufficient Points\nHTTP 400]
        E5([End: Exchange Failed])
    end

    M1 --> S1
    S1 -- No --> E1 --> E5
    S1 -- Yes --> S2
    S2 -- No --> E2 --> E5
    S2 -- Yes --> S3
    S3 -- No --> E3 --> E5
    S3 -- Yes --> S4
    S4 -- No --> E4 --> E5
    S4 -- Yes --> S5 --> S6 --> S7 --> S8 --> S9 --> S10 --> S11
```

---

### Flow 5: View Point Balance Detail
```mermaid
flowchart TD
    subgraph MEMBER["👤 Member"]
        M1[Request Balance\nGET memberId]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member\nExists?}
        S2[Retrieve All Partner Balances\nfor Member]
        S3([End: Return Balance per Partner])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Not Found\nHTTP 404]
        E2([End: Failed])
    end

    M1 --> S1
    S1 -- No --> E1 --> E2
    S1 -- Yes --> S2 --> S3
```

---

### Flow 6: View Transaction History Detail
```mermaid
flowchart TD
    subgraph MEMBER["👤 Member / Admin"]
        M1[Request Transaction History\nmemberId, optional filters]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member\nExists?}
        S2[Fetch EARN Transactions]
        S3[Fetch REDEEM Transactions]
        S4[Fetch EXCHANGE_OUT / IN Transactions]
        S5[Merge & Sort by Timestamp DESC]
        S6([End: Return Paginated History])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Not Found\nHTTP 404]
        E2([End: Failed])
    end

    M1 --> S1
    S1 -- No --> E1 --> E2
    S1 -- Yes --> S2 & S3 & S4 --> S5 --> S6
```

---

### Flow 7: Redemption History Detail
```mermaid
flowchart TD
    subgraph MEMBER["👤 Member / Admin"]
        M1[Request Redemption History\nmemberId]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member\nExists?}
        S2[Fetch Redemption Log Records\njoined with Reward & Transaction]
        S3([End: Return Redemption Log List])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Not Found\nHTTP 404]
        E2([End: Failed])
    end

    M1 --> S1
    S1 -- No --> E1 --> E2
    S1 -- Yes --> S2 --> S3
```

---

### Flow 8: Member Status Update by Admin Detail
```mermaid
flowchart TD
    subgraph ADMIN["🔧 CMS Admin"]
        A1[Select Member & New Status\nACTIVE or INACTIVE]
    end

    subgraph SYSTEM["⚙️ Loyalty System"]
        S1{Member\nExists?}
        S2{New Status Same\nas Current?}
        S3[Update Member Status]
        S4[Write Audit: MEMBER_STATUS_CHANGED]
        S5([End: Status Updated])
    end

    subgraph ERRORS["❌ Error Outcomes"]
        E1[Reject: Member Not Found\nHTTP 404]
        E2[Reject: No Change Needed\nHTTP 400]
        E3([End: Failed])
    end

    A1 --> S1
    S1 -- No --> E1 --> E3
    S1 -- Yes --> S2
    S2 -- Yes --> E2 --> E3
    S2 -- No --> S3 --> S4 --> S5
```

---

## ⚙️ LEVEL 3: Technical Execution (Implementation)

These diagrams describe the actual API layer, database transaction boundaries, data persistence details, and HTTP responses.

### Technical Flow 1: Member Registration (`POST /auth/register`)
```mermaid
sequenceDiagram
    autonumber
    actor Client as Client (Member Self-Registration)
    participant API as Auth Controller
    participant Service as Auth Service
    participant DB as PostgreSQL Database

    Client->>API: POST /auth/register {name, email, phone, password}
    API->>Service: registerMember(dto)

    Note over Service, DB: DB TRANSACTION START (Required)

    Service->>DB: INSERT INTO MST_MEMBER (id, name, email, phone, password_hash, status = ACTIVE)
    Service->>DB: SELECT id FROM MST_PARTNER WHERE status = ACTIVE
    DB-->>Service: Return active partners (KFC, MCD)

    loop For each active partner
        Service->>DB: INSERT INTO TRX_POINT_BALANCE (id, member_id, partner_id, balance = 0, version = 0)
    end

    Service->>DB: INSERT INTO TRX_AUDIT_TRAIL (eventType = MEMBER_REGISTERED, actorType = SYSTEM, payload)

    Note over Service, DB: DB TRANSACTION COMMIT
    DB-->>Service: Confirm updates committed

    Service->>Service: Generate JWT token (role = MEMBER, sub = member.id)
    Service-->>API: Return created Member + JWT
    API-->>Client: HTTP 201 Created {token, member: {id, name, email, phone, status, balances}}
```

---

### Technical Flow 2: Point Accumulation (`POST /transactions`)
```mermaid
sequenceDiagram
    autonumber
    actor Partner as Partner POS (KFC/McD)
    participant API as Transaction Controller
    participant Service as Transaction Service
    participant DB as PostgreSQL Database

    Partner->>API: POST /transactions {memberId, partnerCode, trxAmount}
    API->>Service: accumulatePoints(dto)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId
    alt Member not found
        DB-->>Service: Null
        Service-->>API: Throw MemberNotFoundException
        API-->>Partner: HTTP 404 Not Found {message: "Member not found"}
    else Member is INACTIVE
        DB-->>Service: Member (status = INACTIVE)
        Service-->>API: Throw MemberInactiveException
        API-->>Partner: HTTP 400 Bad Request {message: "Member is inactive"}
    end

    Service->>DB: SELECT * FROM PARTNER WHERE code = partnerCode AND status = ACTIVE
    alt Partner not found or INACTIVE
        DB-->>Service: Null / Inactive
        Service-->>API: Throw PartnerNotFoundException
        API-->>Partner: HTTP 404 Not Found {message: "Partner invalid or inactive"}
    end

    Note over Service, DB: DB TRANSACTION START (Required)

    Service->>Service: Calculate: floor(trxAmount / 1000) * pointsPerThousand

    Service->>DB: INSERT INTO TRANSACTION (id, member_id, partner_id, type = EARN, points, trx_amount_idr)
    Service->>DB: UPDATE POINT_BALANCE SET balance = balance + pointsEarned WHERE member_id AND partner_id
    Service->>DB: INSERT INTO AUDIT_TRAIL (eventType = POINTS_EARNED, payload)

    Note over Service, DB: DB TRANSACTION COMMIT
    DB-->>Service: Commit confirmed

    Service-->>API: Return transaction details
    API-->>Partner: HTTP 201 Created {transactionId, pointsEarned, newBalance}
```

---

### Technical Flow 3: Point Redemption (`POST /redeem`)
```mermaid
sequenceDiagram
    autonumber
    actor Member as Member App
    participant API as Redemption Controller
    participant Service as Redemption Service
    participant DB as PostgreSQL Database

    Member->>API: POST /redeem {memberId, rewardId}
    API->>Service: redeemReward(dto)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId AND status = ACTIVE
    alt Member not found or INACTIVE
        DB-->>Service: Null / Inactive
        Service-->>API: Throw InvalidMemberException
        API-->>Member: HTTP 404/400 Error Response
    end

    Service->>DB: SELECT * FROM REWARD WHERE id = rewardId AND status = ACTIVE
    alt Reward not found
        DB-->>Service: Null
        Service-->>API: Throw RewardNotFoundException
        API-->>Member: HTTP 404 Not Found {message: "Reward not found"}
    end

    Service->>DB: SELECT balance FROM TRX_POINT_BALANCE WHERE member_id AND partner_id = reward.partner_id
    alt Balance < reward.pointCost
        DB-->>Service: balance
        Service-->>API: Throw InsufficientBalanceException
        API-->>Member: HTTP 422 Unprocessable Entity {message: "Insufficient point balance"}
    end

    Note over Service, DB: DB TRANSACTION START (Required)

    Service->>DB: INSERT INTO TRX_TRANSACTION (id, member_id, partner_id, type = REDEEM, points = reward.pointCost, rewardId)
    Service->>DB: UPDATE TRX_POINT_BALANCE SET balance = balance - reward.pointCost WHERE member_id AND partner_id
    Service->>DB: INSERT INTO TRX_AUDIT_TRAIL (eventType = POINTS_REDEEMED, actorType = MEMBER, payload)

    Note over Service, DB: DB TRANSACTION COMMIT
    DB-->>Service: Commit confirmed

    Service-->>API: Return redemption details
    API-->>Member: HTTP 200 OK {redemptionId, rewardName, remainingBalance}
```

---

### Technical Flow 4: Point Exchange (`POST /exchange`)
```mermaid
sequenceDiagram
    autonumber
    actor Member as Member App
    participant API as Exchange Controller
    participant Service as Exchange Service
    participant DB as PostgreSQL Database

    Member->>API: POST /exchange {memberId, fromPartnerId, toPartnerId, points}
    API->>Service: exchangePoints(dto)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId AND status = ACTIVE
    alt Member invalid/inactive
        DB-->>Service: Null / Inactive
        Service-->>API: Throw InvalidMemberException
        API-->>Member: HTTP 404/400 Error Response
    end

    Service->>DB: SELECT * FROM PARTNER WHERE id IN (fromPartnerId, toPartnerId) AND status = ACTIVE
    alt One or both partners inactive
        DB-->>Service: Null / Inactive
        Service-->>API: Throw PartnerNotFoundException
        API-->>Member: HTTP 404 Not Found {message: "Partner invalid or inactive"}
    end

    Service->>DB: SELECT rate FROM EXCHANGE_RATE WHERE from_partner_id AND to_partner_id
    alt Exchange rate not configured
        DB-->>Service: Null
        Service-->>API: Throw ExchangeRateNotConfiguredException
        API-->>Member: HTTP 404 Not Found {message: "Exchange rate not configured"}
    end

    Service->>DB: SELECT balance FROM POINT_BALANCE WHERE member_id AND partner_id = fromPartnerId
    alt Balance < points
        DB-->>Service: balance
        Service-->>API: Throw InsufficientBalanceException
        API-->>Member: HTTP 400 Bad Request {message: "Insufficient points for exchange"}
    end

    Note over Service, DB: DB TRANSACTION START (Required)

    Service->>Service: Calculate: floor(points * rate) → targetPoints

    Service->>DB: INSERT INTO TRANSACTION (id, member_id, partner_id = fromPartnerId, type = EXCHANGE_OUT, points)
    Note over Service: Capture EXCHANGE_OUT transaction ID (txOutId)
    Service->>DB: INSERT INTO TRANSACTION (id, member_id, partner_id = toPartnerId, type = EXCHANGE_IN, points = targetPoints, related_tx_id = txOutId)

    Service->>DB: UPDATE POINT_BALANCE SET balance = balance - points WHERE member_id AND partner_id = fromPartnerId
    Service->>DB: UPDATE POINT_BALANCE SET balance = balance + targetPoints WHERE member_id AND partner_id = toPartnerId

    Service->>DB: INSERT INTO AUDIT_TRAIL (eventType = POINTS_EXCHANGED, payload)

    Note over Service, DB: DB TRANSACTION COMMIT
    DB-->>Service: Commit confirmed

    Service-->>API: Return updated balances
    API-->>Member: HTTP 200 OK {memberId, fromPartnerId, newFromBalance, toPartnerId, newToBalance}
```

---

### Technical Flow 5: View Point Balance (`GET /members/{memberId}/balance`)
```mermaid
sequenceDiagram
    autonumber
    actor Member as Member App
    participant API as Member Controller
    participant Service as Member Service
    participant DB as PostgreSQL Database

    Member->>API: GET /members/{memberId}/balance
    API->>Service: getBalance(memberId)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId
    alt Member not found
        DB-->>Service: Null
        Service-->>API: Throw MemberNotFoundException
        API-->>Member: HTTP 404 Not Found {message: "Member not found"}
    end

    Service->>DB: SELECT pb.partner_id, p.name, pb.balance FROM POINT_BALANCE pb JOIN PARTNER p ON pb.partner_id = p.id WHERE pb.member_id = memberId
    DB-->>Service: Return list of {partnerId, partnerName, balance}

    Service-->>API: Return balance list
    API-->>Member: HTTP 200 OK {memberId, balances: [{partnerId, partnerName, balance}]}
```

---

### Technical Flow 6: View Transaction History (`GET /members/{memberId}/transactions`)
```mermaid
sequenceDiagram
    autonumber
    actor Member as Member App
    participant API as Transaction Controller
    participant Service as Transaction Service
    participant DB as PostgreSQL Database

    Member->>API: GET /members/{memberId}/transactions
    API->>Service: getTransactionHistory(memberId)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId
    alt Member not found
        DB-->>Service: Null
        Service-->>API: Throw MemberNotFoundException
        API-->>Member: HTTP 404 Not Found {message: "Member not found"}
    end

    Service->>DB: SELECT t.*, p.name AS partnerName FROM TRANSACTION t JOIN PARTNER p ON t.partner_id = p.id WHERE t.member_id = memberId ORDER BY created_at DESC
    DB-->>Service: Return transaction rows (EARN, REDEEM, EXCHANGE_OUT, EXCHANGE_IN)

    Service-->>API: Return paginated result
    API-->>Member: HTTP 200 OK {memberId, transactions: [{id, type, points, partnerName, createdAt, ...}]}
```

---

### Technical Flow 7: Member Status Update (`PATCH /members/{memberId}/status`)
```mermaid
sequenceDiagram
    autonumber
    actor Admin as CMS Admin
    participant API as Member Controller
    participant Service as Member Service
    participant DB as PostgreSQL Database

    Admin->>API: PATCH /members/{memberId}/status {status: "INACTIVE"}
    API->>Service: updateMemberStatus(memberId, newStatus)

    Service->>DB: SELECT * FROM MEMBER WHERE id = memberId
    alt Member not found
        DB-->>Service: Null
        Service-->>API: Throw MemberNotFoundException
        API-->>Admin: HTTP 404 Not Found {message: "Member not found"}
    end

    alt New status equals current status
        Service-->>API: Throw NoChangeException
        API-->>Admin: HTTP 400 Bad Request {message: "Status already set to requested value"}
    end

    Note over Service, DB: DB TRANSACTION START (Required)

    Service->>DB: UPDATE MEMBER SET status = newStatus WHERE id = memberId
    Service->>DB: INSERT INTO AUDIT_TRAIL (eventType = MEMBER_STATUS_CHANGED, payload: {memberId, oldStatus, newStatus})

    Note over Service, DB: DB TRANSACTION COMMIT
    DB-->>Service: Commit confirmed

    Service-->>API: Return updated member
    API-->>Admin: HTTP 200 OK {id, name, status}
```
