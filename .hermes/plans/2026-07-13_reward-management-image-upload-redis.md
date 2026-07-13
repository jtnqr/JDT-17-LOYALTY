# Reward Management, Image Upload, Admin Transactions & Redis Plan

> **Status:** COMPLETED.

**Goal:** Add reward CRUD (admin), image upload for rewards + partners, admin transaction list endpoint, and Redis caching. Update TSD + FSD to reflect changes.

**Branch:** `feat/reward-management-image-upload-redis`

**Deadline:** 2026-07-14

---

## Scope Summary

| Area | What changes |
|------|-------------|
| DB (Flyway V7) | `image_url` on `mst_reward`, `logo_url` on `mst_partner` |
| DB (Flyway V8) | Update seed image URLs for 11 rewards + 2 partners |
| Backend: ImageStorageService | Shared file upload util (rewards/ + partners/ subfolders) |
| Backend: RewardController | POST /rewards, PUT /rewards/{id}, PUT /rewards/{id}/image |
| Backend: PartnerController | PUT /partners/{id}/image (add to existing controller) |
| Backend: TransactionController | GET /api/v1/transactions (ADMIN, paginated, ?type=) |
| Backend: Redis | Cache GET /rewards, GET /partners, GET /exchange-rates |
| Backend: SecurityConfig | New endpoint rules |
| Backend: application.yml | Redis + multipart config |
| Backend: docker-compose.yml | Redis container + uploads volume |
| Frontend: Admin rewards page | List, create, edit, image upload |
| Frontend: Admin transactions page | Replace member list with real tx data |
| Frontend: rewards/page.tsx | Fix imageUrl + badgeBg (already wired, just broken) |
| Docs | TSD.md + FSD.md additions (no restructuring) |

---

## Architecture Notes

- Image files stored at `/app/uploads/{rewards|partners}/{uuid}.ext` inside container
- DB stores relative path: `/uploads/rewards/abc.jpg`
- Spring `WebMvcConfigurer` serves `/uploads/**` as static resources from Docker volume
- Redis cache keys: `rewards`, `partners`, `exchange-rates`
- Cache evicted on any write to the respective entity
- `GET /api/v1/transactions` is ADMIN-only — does not breach member privacy (admin cannot drill into per-member history, this is aggregate)
- Two-step image upload: reward/partner saved first (JSON), image uploaded separately via `PUT /{id}/image`

---

## Task 1: Flyway V7 — Add image columns

**Objective:** Add `image_url` to `mst_reward` and `logo_url` to `mst_partner`.

**Files:**
- Create: `backend/src/main/resources/db/migration/V7__add_image_columns.sql`

**SQL:**
```sql
ALTER TABLE mst_reward ADD COLUMN image_url VARCHAR(500);
ALTER TABLE mst_partner ADD COLUMN logo_url VARCHAR(500);
```

**Verify:** `docker compose up -d` — backend logs show `V7 migration applied`.

**Commit:** `chore(db): V7 add image_url to reward and logo_url to partner`

---

## Task 2: Flyway V8 — Seed image URLs

**Objective:** Populate existing 11 rewards and 2 partners with real public image URLs for demo.

**Files:**
- Create: `backend/src/main/resources/db/migration/V8__seed_image_urls.sql`

**SQL (use real publicly accessible food CDN images):**
```sql
-- Partners
UPDATE mst_partner SET logo_url = 'https://upload.wikimedia.org/wikipedia/en/b/bf/KFC_logo.svg'
  WHERE code = 'KFC';
UPDATE mst_partner SET logo_url = 'https://upload.wikimedia.org/wikipedia/commons/3/36/McDonald%27s_Golden_Arches.svg'
  WHERE code = 'MCD';

-- KFC rewards (use placeholder food images — swap for real before demo)
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1626645738196-c2a7c87a8f58?w=400'
  WHERE name = 'KFC Original Recipe Chicken 1pc';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400'
  WHERE name = 'KFC French Fries Regular';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
  WHERE name = 'KFC Zinger Burger';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1598514982901-ae62764ae75e?w=400'
  WHERE name = 'KFC Family Bucket (9pc)';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1622483767028-3f66f32aef97?w=400'
  WHERE name = 'KFC Pepsi Regular';

-- McD rewards
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=400'
  WHERE name = 'Big Mac Burger';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1562802378-063ec186a863?w=400'
  WHERE name = 'McNuggets 6pcs';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1563805042-7684c019e1cb?w=400'
  WHERE name = 'McFlurry Oreo';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1541592106381-b31e9677c0e5?w=400'
  WHERE name = 'French Fries Large';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1509042239860-f550ce710b93?w=400'
  WHERE name = 'McCafe Latte';
UPDATE mst_reward SET image_url = 'https://images.unsplash.com/photo-1561758033-d89a9ad46330?w=400'
  WHERE name = 'McValue Meal (Burger + Fries + Drink)';
```

