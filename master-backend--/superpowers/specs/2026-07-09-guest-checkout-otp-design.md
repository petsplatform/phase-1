# Guest Checkout with OTP-Based Account Creation/Login

Date: 2026-07-09
Apps affected: `Best-Vet-Care` (storefront frontend), `Admin-pannel-backend`

## Problem

Best-Vet-Care's checkout (`src/pages/Checkout.jsx`) does not require login. Today, an
unauthenticated shopper who reaches `placeOrder()` gets a 401 from
`POST /customer-panel/orders` (which is gated by `requireCustomerAuth`), the error is
swallowed, and the app still navigates to `/order-success` with a locally-fabricated
fallback order — no real order is created, and the shopper isn't told anything went
wrong.

There is no guest-checkout path in the backend at all: `customerPanelRoutes.js` only
exposes `POST /auth/register` and `POST /auth/login` as public routes; every order
operation requires an existing authenticated `Customer`.

## Goal

Add a Shopify-style guest-checkout step: before an unauthenticated shopper proceeds
past Cart in checkout, collect Full Name, Email, and Mobile Number, verify the
contact via a one-time code, and then either log them into their existing account
(matched by email or phone) or automatically create a new account for them — all
without leaving the checkout flow or requiring a password.

OTP delivery (SMS/email) is out of scope for this iteration — no provider is
configured yet. The verification *mechanism* is built for real, but the code is
returned to the frontend and shown on-screen instead of being texted/emailed. Swapping
in a real provider later is a one-line change (stop returning the code, send it
instead) with no redesign of the verification logic itself.

## Non-goals

- Real SMS/email delivery integration (future work, out of scope here).
- Changes to the Customer-Panel app (separate "my account" dashboard, unaffected).
- Password creation/management for auto-created accounts (they get
  `passwordHash: null`, same as the schema already supports; a customer can set a
  password later via existing profile flows if/when that exists).
- Changing the authenticated (already-logged-in) checkout path — untouched.

## Frontend design (Best-Vet-Care)

### New Step 0: "Verify Contact" in Checkout

`Checkout.jsx`'s stepper today is: Cart → Address → Shipping → Payment → Review.

Insert a new step, shown only when `useAuth().isLoggedIn` is false, between Cart and
Address:

1. **Details form** — Full Name, Email, Mobile Number fields, plus static copy:
   > "Please enter your real details — we'll send a verification code to confirm
   > it's you, and use these details for your order account."

   Submit calls `POST /customer-panel/auth/checkout-otp/request` with
   `{ name, email, phone }`.

2. **Enter code screen** — 6-digit code input, "Resend code" link (disabled behind a
   30s client-side cooldown timer). Because no real delivery provider exists yet, the
   response from `checkout-otp/request` also includes the plaintext code, rendered in
   a clearly-labeled dev-only banner:
   > "Dev mode — SMS/email delivery isn't configured yet. Your code: `123456`"

   This banner and the `devCode` field are the only pieces to remove once a real
   provider is wired in.

   Submit calls `POST /customer-panel/auth/checkout-otp/verify` with
   `{ otpToken, code }`.

On success, the response is `{ token, customer }` — identical shape to
`authApi.login`/`register`. Route it through the **existing** `AuthContext` session
setter (same `localStorage["petcare_customer_session"]` key, same
`petcare-auth-change` event) so the rest of the app (header, order history) treats
this exactly like a normal login. The stepper then advances to Address as usual.

Already-logged-in shoppers never see this step; behavior is unchanged for them.

### Cleanup

`placeOrder()`'s existing swallow-401-and-fake-success fallback becomes unreachable
once a real session always exists before this point in the flow, and will be removed
rather than left as dead/misleading code. Any genuine failure calling
`orderApi.createOrder` should now surface a real error to the shopper instead of a
fake success.

## Backend design (Admin-pannel-backend)

### New public routes

In `customerPanelRoutes.js`, added **before** the `requireCustomerAuth` gate:

- `POST /customer-panel/auth/checkout-otp/request`
- `POST /customer-panel/auth/checkout-otp/verify`

New service file `src/services/checkoutOtpService.js`; new validation schemas in
`customerPanelSchemas.js` (`checkoutOtpRequestSchema`, `checkoutOtpVerifySchema`).

### `requestOtp({ name, email, phone })`

- Validate: `name` non-empty, `email` valid format, `phone` valid format (reuse
  existing validation patterns already in `customerPanelSchemas.js`).
- Generate a random 6-digit numeric code.
- Hash it with bcrypt (same library already used for passwords).
- Sign a JWT (using existing `JWT_SECRET`) with payload
  `{ name, email, phone, codeHash, purpose: "checkout-otp" }` and a 5-minute
  expiry.
- Return `{ otpToken, devCode }` — `devCode` is the plaintext code, present only
  because no real provider exists yet (see Non-goals).

No database writes happen at this step — the JWT itself carries all state needed to
verify later, so there's nothing to persist or clean up.

### `verifyOtp({ otpToken, code })`

- Verify JWT signature and expiry.
  - Invalid/expired → 400 `"Code expired, please request a new one"`.
- bcrypt-compare `code` against `codeHash` from the token payload.
  - Mismatch → 400 `"Incorrect code"` (frontend allows retry without a fresh
    request, up to 5 attempts tracked client-side; on the 6th wrong attempt, force
    a resend).
- **Account matching**, in order:
  1. Look up `Customer` by `email` (from the token payload).
  2. If no match, look up by `phone`.
  3. If still no match, create a new `Customer`:
     `{ name, email, phone, passwordHash: null, status: "Active" }`.
  - If an existing customer is matched, log into that account as-is — do **not**
    overwrite its stored `name`/`email`/`phone` from the checkout form, to avoid a
    guest accidentally editing someone else's profile fields.
- Sign a normal customer session JWT via the existing `signCustomerToken()` helper
  (same one used by `/auth/login`).
- Return `{ token, customer }` — identical shape to `/auth/login`, so
  `createOrder` and everything else downstream needs **zero changes**: it already
  works for any authenticated customer regardless of how they got their session.

### Error handling summary

| Case | Behavior |
|---|---|
| Wrong code | 400, inline retry, up to 5 attempts before forcing resend |
| Expired token (>5 min) | 400, prompt to resend |
| Resend | New `request` call issues a fresh token/code; old token is simply discarded client-side |
| Network/API failure | Real error surfaced to shopper, no fake success (fixes existing bug) |
| Already logged in | Step is skipped entirely; unchanged behavior |
| Email matches one customer, phone matches a different one | Email match wins (checked first); the mismatched phone is not written over the matched account |

## Testing

- Backend unit tests for `checkoutOtpService`:
  - Correct code passes verification.
  - Wrong code is rejected.
  - Expired token is rejected.
  - Matches existing customer by email.
  - Matches by phone when email doesn't match any customer.
  - Creates a new customer when neither matches.
- Frontend: manual verification via browser-driven run (fill form → see dev code →
  enter it → land on Address step with an established session) — this repo has no
  existing frontend test setup to extend.
