# PISTOS Frontend — Production Readiness Audit
**Date:** 2026-07-24  
**Auditor:** Hermes (automated)  
**Stack:** Next.js 16, React 19, App Router, shadcn/ui + Tailwind v4  
**Docker target:** `http://backend:8080`

---

## Summary

| Severity | Count |
|----------|-------|
| 🔴 FAIL  | 2     |
| 🟡 WARN  | 5     |
| ✅ PASS  | 11    |

---

## 🔴 FAIL

### F1 — `console.log` in production build config
**File:** `next.config.ts:10`  
```ts
console.log("Rewrites configured with backendUrl:", backendUrl);
```
This runs at **build time inside the Docker image** and leaks the resolved `backendUrl` to any log aggregator that captures the build stage. Not a runtime risk but is debug noise in prod and exposes infra topology.  
**Fix:** Remove the line.

---

### F2 — Cookie security flags missing (`authCookies.ts`)
**File:** `src/lib/authCookies.ts:1`  
```ts
const COOKIE_OPTIONS = "; path=/; SameSite=Lax";
```
`Secure` flag is absent. On HTTPS (production), the `token` and `role` cookies will be sent without the `Secure` attribute, making them transmittable over plain HTTP if the connection is ever downgraded or a mixed-content request is made.  
**Fix:**
```ts
const COOKIE_OPTIONS = "; path=/; SameSite=Lax; Secure";
```
If dev local HTTP is needed, gate it: `process.env.NODE_ENV === "production" ? "; Secure" : ""`.

---

## 🟡 WARN

### W1 — `NEXT_PUBLIC_API_URL` fallback to `http://localhost:8080` in `next.config.ts`
**File:** `next.config.ts:7-9`  
```ts
process.env.BACKEND_URL ||
process.env.NEXT_PUBLIC_API_URL ||
"http://localhost:8080"
```
If neither Docker ARG is passed at build time, rewrites silently target localhost instead of `http://backend:8080`. In a mis-configured build this fails silently (all `/api/v1/*` calls succeed client-side but reach nothing).  
**Severity:** WARN — not a bug if the Dockerfile always supplies `BACKEND_URL`, but there is no assertion.  
**Fix:** Add a build-time assertion:
```ts
if (!backendUrl || backendUrl === "http://localhost:8080") {
  console.warn("[next.config] WARNING: BACKEND_URL not set — falling back to localhost.");
}
```
Or fail-fast: `if (!process.env.BACKEND_URL && !process.env.NEXT_PUBLIC_API_URL) throw new Error("BACKEND_URL required");`

---

### W2 — Proxy middleware (`src/proxy.ts`) trusts `role` cookie for authorization without JWT verification
**File:** `src/proxy.ts:16,43,57`  
```ts
const role = request.cookies.get("role")?.value;
// ...
if (role !== "ADMIN") redirect to /dashboard
```
The middleware reads the plain `role` cookie set by `authCookies.ts` (not a signed/encrypted value). Any user can manually set `document.cookie = "role=ADMIN; path=/"` and bypass the `/admin` redirect check client-side. The middleware will see `role === "ADMIN"` and pass the request.  
**Impact:** The actual API calls will still fail (backend validates JWT), so data is safe. But the admin UI will render for a fake-admin with no data — or worse, an ADMIN JWT replayed in localStorage could allow full admin API access.  
**Fix (short-term):** Move the role into a server-signed cookie (HttpOnly, Secure, signed) or verify the JWT in the middleware itself using the `jose` library with the shared `JWT_SECRET`.  
**Fix (practical, low-cost):** At minimum make the `role` cookie `HttpOnly` so JS cannot read/write it. Note this requires moving cookie-setting to a server route (API route or server action), not `document.cookie`.

---

### W3 — No `.env.example` in `frontend/`
No `.env.example` file exists under `frontend/`. The root `.env.example` documents backend variables but not frontend-specific ones (`BACKEND_URL`, `NEXT_PUBLIC_API_URL`, `NEXT_PUBLIC_REFETCH_INTERVAL`, `NEXT_PUBLIC_API_TIMEOUT`).  
**Fix:** Create `frontend/.env.example`:
```
BACKEND_URL=http://backend:8080
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_REFETCH_INTERVAL=5000
NEXT_PUBLIC_API_TIMEOUT=15000
```