**Commit:** `chore(db): V8 seed image URLs for rewards and partners`

---

## Task 3: Update entities + DTOs

**Objective:** Reflect new DB columns in JPA entities and response DTOs.

**Files:**
- Modify: `backend/src/main/java/com/jdt17/loyalty/entity/Reward.java`
- Modify: `backend/src/main/java/com/jdt17/loyalty/entity/Partner.java`
- Modify: `backend/src/main/java/com/jdt17/loyalty/dto/reward/RewardResponse.java`
- Modify: `backend/src/main/java/com/jdt17/loyalty/dto/partner/PartnerResponse.java`

**Reward.java — add field:**
```java
@Column(name = "image_url")
private String imageUrl;
```

**Partner.java — add field:**
```java
@Column(name = "logo_url")
private String logoUrl;
```

**RewardResponse.java — add field:**
```java
private String imageUrl;
private String partnerCode; // needed for frontend badgeBg logic
```

**PartnerResponse.java — add field:**
```java
private String logoUrl;
```

Update all builder calls in services that construct these DTOs to include the new fields.

**Commit:** `feat(entity): add imageUrl to Reward and logoUrl to Partner`

---

## Task 4: Redis setup

**Objective:** Add Redis container and Spring cache config.

**Files:**
- Modify: `docker-compose.yml`
- Modify: `backend/pom.xml`
- Modify: `backend/src/main/resources/application.yml`
- Create: `backend/src/main/java/com/jdt17/loyalty/config/CacheConfig.java`

**docker-compose.yml additions:**
```yaml
redis:
  image: redis:7-alpine
  container_name: loyalty-redis
  restart: unless-stopped
  networks:
    - loyalty-net

uploads:
  image: busybox  # dummy — just declares the volume
# add to backend service:
  volumes:
    - uploads:/app/uploads

volumes:
  postgres_data:
  uploads:  # add this
```

**pom.xml — add dependency:**
```xml
<dependency>
  <groupId>org.springframework.boot</groupId>
  <artifactId>spring-boot-starter-data-redis</artifactId>
</dependency>
```

**application.yml additions:**
```yaml
spring:
  data:
    redis:
      host: ${REDIS_HOST:redis}
      port: 6379
  cache:
    type: redis
  servlet:
    multipart:
      max-file-size: 2MB
      max-request-size: 5MB

app:
  uploads:
    dir: ${UPLOAD_DIR:/app/uploads}
```

**CacheConfig.java:**
```java
@Configuration
@EnableCaching
public class CacheConfig {
    @Bean
    public RedisCacheConfiguration cacheConfiguration() {
        return RedisCacheConfiguration.defaultCacheConfig()
            .entryTtl(Duration.ofMinutes(10))
            .disableCachingNullValues()
            .serializeValuesWith(
                RedisSerializationContext.SerializationPair
                    .fromSerializer(new GenericJackson2JsonRedisSerializer())
            );
    }
}
```

**Commit:** `feat(infra): add Redis container and Spring cache config`

---

## Task 5: ImageStorageService

**Objective:** Shared service for saving/deleting uploaded image files.

**Files:**
- Create: `backend/src/main/java/com/jdt17/loyalty/service/ImageStorageService.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/config/WebMvcConfig.java`

**ImageStorageService.java:**
```java
@Service
public class ImageStorageService {

    @Value("${app.uploads.dir:/app/uploads}")
    private String uploadDir;

    private static final Set<String> ALLOWED_TYPES =
        Set.of("image/jpeg", "image/png", "image/webp");

    public String store(MultipartFile file, String subfolder) throws IOException {
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_TYPES.contains(contentType)) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST,
                "Only JPEG, PNG, WEBP allowed", "INVALID_FILE_TYPE");
        }
        if (file.getSize() > 2 * 1024 * 1024) {
            throw new LoyaltyException(HttpStatus.BAD_REQUEST,
                "File exceeds 2MB limit", "FILE_TOO_LARGE");
        }

        String ext = contentType.split("/")[1].replace("jpeg", "jpg");
        String filename = UUID.randomUUID() + "." + ext;
        Path target = Paths.get(uploadDir, subfolder, filename);
        Files.createDirectories(target.getParent());
        Files.copy(file.getInputStream(), target, StandardCopyOption.REPLACE_EXISTING);

        return "/uploads/" + subfolder + "/" + filename;
    }

    public void delete(String relativePath) {
        if (relativePath == null) return;
        try {
            Files.deleteIfExists(Paths.get(uploadDir,
                relativePath.replaceFirst("^/uploads/", "")));
        } catch (IOException ignored) {}
    }
}
```

