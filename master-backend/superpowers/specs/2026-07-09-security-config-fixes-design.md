# Security & Config Fixes — Design

Status: Approved
Date: 2026-07-09
Repos touched: `Admin-pannel-backend` only

## Context

A full connectivity/gap audit of the 4-app monorepo (`Best-Vet-Care` storefront, `Customer-Panel`, `Admin-Panel`, `Admin-pannel-backend`) found the project's CRUD flows (products, categories, orders, customers, coupons, banners/blogs) are genuinely wired end-to-end. But before building any new features, four production-blocking issues need fixing:

1. Admin and customer JWTs share one secret, with an insecure `"admin"` fallback if the env var is unset.
2. `requireAuth` (admin guard) never checks the token's `type` claim, so a valid customer JWT currently passes it — a customer can call admin-only endpoints.
3. CORS origins are hardcoded to two ambiguous prod IPs + 3 localhost ports for what needs to support 3 distinct frontend apps.
4. The blanket rate limit (300 req/15min across all of `/api`) is too loose to slow down login brute-forcing.

**Correction (verified during planning, 2026-07-09):** the initial audit flagged Customer-Panel's avatar upload as hitting the admin-only `/upload` route via `src/api/uploadApi.js`. Direct inspection of the call site shows this is wrong — `Customer-Panel/src/pages/customer/Profile.jsx:52` posts directly to `/customer-panel/upload/avatar` (correctly gated by `requireCustomerAuth`) via the raw axios client, not through `uploadApi.js`. `uploadApi.js` is never imported anywhere in Customer-Panel — it's dead code, not a wired bug. The JWT secret split therefore does **not** break avatar upload, and no Customer-Panel code change is needed in this phase.

This is Phase 1 of a larger roadmap (subsequent phases: Cart/Wishlist/Reviews/Stripe payments; then fixing broken flows like Customer-Panel register/forgot-password and Admin-Panel's duplicate API clients). Scoped and approved with the user via brainstorming session on 2026-07-09.

## Design

### 1. JWT: split secrets, remove insecure fallback

- New env vars in `Admin-pannel-backend/.env`: `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET` (distinct, long random values), replacing the single `JWT_SECRET`.
- `src/services/authService.js` (admin login) signs tokens with `ADMIN_JWT_SECRET` only.
- `src/services/customerPanelService.js` (customer login/register) signs tokens with `CUSTOMER_JWT_SECRET` only.
- `src/middleware/auth.js`:
  - `requireAuth` verifies only against `ADMIN_JWT_SECRET`.
  - `requireCustomerAuth` verifies only against `CUSTOMER_JWT_SECRET`.
  - Neither falls back to a hardcoded default. A customer token is now cryptographically incapable of passing `requireAuth`, independent of any `type`-claim check.
- At app startup (`src/server.js` or `src/app.js`), fail fast — log a clear error and `process.exit(1)` — if either secret is missing, in every environment (dev included), so misconfiguration is caught immediately rather than silently degrading to an insecure state.
- Add `Admin-pannel-backend/.env.example` documenting every required env var (`PORT`, `DATABASE_URL`, `ADMIN_JWT_SECRET`, `CUSTOMER_JWT_SECRET`, `CLOUDINARY_*`, `CORS_ORIGINS`) — none exists today.

### 2. CORS: env-configurable allowlist

- New env var `CORS_ORIGINS` in `.env`: comma-separated list of allowed origins.
- `src/app.js` parses it into an array at startup (`.split(",").map(s => s.trim())`).
- If `CORS_ORIGINS` is unset, default to the exact list currently hardcoded (`http://168.231.69.231:9006`, `:9007`, `localhost:5173/5174/5175`), so local dev behavior is unchanged.
- `.env.example` documents the format and notes that production domains should replace the placeholder list once known.

### 3. Rate limiting on auth endpoints

- Add a second, stricter `express-rate-limit` instance (e.g. 10 requests / 15 min per IP) applied specifically to:
  - `POST /api/auth/login`
  - `POST /api/customer-panel/auth/login`
  - `POST /api/customer-panel/auth/register`
- This layers on top of (does not replace) the existing global 300/15min limiter on all of `/api`.

### 4. Customer-Panel avatar upload — no change needed

Verified as already correct (see Correction note above). No task required.

## Out of scope (deferred, confirmed with user)

- Password policy / bcrypt cost tuning.
- Helmet/CSP header tuning.
- Cart, Wishlist, Reviews, Stripe payment integration — separate future phase.
- Customer-Panel register page, forgot-password flow, Admin-Panel duplicate API client unification, dead-code removal — separate future "broken flows" phase.

## Testing

- Manual: admin login issues a token that works on admin routes and is rejected by `requireCustomerAuth`; customer login issues a token that works on customer routes and is rejected by `requireAuth`.
- Manual: server refuses to start with a clear error if `ADMIN_JWT_SECRET` or `CUSTOMER_JWT_SECRET` is unset.
- Manual: CORS — request from an origin not in `CORS_ORIGINS` is rejected; one in the list succeeds.
- Manual: hammering `/api/auth/login` past the stricter limit returns 429 well before the global limiter would trigger.