---

### W4 — `console.warn` left in admin/partners page
**File:** `src/app/admin/partners/page.tsx:280`  
```ts
console.warn("Failed to upload manually entered logo URL:", uploadErr);
```
Not a security issue, but debug output in production. Should be removed or replaced with user-visible inline error state.  
**Fix:** Remove or gate behind `process.env.NODE_ENV !== "production"`.

---

### W5 — No React Error Boundary anywhere in the app
No `ErrorBoundary` component exists in the codebase (confirmed by search). If a component throws during render (e.g., a malformed API response causes `.map()` on undefined), the entire subtree unmounts with a blank screen.  
**Fix:** Add a minimal `ErrorBoundary` class component and wrap at least the `<Providers>` tree in `app/layout.tsx`, or use `react-error-boundary` (already may be transitively available).

---

## ✅ PASS

| # | Check | Result |
|---|-------|--------|
| P1 | `next.config.ts` standalone mode | `output: "standalone"` set correctly. Dockerfile copies `.next/standalone`, `.next/static`, and `public/` — all required. ✅ |
| P2 | `next.config.ts` rewrite proxy rules | `/api/v1/:path*` and `/uploads/:path*` both proxied. Correct wildcard. ✅ |
| P3 | `NEXT_PUBLIC_API_URL` in API client | **Not used** in `apiClient.ts`. `baseURL` is `""` (empty string), meaning all calls use relative paths (`/api/v1/...`) which go through the Next.js rewrite proxy. This is correct for a containerized setup — no hardcoded origin, no CORS. ✅ |
| P4 | Hardcoded `localhost` URLs in source | Zero occurrences in any `.ts` or `.tsx` file under `src/`. ✅ |
| P5 | Auth middleware file name | `src/proxy.ts` exports `proxy` function — correct for Next.js 16 (breaking change from `middleware.ts`/`middleware` export in ≤15). ✅ |
| P6 | Middleware matcher | Correctly excludes `_next/static`, `_next/image`, `api`, `favicon.ico`, `sitemap.xml`, `robots.txt`. ✅ |
| P7 | 401 auto-logout in apiClient | `apiClient.ts:49-56` — on 401 (non-auth endpoint), clears localStorage + cookies + redirects to `/login`. ✅ |
| P8 | Sensitive data exposed to client | No secrets, API keys, or JWT secrets in any source file or `NEXT_PUBLIC_*` variable. Token is stored in localStorage (acceptable per AGENTS.md spec). `NEXT_PUBLIC_REFETCH_INTERVAL` and `NEXT_PUBLIC_API_TIMEOUT` are non-sensitive. ✅ |
| P9 | Loading states present | All data-fetching pages have loading skeletons or spinners (balances, transactions, admin dashboard, exchange). ✅ |
| P10 | Empty states present | All list views (`transactions`, `rewards`, `wallets`) have explicit empty-state messages. ✅ |
| P11 | Admin dashboard uses real API | `admin/page.tsx` fetches from `/api/v1/admin/dashboard-stats` with React Query. No hardcoded mock data. ✅ |

---

## Priority Order

| Priority | ID | Description | Effort |
|----------|----|-------------|--------|
| 1 (Fix now) | F2 | Add `Secure` flag to auth cookies | 1 line |
| 2 (Fix now) | F1 | Remove `console.log` from `next.config.ts` | 1 line |
| 3 (Before prod) | W2 | Role cookie can be spoofed — no JWT verification in middleware | Medium |
| 4 (Before prod) | W5 | No React Error Boundary | Small |
| 5 (Housekeeping) | W1 | BACKEND_URL fallback to localhost without warning | Small |
| 6 (Housekeeping) | W4 | `console.warn` in partners page | 1 line |
| 7 (Docs) | W3 | Missing `frontend/.env.example` | Small |