**WebMvcConfig.java:**
```java
@Configuration
public class WebMvcConfig implements WebMvcConfigurer {
    @Value("${app.uploads.dir:/app/uploads}")
    private String uploadDir;

    @Override
    public void addResourceHandlers(ResourceHandlerRegistry registry) {
        registry.addResourceHandler("/uploads/**")
            .addResourceLocations("file:" + uploadDir + "/");
    }
}
```

**SecurityConfig** — permit `/uploads/**` (public static files, no auth needed):
```java
.requestMatchers("/uploads/**").permitAll()
```

**Commit:** `feat(storage): add ImageStorageService and static resource config`

---

## Task 6: Reward CRUD backend

**Objective:** POST /rewards, PUT /rewards/{id}, PUT /rewards/{id}/image (all ADMIN).

**Files:**
- Create: `backend/src/main/java/com/jdt17/loyalty/dto/reward/CreateRewardRequest.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/dto/reward/UpdateRewardRequest.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/service/RewardService.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/controller/RewardController.java`

**CreateRewardRequest.java:**
```java
@Data
public class CreateRewardRequest {
    @NotBlank private String name;
    @NotNull @Positive private Integer pointCost;
    @NotNull private UUID partnerId;
}
```

**UpdateRewardRequest.java:**
```java
@Data
public class UpdateRewardRequest {
    private String name;
    @Positive private Integer pointCost;
    @Pattern(regexp = "ACTIVE|INACTIVE") private String status;
}
```

**RewardService — methods:**
- `getRewards(UUID partnerId)` — existing logic, add `@Cacheable("rewards")`
- `createReward(CreateRewardRequest)` — ADMIN, `@CacheEvict(value="rewards", allEntries=true)`
- `updateReward(UUID id, UpdateRewardRequest)` — ADMIN, `@CacheEvict`
- `uploadRewardImage(UUID id, MultipartFile file)` — ADMIN, calls `ImageStorageService.store()`, deletes old file, `@CacheEvict`

**RewardController endpoints:**
```
GET    /api/v1/rewards              → MEMBER + ADMIN (existing)
POST   /api/v1/rewards              → ADMIN only
PUT    /api/v1/rewards/{id}         → ADMIN only
PUT    /api/v1/rewards/{id}/image   → ADMIN only (multipart)
```

**SecurityConfig additions:**
```java
.requestMatchers(HttpMethod.POST, "/api/v1/rewards").hasRole("ADMIN")
.requestMatchers(HttpMethod.PUT, "/api/v1/rewards/**").hasRole("ADMIN")
```

**Tests:**
- Create: `backend/src/test/java/com/jdt17/loyalty/service/RewardServiceTest.java`
- Create: `backend/src/test/java/com/jdt17/loyalty/controller/RewardControllerTest.java`
- Cover: create, update, upload image, REWARD_NOT_FOUND, PARTNER_NOT_FOUND, invalid file type, 100% JaCoCo

**Commit:** `feat(reward): add reward CRUD and image upload endpoints`

---

## Task 7: Partner image upload backend

**Objective:** PUT /partners/{id}/image (ADMIN).

**Files:**
- Modify: `backend/src/main/java/com/jdt17/loyalty/service/PartnerService.java`
- Modify: `backend/src/main/java/com/jdt17/loyalty/controller/PartnerController.java`

**PartnerService — add method:**
```java
@CacheEvict(value = "partners", allEntries = true)
public PartnerResponse uploadPartnerImage(UUID id, MultipartFile file) {
    Partner partner = partnerRepository.findById(id)
        .orElseThrow(() -> new LoyaltyException(NOT_FOUND, "Partner not found", "PARTNER_NOT_FOUND"));
    imageStorageService.delete(partner.getLogoUrl());
    String url = imageStorageService.store(file, "partners");
    partner.setLogoUrl(url);
    return toResponse(partnerRepository.save(partner));
}
```

Also add `@Cacheable("partners")` to `getAllPartners()` and `@CacheEvict` to `createPartner()` + `updatePartner()`.

**PartnerController — add endpoint:**
```java
@PutMapping(value = "/{id}/image", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
public ResponseEntity<PartnerResponse> uploadImage(
    @PathVariable UUID id,
    @RequestParam("image") MultipartFile file) {
    return ResponseEntity.ok(partnerService.uploadPartnerImage(id, file));
}
```

