# Activity Diagrams

Dokumen ini berisi Activity Diagram untuk setiap fitur (Use Case) utama yang dijelaskan di dalam FSD.md dan TSD.md. Activity Diagram ini menggambarkan urutan langkah (alur) dari tiap proses bisnis.

## UC-01: Member Registration

```mermaid
flowchart TD
    Start((Start)) --> A[Actor calls POST /auth/register]
    A --> B[System generates internal UUID]
    B --> C[System creates TRX_POINT_BALANCE record = 0 <br/> for all ACTIVE partners]
    C --> D[System writes TRX_AUDIT_TRAIL: MEMBER_REGISTERED]
    D --> E[System generates JWT token with role=MEMBER]
    E --> F[System returns 201 Created <br/> with JWT + member object]
    F --> End((End))
```

---

## UC-02: Partner Master Management (Create Partner)

```mermaid
flowchart TD
    Start((Start)) --> A[Admin calls POST /partners]
    A --> B{Validate Admin JWT?}
    B -- Invalid --> ERR1[Return 401/403]
    B -- Valid --> C[System creates new MST_PARTNER record]
    C --> D[System initializes 0 point balance <br/> for all existing members via bulk SQL]
    D --> E[System writes TRX_AUDIT_TRAIL: PARTNER_CREATED]
    E --> F[System returns 201 Created <br/> with partner object]
    F --> End((End))
    
    ERR1 --> End
```

---

## UC-03: Point Accumulation

```mermaid
flowchart TD
    Start((Start)) --> A[Partner System calls POST /transactions]
    A --> B[System resolves member by identifier <br/> phone / email]
    B --> C{Member found?}
    C -- No --> ERR1[Return 404]
    C -- Yes --> D{Partner exists & ACTIVE?}
    D -- No --> ERR2[Return 404 / 400]
    D -- Yes --> E[Calculate pointsEarned = <br/> floor trxAmount / 1000 * rate]
    E --> F[Credit member's TRX_POINT_BALANCE]
    F --> G[Create TRX_TRANSACTION record <br/> type = EARN, set expiresAt]
    G --> H[Write TRX_AUDIT_TRAIL: POINTS_EARNED]
    H --> I[Return 201 Created]
    I --> End((End))
    
    ERR1 --> End
    ERR2 --> End
```

---

## UC-04: Point Expiry (Background Process)

```mermaid
flowchart TD
    Start((Start)) --> A[Scheduler triggers daily cron job at 1am]
    A --> B["Query EARN transactions <br/> where expiresAt <= now()"]
    B --> C{Transactions found?}
    C -- No --> End((End))
    C -- Yes --> D["For each transaction, calculate <br/> remaining unexpired points"]
    D --> E["Deduct expired points from <br/> member's TRX_POINT_BALANCE"]
    E --> F["Create TRX_TRANSACTION record <br/> type = EXPIRED"]
    F --> G["Write TRX_AUDIT_TRAIL: <br/> POINT_EXPIRED"]
    G --> H[Commit DB Transaction]
    H --> End
```

---

## UC-05: Point Exchange Between Partners

```mermaid
flowchart TD
    Start((Start)) --> A[Member calls POST /exchange]
    A --> B[Lookup MST_EXCHANGE_RATE]
    B --> C{Rate exists?}
    C -- No --> ERR1[Return 404 Not Found]
    C -- Yes --> D{Source Balance >= <br/> requested points?}
    D -- No --> ERR2[Return 400 Insufficient Balance]
    D -- Yes --> E[Deduct points from <br/> source partner balance]
    E --> F["Calculate target points = <br/> floor(points * rate)"]
    F --> G[Credit target points to <br/> destination partner balance]
    G --> H["Create 2 TRX_TRANSACTION records <br/> (EXCHANGE_OUT & EXCHANGE_IN)"]
    H --> I[Write TRX_AUDIT_TRAIL: POINTS_EXCHANGED]
    I --> J[Return 200 OK with updated balances]
    J --> End((End))
    
    ERR1 --> End
    ERR2 --> End
```

---

## UC-06: Point Redemption

```mermaid
flowchart TD
    Start((Start)) --> A[Member calls POST /redeem]
    A --> B{Member exists & ACTIVE?}
    B -- No --> ERR1[Return 404 / 400]
    B -- Yes --> C{Reward exists & ACTIVE?}
    C -- No --> ERR2[Return 404]
    C -- Yes --> D[Lookup member balance for reward's partner]
    D --> E{Balance >= reward.pointCost?}
    E -- No --> ERR3[Return 422 Insufficient Points]
    E -- Yes --> F[Deduct pointCost from balance]
    F --> G[Create TRX_TRANSACTION record <br/> type = REDEEM, link rewardId]
    G --> H[Write TRX_AUDIT_TRAIL: POINTS_REDEEMED]
    H --> I[Return 200 OK with transaction + new balance]
    I --> End((End))
    
    ERR1 --> End
    ERR2 --> End
    ERR3 --> End
```
