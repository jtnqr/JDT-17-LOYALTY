# JDT-17-LOYALTY

# Task BOOTCAMP

**MENTOR INVOLVEMENT PLAN**

1. **Initial Phase (Day 1-2): 02 & 03 July 2026**
- Kickoff Session: Mentors meet their assigned teams to:
    1. Understand the team’s chosen theme.
    2. Help define the scope of the project.
    3. Break the project into clear milestones (e.g., database setup, backend APIs).
1. **Midway Checkpoints (Week 1): 02 s.d 09 July 2026**
- Hold two checkpoints during the first week:
    1. Checkpoint 1: Review the team’s progress on initial setup (e.g., database schema, API design).
    2. Checkpoint 2: Focus on integration of frontend and backend, and ensure they’re following good coding practices. (if we have to create FE)
1. **Final Week (Week 2): 10 s.d 20 July 2026Code Reviews: Evaluate the overall quality of the code and suggest improvements.**
    - Presentation Guidance: Help the team structure their final presentation/demo to highlight key features and problem-solving approaches.
2. **Submission Mini Case: 21 July 2026**

**DELIVERABLE EXPECTATION**

1. Simple FSD TSD
2. ERD
3. Use Cases
4. Flow Chart/BPMN
5. API Spec
6. Source Code in git, for a working demo
7. Unit Testing
8. Audit Trails
9. Presentation

**Loyalty**

- Member registration (keep it simple, input validation is not required)
- The system must provide a points accumulation feature for transactions made through third-party partners such as KFC and McDonald’s
- The system must provide a simple point redemption feature that allows users to exchange points for rewards. The system should only validate point balance and perform point deduction. Reward availability does not require validation and rewards may be injected directly from the database
- The system must provide a point exchange feature between third-party partners (e.g., converting KFC points into McDonald’s points and vice versa). This feature is a primary requirement and must be prioritized

My review after breakdown: 

Requirement:

1. Member regist
2. System must provide a poin
3. Data dummy
4. System bisa menukar poin dengan reward (voucher, product, merchandise)
5. Mengatur penambahan poin / pengurangan poin
6. Data reward langsung di inject.
7. Bisa reward di third party (mcd ke kfc dan sebaliknya)

FSD TSD 1-5 poin

> 14 July 2026 → deadline
> 

ini websitenya : https://indivaragroup.com/indivara-loyalty-platform-02/ 

goodie ada beberapa fitur:

- Membership Tiering

> With Membership Tiering, you can segment your customer base more effectively, by monitoring and analyzing member activities and interests. You can improve the customer experience they provide and create highly-targeted communication. Also, customers will feel that the brand looks after them.
> 
- Transfer Point

> Transfer point between member allows users to connected with other users and share experiences using your platform and services.
> 
- Exchange Point

> This feature allows users to exchange their loyalty points from one merchant to another merchant which they prefer to use.
> 
- Redeem point

my notes:

AI → stitch for UI / UX design

Loyalty → system berbasis poin (loyalty yang mengatur). pihak 3 yang ngatur poin-nya. 

KFC sama McD. 

CMS : View Member, Edit Member, Member Status

Merchant : KFC & McD

API Contract

Point Balance

```jsx
GET /members/{id}/points
```

Point History

```jsx
GET /members/{id}/transactions

```

Transaction API

```jsx
POST /transactions
```

Body: 

{

"memberId":"M001",

"partner":"KFC",

"trxAmount":150000

}

Exchange Rate *contoh: 

1 KFC poin = 0.8 McD poin

Reward Catalog

```jsx
GET /rewards
```

If possible adding new merchant :

```jsx
GET /partners 
```

Membership tier just suggest: 

- Bronze
- Silver
- Gold

Expired date → possible for poin

Dashboard berisi (Total Member, Total Transaction, Total Point Issued, Total Point Redeemed, Total Exchange)

```jsx
GET /dashboard
```

Audit Trail: untuk dapat semua aktivitas yang dilakukan user

API suggest:

POST /members

GET /members

GET /members/{id}

GET /members/{id}/points

GET /members/{id}/transactions

POST /transactions

GET /partners

GET /rewards

POST /redeem

POST /exchange

GET /dashboard

**Must Have (sesuai requirement):**

- Member Registration
- Partner Master (KFC, McDonald's)
- Point Balance
- Point Accumulation (berdasarkan transaksi dummy)
- Point Redemption
- Point Exchange antar partner
- Reward Catalog
- Transaction History
- Audit Trail
- Unit Testing

**Nice to Have (kalau waktu memungkinkan):**

- Membership Tier (Bronze/Silver/Gold)
- Dashboard Summary
- Configurable Exchange Rate
- Expired Point
- Transfer Point antar member