**SecurityConfig:**
```java
.requestMatchers(HttpMethod.PUT, "/api/v1/partners/**").hasRole("ADMIN")
```

**Commit:** `feat(partner): add logo image upload endpoint and Redis cache`

---

## Task 8: Admin transaction list endpoint

**Objective:** GET /api/v1/transactions (ADMIN, paginated, optional ?type=).

**Files:**
- Modify: `backend/src/main/java/com/jdt17/loyalty/repository/TransactionRepository.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/dto/transaction/AdminTransactionResponse.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/dto/transaction/AdminTransactionListResponse.java`
- Create: `backend/src/main/java/com/jdt17/loyalty/service/AdminTransactionService.java`
- Modify: `backend/src/main/java/com/jdt17/loyalty/controller/TransactionController.java`

**TransactionRepository — add query:**
```java
@Query("SELECT t FROM Transaction t WHERE (:type IS NULL OR t.type = :type) ORDER BY t.createdAt DESC")
Page<Transaction> findAllByType(@Param("type") String type, Pageable pageable);
```

**AdminTransactionResponse fields:**
```
id, memberId, memberName, partnerId, partnerName,
type, points, trxAmountIdr, rewardId, createdAt
```

**AdminTransactionService:**
- `getTransactions(String type, Pageable pageable)` — calls `findAllByType`, maps to DTO

**TransactionController — add:**
```java
@GetMapping
@PreAuthorize("hasRole('ADMIN')")
public ResponseEntity<AdminTransactionListResponse> getTransactions(
    @RequestParam(required = false) String type,
    @RequestParam(defaultValue = "0") int page,
    @RequestParam(defaultValue = "20") int size) { ... }
```

**SecurityConfig:**
```java
.requestMatchers(HttpMethod.GET, "/api/v1/transactions").hasRole("ADMIN")
```

**Tests:**
- Create: `backend/src/test/java/com/jdt17/loyalty/service/AdminTransactionServiceTest.java`
- Create: `backend/src/test/java/com/jdt17/loyalty/controller/AdminTransactionControllerTest.java`
- Cover: no filter, type filter, empty result, ADMIN-only enforcement

**Commit:** `feat(admin): add GET /transactions endpoint for admin`

---

## Task 9: Frontend — Fix reward imageUrl + badgeBg

**Objective:** `rewards/page.tsx` already reads `reward.imageUrl` and `reward.badgeBg` — both undefined. Map them from API response.

**Files:**
- Modify: `frontend/src/app/rewards/page.tsx`

Backend now returns `imageUrl` and `partnerCode`. Map `partnerCode` → `badgeBg`:
```tsx
const BADGE_COLORS: Record<string, string> = {
  KFC: "bg-red-100 text-red-700",
  MCD: "bg-yellow-100 text-yellow-700",
};

// in filteredRewards.map():
const badgeBg = BADGE_COLORS[reward.partnerCode] ?? "bg-neutral-100 text-neutral-600";
```

Add fallback for broken images:
```tsx
<img
  src={reward.imageUrl || "/placeholder-food.png"}
  alt={reward.name}
  onError={(e) => { e.currentTarget.src = "/placeholder-food.png"; }}
/>
```

Add `/placeholder-food.png` to `frontend/public/`.

**Commit:** `fix(frontend): map imageUrl and badgeBg from API in rewards page`

---

## Task 10: Frontend — Admin rewards management page

**Objective:** New page at `/admin/rewards` — list rewards, create, edit, upload image.

**Files:**
- Create: `frontend/src/app/admin/rewards/page.tsx`
- Modify: `frontend/src/components/organisms/AdminSidebar.tsx` (add Rewards nav item)

**Page features:**
- Table: reward name, partner, point cost, status, image preview thumbnail, actions
- "Add Reward" button → inline form or modal: name, partnerId (dropdown from GET /partners), pointCost
- Edit row: name, pointCost, status (ACTIVE/INACTIVE toggle)
- Image upload: file picker per row, calls `PUT /rewards/{id}/image`
- React Query: `queryKey: ["admin-rewards"]`, invalidate on mutations
- Error display for PARTNER_NOT_FOUND, REWARD_NOT_FOUND

**Commit:** `feat(frontend): add admin reward management page`

---

## Task 11: Frontend — Admin transactions page update

**Objective:** Replace current member-list placeholder with real transaction data from `GET /api/v1/transactions`.

**Files:**
- Modify: `frontend/src/app/admin/transactions/page.tsx`

