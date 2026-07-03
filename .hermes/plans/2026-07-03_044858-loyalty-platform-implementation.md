# JDT-17-LOYALTY Platform Implementation Plan

> **For Hermes:** Use test-driven-development skill for all backend tasks. Frontend can use component-driven development.

**Goal:** Build a full-stack loyalty points platform with member/admin web UI, partner API integration, point accumulation/exchange/redemption, and audit trail.

**Architecture:** 
- **Backend:** Spring Boot 4.1.x (Java 21) REST API with PostgreSQL 18, JWT authentication, JPA/Hibernate ORM
- **Frontend:** Next.js 16 with App Router, shadcn/ui components, Tailwind CSS, mobile-first responsive design
- **Deployment:** Docker Compose stack with PostgreSQL, backend (port 8080), frontend (port 3000)

**Tech Stack:**
- Backend: Java 21, Spring Boot 4.1.x, Spring Security, Spring Data JPA, PostgreSQL 18, Flyway, JUnit 5, Mockito
- Frontend: Next.js 16, React 19, TypeScript, shadcn/ui, Tailwind CSS, React Query (TanStack), Zod validation
- DevOps: Docker, Docker Compose, Maven

**Deadline:** July 14, 2026 (11 days)

---

## Phase 1: Project Infrastructure & Database Setup

### Task 1.1: Initialize Spring Boot Backend Project

**Objective:** Generate Spring Boot 4.1.x project structure with required dependencies.

**Files:**
- Create: `backend/pom.xml`
- Create: `backend/src/main/resources/application.yml`
- Create: `backend/.gitignore`

**Step 1: Generate project via Spring Initializr**

Use terminal or web:
```bash
cd /home/jtnqr/git/JDT-17-LOYALTY
curl https://start.spring.io/starter.zip \
  -d dependencies=web,data-jpa,postgresql,security,validation,flyway \
  -d type=maven-project \
  -d language=java \
  -d bootVersion=4.1.0 \
  -d baseDir=backend \
  -d groupId=com.loyalty \
  -d artifactId=loyalty-platform \
  -d name=loyalty-platform \
  -d packageName=com.loyalty.platform \
  -d javaVersion=21 \
  -o backend.zip

unzip backend.zip
rm backend.zip
```

**Step 2: Add additional dependencies to pom.xml**

Add inside `<dependencies>`:
```xml
<!-- JWT -->
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-api</artifactId>
    <version>0.12.5</version>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-impl</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>
<dependency>
    <groupId>io.jsonwebtoken</groupId>
    <artifactId>jjwt-jackson</artifactId>
    <version>0.12.5</version>
    <scope>runtime</scope>
</dependency>

<!-- Lombok -->
<dependency>
    <groupId>org.projectlombok</groupId>
    <artifactId>lombok</artifactId>
    <optional>true</optional>
</dependency>

<!-- SpringDoc OpenAPI (Swagger) -->
<dependency>
    <groupId>org.springdoc</groupId>
    <artifactId>springdoc-openapi-starter-webmvc-ui</artifactId>
    <version>2.3.0</version>
</dependency>
```

**Step 3: Configure application.yml**

Create `backend/src/main/resources/application.yml`:
```yaml
spring:
  application:
    name: loyalty-platform
  
  datasource:
    url: jdbc:postgresql://${DB_HOST:localhost}:${DB_PORT:5432}/${DB_NAME:loyalty_db}
    username: ${DB_USER:loyalty_user}
    password: ${DB_PASSWORD:loyalty_pass}
    driver-class-name: org.postgresql.Driver
  
  jpa:
    hibernate:
      ddl-auto: validate
    show-sql: false
    properties:
      hibernate:
        dialect: org.hibernate.dialect.PostgreSQLDialect
        format_sql: true
  
  flyway:
    enabled: true
    baseline-on-migrate: true
    locations: classpath:db/migration

server:
  port: 8080
  error:
    include-message: always
    include-binding-errors: always

springdoc:
  api-docs:
    path: /api-docs
  swagger-ui:
    path: /swagger-ui.html

jwt:
  secret: ${JWT_SECRET:change-this-secret-in-production-min-256-bits-long}
  expiration: 86400000  # 24 hours in milliseconds

logging:
  level:
    com.loyalty.platform: DEBUG
    org.springframework.security: DEBUG
```

**Step 4: Verify build**

Run:
```bash
cd backend
./mvnw clean compile
```

Expected: BUILD SUCCESS

**Step 5: Commit**

