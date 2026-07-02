# JDT-17-LOYALTY — Process Flows (BPMN)

> Version: 1.0 · Date: 2026-07-02

---

## Notation Choice

These diagrams use **Mermaid `flowchart` syntax** (not BPMN XML) for Markdown portability — they render natively in GitHub, GitLab, Obsidian, and most modern documentation tools.

**Swimlanes** are approximated with Mermaid `subgraph` blocks, one block per actor. True BPMN pools/lanes are not supported in Mermaid, but the subgraph structure conveys the same actor-boundary intent.

For **true BPMN notation** (with formal events, gateways, pools, and lanes), these flows can be recreated in a BPMN-capable tool such as **Camunda Modeler**, **draw.io**, or **Bizagi** using the step sequences documented below. True BPMN would add:

| BPMN Element | Symbol | Mermaid Approximation |
|---|---|---|
| Start Event | Circle (thin border) | `([Start])` |
| End Event | Circle (thick border) | `([End])` |
| Exclusive Gateway | Diamond with **×** | `{Decision?}` |
| Service Task | Rectangle with ⚙ gear | `[Step]` |
| Pool / Lane | Horizontal band | `subgraph ACTOR` |

---

## Flow 1: Member Registration

**Actors:** Member · Loyalty System

```mermaid
flowchart TD

    subgraph MEMBER["👤 MEMBER"]
        A([Start: Register])
        B[Fill in name / email / phone]
        C[Submit registration form]
    end

    subgraph LOYALTY_SYSTEM["⚙️ LOYALTY SYSTEM"]
        D[Generate UUID member ID]
        E[Set member status = ACTIVE]
        F["Create POINT_BALANCE records\n(balance = 0) for each active partner\n(KFC, McD)"]
        G["INSERT AUDIT_TRAIL\nevent = MEMBER_REGISTERED"]
        H[Compose member response object]
        Z([End: Return member object\nwith ID + empty balances])
    end

    A --> B --> C --> D
    D --> E --> F --> G --> H --> Z
```

---

## Flow 2: Point Accumulation

**Actors:** Partner System · Loyalty System

```mermaid
flowchart TD

    subgraph PARTNER_SYSTEM["🏪 PARTNER SYSTEM"]
        A([Start])
        B["POST /transactions\n{memberId, partner, trxAmount}"]
    end

    subgraph LOYALTY_SYSTEM["⚙️ LOYALTY SYSTEM"]
        C{Member exists?}
        D{Partner exists\nand ACTIVE?}
        E{Member status\n= ACTIVE?}
        F["Calculate pointsEarned\n= floor(trxAmount ÷ 1000) × pointsPerThousandIDR"]

        subgraph DB_TRANSACTION["🗄️ DB TRANSACTION"]
            G["INSERT TRANSACTION\n(type = EARN)"]
            H["UPDATE POINT_BALANCE\n(balance += pointsEarned)"]
            I["INSERT AUDIT_TRAIL\n(POINTS_EARNED)"]
            J[COMMIT]
        end

        Z([End: Return 201\ntransaction + new balance])

        ERR1["Return 404\nMember Not Found"]
        ERR2["Return 404\nPartner Not Found"]
        ERR3["Return 400\nMember Inactive"]
    end

    A --> B --> C
    C -- No --> ERR1
    C -- Yes --> D
    D -- No --> ERR2
    D -- Yes --> E
    E -- No --> ERR3
    E -- Yes --> F --> G --> H --> I --> J --> Z
```

---

## Flow 3: Point Redemption

**Actors:** Member · Loyalty System

```mermaid
flowchart TD

    subgraph MEMBER["👤 MEMBER"]
        A([Start])
        B["POST /redeem\n{memberId, rewardId}"]
    end

    subgraph LOYALTY_SYSTEM["⚙️ LOYALTY SYSTEM"]
        C{Member exists?}
        D{Reward exists?}
        E["Fetch reward.pointCost\nand reward.partnerId"]
        F{"Member balance\nfor partner\n≥ pointCost?"}

        subgraph DB_TRANSACTION["🗄️ DB TRANSACTION"]
            G["INSERT TRANSACTION\n(type = REDEEM)"]
            H["UPDATE POINT_BALANCE\n(balance -= pointCost)"]
            I[INSERT REDEMPTION_LOG]
            J["INSERT AUDIT_TRAIL\n(POINTS_REDEEMED)"]
            K[COMMIT]
        end

        Z([End: Return 200\nredemption confirmation\n+ remaining balance])

        ERR1["Return 404\nMember Not Found"]
        ERR2["Return 404\nReward Not Found"]
        ERR3["Return 400\nInsufficient Balance"]
    end

    A --> B --> C
    C -- No --> ERR1
    C -- Yes --> D
    D -- No --> ERR2
    D -- Yes --> E --> F
    F -- No --> ERR3
    F -- Yes --> G --> H --> I --> J --> K --> Z
```

---

## Flow 4: Point Exchange

**Actors:** Member · Loyalty System

```mermaid
flowchart TD

    subgraph MEMBER["👤 MEMBER"]
        A([Start])
        B["POST /exchange\n{memberId, fromPartnerId,\ntoPartnerId, points}"]
    end

    subgraph LOYALTY_SYSTEM["⚙️ LOYALTY SYSTEM"]
        C{Member exists?}
        D{"fromPartner and toPartner\nexist and ACTIVE?"}
        E{"Exchange rate configured\nfromPartner → toPartner?"}
        F{"Member balance\nfor fromPartner\n≥ points?"}
        G["Calculate targetPoints\n= floor(points × exchangeRate)"]

        subgraph DB_TRANSACTION["🗄️ DB TRANSACTION"]
            H["INSERT TRANSACTION\n(type = EXCHANGE_OUT, fromPartner)"]
            I["INSERT TRANSACTION\n(type = EXCHANGE_IN, toPartner,\nrelatedTxId = OUT.id)"]
            J["UPDATE POINT_BALANCE\n(fromPartner balance -= points)"]
            K["UPDATE POINT_BALANCE\n(toPartner balance += targetPoints)"]
            L["INSERT AUDIT_TRAIL\n(POINTS_EXCHANGED)"]
            M[COMMIT]
        end

        Z([End: Return 200\nboth updated balances])

        ERR1["Return 404\nMember Not Found"]
        ERR2["Return 404\nPartner Not Found"]
        ERR3["Return 404\nExchange Rate Not Configured"]
        ERR4["Return 400\nInsufficient Balance"]
    end

    A --> B --> C
    C -- No --> ERR1
    C -- Yes --> D
    D -- No --> ERR2
    D -- Yes --> E
    E -- No --> ERR3
    E -- Yes --> F
    F -- No --> ERR4
    F -- Yes --> G --> H --> I --> J --> K --> L --> M --> Z
```