**Changes:**
- Drop `GET /members` fetch
- Add `GET /api/v1/transactions?page=0&size=20&type=` fetch
- Add type filter tabs: ALL / EARN / REDEEM / EXCHANGE_OUT / EXCHANGE_IN / EXPIRED
- Table columns: type badge, member name, partner, points, amount IDR (if EARN), date
- Keep privacy alert banner (admin cannot drill into per-member history)
- Pagination controls

**Commit:** `feat(frontend): update admin transactions page with real data`

---

## Task 12: Update TSD.md

**Objective:** Append new sections — do NOT restructure existing content.

**Additions:**

1. **MST_REWARD table** — add `image_url VARCHAR(500) NULLABLE` row
2. **MST_PARTNER table** — add `logo_url VARCHAR(500) NULLABLE` row
3. **Flyway table** — add V7 + V8 entries
4. **New endpoints section:**
   - `POST /api/v1/rewards` (ADMIN)
   - `PUT /api/v1/rewards/{id}` (ADMIN)
   - `PUT /api/v1/rewards/{id}/image` (ADMIN, multipart)
   - `PUT /api/v1/partners/{id}/image` (ADMIN, multipart)
   - `GET /api/v1/transactions` (ADMIN, paginated, ?type=)
5. **Auth matrix** — add rows for new endpoints
6. **Infrastructure** — Redis container, uploads volume, multipart limits, static resource serving
7. **RewardResponse DTO** — add `imageUrl`, `partnerCode` fields
8. **PartnerResponse DTO** — add `logoUrl` field

**Commit:** `docs(tsd): add reward management, image upload, redis, admin transactions`

---

## Task 13: Update FSD.md

**Objective:** Add functional descriptions for new capabilities.

**Additions:**

1. **Use case: Admin manages reward catalog**
   - Admin can create rewards (name, partner, point cost)
   - Admin can update reward name, point cost, status
   - Admin can upload reward image (JPEG/PNG/WEBP, max 2MB)
   - Image displayed on member rewards page

2. **Use case: Admin uploads partner logo**
   - Admin can upload logo for each partner
   - Logo displayed on partner cards across app

3. **Use case: Admin views transaction activity**
   - Admin views aggregate transaction log (all members)
   - Filter by type: EARN, REDEEM, EXCHANGE_IN, EXCHANGE_OUT, EXPIRED
   - Paginated, sorted by date DESC
   - Admin cannot drill into per-member balance (privacy rule preserved)

4. **Non-functional: Redis caching**
   - Rewards, partners, exchange rates cached in Redis (10min TTL)
   - Cache evicted on any write to respective entity
   - Improves read performance, signals production-readiness

**Commit:** `docs(fsd): add reward management, image upload, admin transactions use cases`

---

## Verification Steps

```bash
# 1. Backend builds clean
cd backend && mvn clean verify

# 2. All migrations apply
docker compose up -d && docker compose logs backend | grep -E "V[0-9]+"

# 3. Image upload works
curl -X PUT http://localhost:8082/api/v1/rewards/{id}/image \
  -H "Authorization: Bearer $ADMIN_TOKEN" \
  -F "image=@test.jpg"

# 4. Static file served
curl http://localhost:8082/uploads/rewards/{filename}.jpg

# 5. Admin transactions endpoint
curl http://localhost:8082/api/v1/transactions?type=REDEEM \
  -H "Authorization: Bearer $ADMIN_TOKEN"

# 6. Redis cache hit
docker exec loyalty-redis redis-cli KEYS "*"

# 7. JaCoCo 100% on new classes
mvn verify && open target/site/jacoco/index.html

# 8. Frontend rewards page shows images
# Open http://localhost:3000/rewards — reward cards show food images

# 9. Admin rewards page CRUD
# Open http://localhost:3000/admin/rewards — create, edit, upload
```

---

## Risks / Notes

| Risk | Mitigation |
|------|-----------|
| Seed image URLs (Unsplash) may have CORS or rate limits | Test URLs before demo; swap to direct CDN links if needed |
| Redis cold start before backend | `depends_on: redis` in docker-compose backend service |
| JaCoCo 100% on ImageStorageService | Mock `Files` operations or use temp dir in tests |
| `@Cacheable` + `ListRewardResponse` must be serializable | Ensure all DTOs implement `Serializable` or use Jackson JSON serializer |
| Existing `PartnerService.getAllPartners()` uses `findAll()` without pagination | Note: scope says only new endpoints paginated; leave existing as-is for now |
| V7/V8 migrations need clean DB or will fail if column exists | Flyway checksums protect this — never edit existing migrations |

---

**Estimated effort:** 6-8h full implementation + tests + docs
**Files created/modified:** ~30