```bash
git add backend/
git commit -m "chore: initialize Spring Boot 4.1.x backend project"
```

---

### Task 1.2: Initialize Next.js Frontend Project

**Objective:** Generate Next.js 14 project with App Router, TypeScript, Tailwind CSS.

**Files:**
- Create: `frontend/` (entire Next.js structure)
- Create: `frontend/package.json`
- Create: `frontend/tailwind.config.ts`
- Create: `frontend/tsconfig.json`

**Step 1: Generate Next.js project**

```bash
cd /home/jtnqr/git/JDT-17-LOYALTY
npx create-next-app@latest frontend \
  --typescript \
  --tailwind \
  --app \
  --src-dir \
  --import-alias "@/*" \
  --no-eslint
```

Answer prompts:
- TypeScript: Yes
- ESLint: No (will configure later)
- Tailwind CSS: Yes
- `src/` directory: Yes
- App Router: Yes
- Import alias: Yes (@/*)

**Step 2: Install shadcn/ui**

```bash
cd frontend
npx shadcn-ui@latest init
```

Answer prompts:
- Style: Default
- Base color: Slate
- CSS variables: Yes

**Step 3: Install additional dependencies**

```bash
npm install @tanstack/react-query axios zod react-hook-form @hookform/resolvers date-fns
npm install -D @types/node
```

**Step 4: Verify dev server**

```bash
npm run dev
```

Expected: Server starts on http://localhost:3000

Stop server (Ctrl+C).

**Step 5: Commit**

```bash
git add frontend/
git commit -m "chore: initialize Next.js 14 frontend with shadcn/ui and Tailwind"
```

---

### Task 1.3: Setup Docker Compose Stack

**Objective:** Create docker-compose.yml for PostgreSQL, backend, and frontend services.

**Files:**
- Create: `docker-compose.yml`
- Create: `.env.example`
- Create: `backend/Dockerfile`
- Create: `frontend/Dockerfile`

**Step 1: Create docker-compose.yml**

Create `docker-compose.yml`:
```yaml
version: '3.8'

services:
  db:
    image: postgres:18-alpine
    container_name: loyalty-db
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME:-loyalty_db}
      POSTGRES_USER: ${DB_USER:-loyalty_user}
      POSTGRES_PASSWORD: ${DB_PASSWORD:-loyalty_pass}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
    networks:
      - loyalty-network

  backend:
    build:
      context: ./backend
      dockerfile: Dockerfile
    container_name: loyalty-backend
    restart: unless-stopped
    environment:
      DB_HOST: db
      DB_PORT: 5432
      DB_NAME: ${DB_NAME:-loyalty_db}
      DB_USER: ${DB_USER:-loyalty_user}
      DB_PASSWORD: ${DB_PASSWORD:-loyalty_pass}
      JWT_SECRET: ${JWT_SECRET:-change-this-secret-in-production-min-256-bits-long}
    ports:
      - "8080:8080"
    depends_on:
      - db
    networks:
      - loyalty-network

  frontend:
    build:
      context: ./frontend
      dockerfile: Dockerfile
    container_name: loyalty-frontend
    restart: unless-stopped
    environment:
      NEXT_PUBLIC_API_URL: ${API_URL:-http://localhost:8080}
    ports:
      - "3000:3000"
    depends_on:
      - backend
    networks:
      - loyalty-network

volumes:
  postgres_data:

networks:
  loyalty-network:
    driver: bridge
```

**Step 2: Create .env.example**

Create `.env.example`:
```bash
# Database
DB_NAME=loyalty_db
DB_USER=loyalty_user
DB_PASSWORD=change_me_in_production
DB_PORT=5432

# JWT
JWT_SECRET=your-super-secret-jwt-key-min-256-bits-change-in-production

# API
API_URL=http://localhost:8080
```

**Step 3: Create backend Dockerfile**

Create `backend/Dockerfile`:
```dockerfile
FROM eclipse-temurin:21-jdk-alpine AS build
WORKDIR /app
COPY pom.xml .
COPY src ./src
RUN ./mvnw clean package -DskipTests

FROM eclipse-temurin:21-jre-alpine
WORKDIR /app
COPY --from=build /app/target/*.jar app.jar
EXPOSE 8080
ENTRYPOINT ["java", "-jar", "app.jar"]
```

**Step 4: Create frontend Dockerfile**

Create `frontend/Dockerfile`:
```dockerfile
FROM node:20-alpine AS build
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build

FROM node:20-alpine
WORKDIR /app
COPY --from=build /app/.next ./.next
COPY --from=build /app/public ./public
COPY --from=build /app/package*.json ./
RUN npm ci --only=production
EXPOSE 3000
CMD ["npm", "start"]
```

**Step 5: Create .env from template**

```bash
cp .env.example .env
chmod 600 .env
```

**Step 6: Commit**

```bash
git add docker-compose.yml .env.example backend/Dockerfile frontend/Dockerfile .gitignore
# Update .gitignore to exclude .env
echo ".env" >> .gitignore
git commit -m "chore: add Docker Compose stack with PostgreSQL, backend, frontend"
```

---

### Task 2.2: Repositories

**Objective:** Spring Data JPA repositories with custom queries for business logic.

MemberRepository:
```java
public interface MemberRepository extends JpaRepository<Member, UUID> {
    Optional<Member> findByEmail(String email);
    Optional<Member> findByPhone(String phone);
}
```

TransactionRepository:
```java
public interface TransactionRepository extends JpaRepository<Transaction, UUID> {
    Page<Transaction> findByMemberIdOrderByCreatedAtDesc(UUID memberId, Pageable pageable);
    
    @Query("SELECT t FROM Transaction t WHERE t.type = 'EARN' AND t.expiresAt <= :now AND t.points > 0")
    List<Transaction> findExpiredEarnTransactions(@Param("now") Instant now);
}
```

**Commit:** `git commit -m "feat: add Spring Data JPA repositories"`

---

## Phase 3: Backend Core Services (TDD)

All business logic services follow test-driven development. Write failing test first, implement minimal code to pass, refactor, commit.

### Task 3.1: Member Service + Auth Service

Implement member registration (auto-init balances for all partners), get, update, status toggle. All write operations log audit trail.

### Task 3.2: Transaction Service (EARN)

Formula: `pointsEarned = (trxAmount / 1000) * partner.pointsPerThousandIdr`
Expiry: `expiresAt = now + partner.expiryDays days`

Tests must verify: correct calculation, inactive member rejection, atomic balance update.

### Task 3.3: Expiry Scheduler

`@Scheduled(cron = "0 0 1 * * *")` — daily at 1am, deducts expired points, creates EXPIRED transaction records.

### Task 3.4: Exchange Service

Target points: `floor(sourcePoints * exchangeRate.rate)`
Atomic: deduct source, credit target, create EXCHANGE_OUT + EXCHANGE_IN transactions (linked via relatedTxId).

### Task 3.5: Redemption Service

Validate balance >= reward.pointCost, deduct, create REDEEM transaction.

### Task 3.6: Read Endpoints

GET /partners, GET /rewards, GET /members, GET /members/{id}/points, GET /members/{id}/transactions (paginated)

**Key:** POST /partners must auto-initialize balance=0 for all existing members.

---

## Phase 4: Frontend (Next.js 16)

### Task 4.1: Setup

API client (axios + token injection + 401 redirect), React Query provider, Tailwind design tokens, shadcn components.

### Task 4.2: Auth Pages

Register (Screen 1) and Login with Zod validation. Store JWT in localStorage, redirect by role.

### Task 4.3: Member Screens (2-6)

- Screen 2: Home (balances + recent activity)
- Screen 3: Reward catalog (2-col grid, partner filters)
- Screen 4: Redemption confirm (bottom sheet)
- Screen 5: Exchange (with real-time preview)
- Screen 6: Transaction history (paginated, filtered)

Bottom tab bar: Home · Rewards · Exchange · History

### Task 4.4: Admin CMS (7-8)

- Screen 7: Member list (search, status filter, table, pagination)
- Screen 8: Member detail (view/edit toggle, status change, point balances card)

Sidebar nav: Members · Partners

---

## Phase 5: Integration

1. Run full test suite: `./mvnw test`
2. Smoke test via Swagger UI (manual flow: register → earn → exchange → redeem)
3. Docker Compose full stack test
4. Seed demo data (V4 migration)
5. Update FSD/TSD to match implementation
6. Final commit + push

---

## Demo Script (5 minutes)

1. Show registration
2. Login as member → home with balances
3. Browse rewards, redeem one
4. Exchange KFC pts → McD
5. View transaction history
6. Switch to admin → member list
7. Open member detail, toggle status INACTIVE
8. Attempt partner transaction for inactive member → show 422 error

**Deadline: July 14, 2026 (11 days from now)**

---

**Plan complete. 93 story points across 6 phases. Backend uses strict TDD. Frontend uses component-driven development. Docker Compose handles deployment. All specs will be updated after implementation to match reality.**
