# Guest Checkout with OTP-Based Account Creation/Login Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Let an unauthenticated shopper on Best-Vet-Care check out by entering Name/Email/Mobile, verifying a one-time code, and being automatically logged into their existing account (matched by email or phone) or having a new account created for them — with zero changes needed to order creation.

**Architecture:** Two new public backend endpoints (`/customer-panel/auth/checkout-otp/request` and `/verify`) issue and validate a short-lived signed JWT that carries the OTP state (no DB table, no server memory — stateless). On success they return the exact same `{ token, customer }` shape as the existing login/register endpoints, so every downstream authenticated route (`createOrder`, etc.) needs no changes. The frontend adds a "Verify Contact" gate screen before the existing 5-step checkout stepper, shown only to guests, and routes the resulting session through the existing `AuthContext`.

**Tech Stack:** Express 5, Zod, Prisma/PostgreSQL, JWT (`jsonwebtoken`), `bcryptjs`, Jest (new devDependency) — backend; React (Vite), Axios, existing `AuthContext`/`authApi` patterns — frontend (Best-Vet-Care).

## Global Constraints

- No real SMS/email provider is configured. `POST .../checkout-otp/request` returns the plaintext code in the response (`devCode`) so the flow is fully testable today; swapping in a real provider later means removing that field and the dev-mode banner, not redesigning the verification logic.
- OTP verification is stateless: state lives entirely in a signed, 5-minute-expiry JWT returned to the client between `request` and `verify`. No new Prisma model/migration.
- Account matching order: email first, then phone. If neither matches, create a new `Customer` with `passwordHash: null`.
- Never overwrite an existing matched customer's stored `name`/`email`/`phone` from the checkout form.
- `verifyOtp` must return the same `{ token, customer }` shape as `customerPanelService.login`/`register` (via the same `signCustomerToken`/`publicCustomer` helpers), so `createOrder` and all other authenticated customer routes require zero changes.
- Customer-Panel app (the separate "my account" dashboard) is out of scope — untouched.
- Already-logged-in shoppers see no change to their checkout flow.

---

### Task 1: Export `signCustomerToken` and `publicCustomer` from `customerPanelService.js`

The new OTP service needs to issue a real customer session token and format the customer the same way `login`/`register` do. Rather than duplicating that logic, export the two helpers that already exist in this file.

**Files:**
- Modify: `Admin-pannel-backend/src/services/customerPanelService.js:342-359`

**Interfaces:**
- Produces: `customerPanelService.signCustomerToken(customer) -> string` (JWT), `customerPanelService.publicCustomer(customer) -> object` — both already implemented at lines 7-36 of this file, only newly exported.

- [ ] **Step 1: Add the two names to the module's exports**

Replace the `module.exports` block:

```js
module.exports = {
  addAddress,
  createOrder,
  getCatalogProduct,
  getDashboard,
  getOrder,
  getProfile,
  getStoreContent,
  listAddresses,
  listCatalogCategories,
  listCatalogProducts,
  listOrders,
  login,
  publicCustomer,
  register,
  removeAddress,
  signCustomerToken,
  updateAddress,
  updateProfile,
};
```

- [ ] **Step 2: Verify nothing broke**

Run: `node -e "require('./src/services/customerPanelService.js')"` from `Admin-pannel-backend/`
Expected: no output, exit code 0 (module loads without error).

- [ ] **Step 3: Commit**

```bash
git add src/services/customerPanelService.js
git commit -m "Export signCustomerToken and publicCustomer for reuse by checkout OTP service"
```

---

### Task 2: Add Jest and `checkoutOtpService.requestOtp` with tests

**Files:**
- Modify: `Admin-pannel-backend/package.json`
- Create: `Admin-pannel-backend/src/services/checkoutOtpService.js`
- Create: `Admin-pannel-backend/tests/services/checkoutOtpService.test.js`

**Interfaces:**
- Consumes: nothing new (uses `bcryptjs`, `jsonwebtoken`, both already a dependency).
- Produces: `checkoutOtpService.requestOtp({ name, email, phone }) -> Promise<{ otpToken: string, devCode: string }>` — used by Task 3 (verifyOtp) and Task 4 (controller).

- [ ] **Step 1: Install Jest**

Run: `npm install --save-dev jest` from `Admin-pannel-backend/`
Expected: `jest` added to `devDependencies` in `package.json`.

- [ ] **Step 2: Add the test script**

In `Admin-pannel-backend/package.json`, change:

```json
    "test": "echo \"Error: no test specified\" && exit 1"
```

to:

```json
    "test": "jest"
```

- [ ] **Step 3: Write the failing test**

Create `Admin-pannel-backend/tests/services/checkoutOtpService.test.js`:

```js
jest.mock("../../src/config/db", () => ({
  prisma: {
    customer: {
      findUnique: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
    },
  },
}));

const jwt = require("jsonwebtoken");
const checkoutOtpService = require("../../src/services/checkoutOtpService");

describe("checkoutOtpService.requestOtp", () => {
  it("returns an otpToken and a 6-digit devCode", async () => {
    const result = await checkoutOtpService.requestOtp({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "5551234567",
    });

    expect(result.otpToken).toEqual(expect.any(String));
    expect(result.devCode).toMatch(/^\d{6}$/);

    const payload = jwt.verify(result.otpToken, process.env.JWT_SECRET || "admin");
    expect(payload.purpose).toBe("checkout-otp");
    expect(payload.email).toBe("jane@example.com");
    expect(payload.phone).toBe("5551234567");
    expect(payload.codeHash).toEqual(expect.any(String));
  });
});
```

- [ ] **Step 4: Run the test to verify it fails**

Run: `npx jest tests/services/checkoutOtpService.test.js` from `Admin-pannel-backend/`
Expected: FAIL — `Cannot find module '../../src/services/checkoutOtpService'`

- [ ] **Step 5: Write the minimal implementation**

Create `Admin-pannel-backend/src/services/checkoutOtpService.js`:

```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
const { publicCustomer, signCustomerToken } = require("./customerPanelService");

const OTP_PURPOSE = "checkout-otp";
const OTP_EXPIRES_IN = "5m";

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp({ name, email, phone }) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  const otpToken = jwt.sign(
    { purpose: OTP_PURPOSE, name, email, phone, codeHash },
    process.env.JWT_SECRET || "admin",
    { expiresIn: OTP_EXPIRES_IN },
  );

  return { otpToken, devCode: code };
}

module.exports = { requestOtp };
```

- [ ] **Step 6: Run the test to verify it passes**

Run: `npx jest tests/services/checkoutOtpService.test.js` from `Admin-pannel-backend/`
Expected: PASS (1 test)

- [ ] **Step 7: Commit**

```bash
git add package.json package-lock.json src/services/checkoutOtpService.js tests/services/checkoutOtpService.test.js
git commit -m "Add Jest and checkoutOtpService.requestOtp with tests"
```

---

### Task 3: Add `checkoutOtpService.verifyOtp` with account-matching tests

**Files:**
- Modify: `Admin-pannel-backend/src/services/checkoutOtpService.js`
- Modify: `Admin-pannel-backend/tests/services/checkoutOtpService.test.js`

**Interfaces:**
- Consumes: `customerPanelService.publicCustomer`, `customerPanelService.signCustomerToken` (Task 1); `checkoutOtpService.requestOtp` (Task 2).
- Produces: `checkoutOtpService.verifyOtp({ otpToken, code }) -> Promise<{ token: string, customer: object }>` — used by Task 4 (controller).

- [ ] **Step 1: Write the failing tests**

Append to `Admin-pannel-backend/tests/services/checkoutOtpService.test.js` (add this import at the top alongside the existing ones):

```js
const { prisma } = require("../../src/config/db");
```

Then append this describe block at the end of the file:

```js
describe("checkoutOtpService.verifyOtp", () => {
  beforeEach(() => {
    prisma.customer.findUnique.mockReset();
    prisma.customer.findFirst.mockReset();
    prisma.customer.create.mockReset();
  });

  it("rejects an incorrect code", async () => {
    const { otpToken } = await checkoutOtpService.requestOtp({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "5551234567",
    });

    await expect(
      checkoutOtpService.verifyOtp({ otpToken, code: "000000" }),
    ).rejects.toThrow("Incorrect code");
  });

  it("rejects an expired token", async () => {
    const expiredToken = jwt.sign(
      {
        purpose: "checkout-otp",
        name: "Jane Doe",
        email: "jane@example.com",
        phone: "5551234567",
        codeHash: "irrelevant",
      },
      process.env.JWT_SECRET || "admin",
      { expiresIn: -10 },
    );

    await expect(
      checkoutOtpService.verifyOtp({ otpToken: expiredToken, code: "123456" }),
    ).rejects.toThrow("Code expired, please request a new one");
  });

  it("logs into an existing customer matched by email", async () => {
    const { otpToken, devCode } = await checkoutOtpService.requestOtp({
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "5551234567",
    });

    const existingCustomer = {
      id: "CUS-1",
      name: "Jane Doe",
      email: "jane@example.com",
      phone: "5551234567",
      avatar: null,
      addresses: [],
      status: "Active",
      joined: new Date(),
      _count: { orders: 2 },
    };
    prisma.customer.findUnique.mockResolvedValue(existingCustomer);

    const result = await checkoutOtpService.verifyOtp({ otpToken, code: devCode });

    expect(prisma.customer.findUnique).toHaveBeenCalledWith(
      expect.objectContaining({ where: { email: "jane@example.com" } }),
    );
    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(result.customer.id).toBe("CUS-1");
    expect(result.token).toEqual(expect.any(String));
  });

  it("logs into an existing customer matched by phone when email doesn't match", async () => {
    const { otpToken, devCode } = await checkoutOtpService.requestOtp({
      name: "Jane Doe",
      email: "new@example.com",
      phone: "5551234567",
    });

    prisma.customer.findUnique.mockResolvedValue(null);
    const existingCustomer = {
      id: "CUS-2",
      name: "Jane Doe",
      email: "old@example.com",
      phone: "5551234567",
      avatar: null,
      addresses: [],
      status: "Active",
      joined: new Date(),
      _count: { orders: 0 },
    };
    prisma.customer.findFirst.mockResolvedValue(existingCustomer);

    const result = await checkoutOtpService.verifyOtp({ otpToken, code: devCode });

    expect(prisma.customer.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ where: { phone: "5551234567" } }),
    );
    expect(prisma.customer.create).not.toHaveBeenCalled();
    expect(result.customer.id).toBe("CUS-2");
  });

  it("creates a new customer when neither email nor phone match", async () => {
    const { otpToken, devCode } = await checkoutOtpService.requestOtp({
      name: "New Person",
      email: "newperson@example.com",
      phone: "5559999999",
    });

    prisma.customer.findUnique.mockResolvedValue(null);
    prisma.customer.findFirst.mockResolvedValue(null);
    const createdCustomer = {
      id: "CUS-3",
      name: "New Person",
      email: "newperson@example.com",
      phone: "5559999999",
      avatar: null,
      addresses: [],
      status: "Active",
      joined: new Date(),
      _count: { orders: 0 },
    };
    prisma.customer.create.mockResolvedValue(createdCustomer);

    const result = await checkoutOtpService.verifyOtp({ otpToken, code: devCode });

    expect(prisma.customer.create).toHaveBeenCalledWith(
      expect.objectContaining({
        data: expect.objectContaining({
          name: "New Person",
          email: "newperson@example.com",
          phone: "5559999999",
          passwordHash: null,
        }),
      }),
    );
    expect(result.customer.id).toBe("CUS-3");
  });
});
```

- [ ] **Step 2: Run the tests to verify the new ones fail**

Run: `npx jest tests/services/checkoutOtpService.test.js` from `Admin-pannel-backend/`
Expected: 1 PASS (requestOtp test from Task 2), 5 FAIL — `checkoutOtpService.verifyOtp is not a function`

- [ ] **Step 3: Implement `verifyOtp`**

Replace the full contents of `Admin-pannel-backend/src/services/checkoutOtpService.js`:

```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
const { publicCustomer, signCustomerToken } = require("./customerPanelService");

const OTP_PURPOSE = "checkout-otp";
const OTP_EXPIRES_IN = "5m";

function generateOtpCode() {
  return String(Math.floor(100000 + Math.random() * 900000));
}

async function requestOtp({ name, email, phone }) {
  const code = generateOtpCode();
  const codeHash = await bcrypt.hash(code, 10);

  const otpToken = jwt.sign(
    { purpose: OTP_PURPOSE, name, email, phone, codeHash },
    process.env.JWT_SECRET || "admin",
    { expiresIn: OTP_EXPIRES_IN },
  );

  return { otpToken, devCode: code };
}

async function verifyOtp({ otpToken, code }) {
  let payload;
  try {
    payload = jwt.verify(otpToken, process.env.JWT_SECRET || "admin");
  } catch (error) {
    throw new ApiError(400, "Code expired, please request a new one");
  }

  if (payload.purpose !== OTP_PURPOSE) {
    throw new ApiError(400, "Invalid verification session");
  }

  const matches = await bcrypt.compare(code, payload.codeHash);
  if (!matches) throw new ApiError(400, "Incorrect code");

  let customer = await prisma.customer.findUnique({
    where: { email: payload.email },
    include: { _count: { select: { orders: true } } },
  });

  if (!customer && payload.phone) {
    customer = await prisma.customer.findFirst({
      where: { phone: payload.phone },
      include: { _count: { select: { orders: true } } },
    });
  }

  if (!customer) {
    customer = await prisma.customer.create({
      data: {
        id: generateId("customer"),
        name: payload.name,
        email: payload.email,
        phone: payload.phone,
        passwordHash: null,
        addresses: [],
      },
      include: { _count: { select: { orders: true } } },
    });
  }

  if (customer.status !== "Active") {
    throw new ApiError(403, "Customer account is inactive");
  }

  return { token: signCustomerToken(customer), customer: publicCustomer(customer) };
}

module.exports = { requestOtp, verifyOtp };
```

- [ ] **Step 4: Run the tests to verify they all pass**

Run: `npx jest tests/services/checkoutOtpService.test.js` from `Admin-pannel-backend/`
Expected: PASS (6 tests total)

- [ ] **Step 5: Commit**

```bash
git add src/services/checkoutOtpService.js tests/services/checkoutOtpService.test.js
git commit -m "Add checkoutOtpService.verifyOtp with email/phone account matching"
```

---

### Task 4: Wire up validation, controller, and routes

**Files:**
- Modify: `Admin-pannel-backend/src/validations/customerPanelSchemas.js:90-99`
- Modify: `Admin-pannel-backend/src/controllers/customerPanelController.js:1-2` and `:101-121`
- Modify: `Admin-pannel-backend/src/routes/customerPanelRoutes.js:1-20`

**Interfaces:**
- Consumes: `checkoutOtpService.requestOtp`, `checkoutOtpService.verifyOtp` (Task 2/3).
- Produces: `POST /customer-panel/auth/checkout-otp/request` and `POST /customer-panel/auth/checkout-otp/verify` — consumed by Task 6 (`authApi.js`).

- [ ] **Step 1: Add the two validation schemas**

In `Admin-pannel-backend/src/validations/customerPanelSchemas.js`, add before the `idParam` declaration (after `createCustomerOrderSchema`):

```js
const checkoutOtpRequestSchema = z.object({
  body: z.object({
    name: z.string().trim().min(1, "Full name is required"),
    email: z.string().trim().email("Enter a valid email address"),
    phone: z.string().trim().min(7, "Enter a valid mobile number"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const checkoutOtpVerifySchema = z.object({
  body: z.object({
    otpToken: z.string().min(1, "Verification session is missing"),
    code: z.string().trim().length(6, "Enter the 6-digit code"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});
```

Then update the `module.exports` block at the bottom of the file:

```js
module.exports = {
  addressIndexParam,
  addressSchema,
  checkoutOtpRequestSchema,
  checkoutOtpVerifySchema,
  createCustomerOrderSchema,
  customerLoginSchema,
  customerRegisterSchema,
  idParam,
  updateAddressSchema,
  updateCustomerProfileSchema,
};
```

- [ ] **Step 2: Add the controller functions**

In `Admin-pannel-backend/src/controllers/customerPanelController.js`, add this import at the top (line 2, alongside the existing `asyncHandler` import):

```js
const checkoutOtpService = require("../services/checkoutOtpService");
```

Add these two functions (after the `login` function, before `changePassword`):

```js
const requestCheckoutOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.requestOtp(req.validated.body);
  res.json({ success: true, data });
});

const verifyCheckoutOtp = asyncHandler(async (req, res) => {
  const data = await checkoutOtpService.verifyOtp(req.validated.body);
  res.json({ success: true, data });
});
```

Update the `module.exports` block at the bottom of the file to include both:

```js
module.exports = {
  addAddress,
  cancelOrder,
  changePassword,
  createOrder,
  getContent,
  getDashboard,
  getOrder,
  getProduct,
  getProfile,
  listAddresses,
  listCategories,
  listOrders,
  listProducts,
  login,
  register,
  removeAddress,
  requestCheckoutOtp,
  updateAddress,
  updateProfile,
  validateCoupon,
  verifyCheckoutOtp,
};
```

- [ ] **Step 3: Add the routes**

In `Admin-pannel-backend/src/routes/customerPanelRoutes.js`, update the destructured import (lines 5-14) to include the two new schemas:

```js
const {
  addressIndexParam,
  addressSchema,
  checkoutOtpRequestSchema,
  checkoutOtpVerifySchema,
  createCustomerOrderSchema,
  customerLoginSchema,
  customerRegisterSchema,
  idParam,
  updateAddressSchema,
  updateCustomerProfileSchema,
} = require("../validations/customerPanelSchemas");
```

Add the two routes after line 20 (`router.post("/auth/login", ...)`), before the `change-password` route:

```js
router.post("/auth/checkout-otp/request", validate(checkoutOtpRequestSchema), controller.requestCheckoutOtp);
router.post("/auth/checkout-otp/verify", validate(checkoutOtpVerifySchema), controller.verifyCheckoutOtp);
```

- [ ] **Step 4: Run the full backend test suite**

Run: `npx jest` from `Admin-pannel-backend/`
Expected: PASS (6 tests, no regressions)

- [ ] **Step 5: Manually verify the live HTTP endpoints**

Start the backend: `npm run dev` from `Admin-pannel-backend/` (wait for "Server running on port 5000").

Request a code for a brand-new email (replace with any email/phone not already in your `Customer` table):

```bash
curl -s -X POST http://localhost:5000/api/customer-panel/auth/checkout-otp/request \
  -H "Content-Type: application/json" \
  -d '{"name":"Test Guest","email":"test-guest-plan@example.com","phone":"5550001111"}'
```

Expected: `{"success":true,"data":{"otpToken":"<jwt>","devCode":"<6 digits>"}}`

Copy `otpToken` and `devCode` from the response, then verify:

```bash
curl -s -X POST http://localhost:5000/api/customer-panel/auth/checkout-otp/verify \
  -H "Content-Type: application/json" \
  -d '{"otpToken":"<paste otpToken>","code":"<paste devCode>"}'
```

Expected: `{"success":true,"data":{"token":"<jwt>","customer":{"id":"CUS-...","name":"Test Guest","email":"test-guest-plan@example.com",...}}}`

Confirm a wrong code is rejected — request a fresh code, then:

```bash
curl -s -X POST http://localhost:5000/api/customer-panel/auth/checkout-otp/verify \
  -H "Content-Type: application/json" \
  -d '{"otpToken":"<paste otpToken>","code":"000000"}'
```

Expected: `{"success":false,"message":"Incorrect code"}` with HTTP 400.

- [ ] **Step 6: Commit**

```bash
git add src/validations/customerPanelSchemas.js src/controllers/customerPanelController.js src/routes/customerPanelRoutes.js
git commit -m "Expose checkout OTP request/verify as public customer-panel endpoints"
```

---

### Task 5: Add `authApi.requestCheckoutOtp` / `authApi.verifyCheckoutOtp` (Best-Vet-Care)

**Files:**
- Modify: `Best-Vet-Care/src/api/authApi.js`

**Interfaces:**
- Consumes: `POST /customer-panel/auth/checkout-otp/request`, `POST /customer-panel/auth/checkout-otp/verify` (Task 4).
- Produces: `authApi.requestCheckoutOtp({ name, email, phone }) -> Promise<{ otpToken, devCode }>`, `authApi.verifyCheckoutOtp({ otpToken, code }) -> Promise<customer>` (also writes `petcare_customer_session`/`petcare_auth_user` to localStorage and dispatches `petcare-auth-change`, exactly like `login`/`register`) — consumed by Task 6 (`AuthContext`) and Task 7 (`VerifyContactStep`).

- [ ] **Step 1: Add the two functions**

In `Best-Vet-Care/src/api/authApi.js`, add these two entries to the `authApi` object, right after `register` and before `logout`:

```js
  requestCheckoutOtp: async ({ name, email, phone }) => {
    const res = await api.post('/customer-panel/auth/checkout-otp/request', { name, email, phone });
    return res.data.data;
  },

  verifyCheckoutOtp: async ({ otpToken, code }) => {
    const res = await api.post('/customer-panel/auth/checkout-otp/verify', { otpToken, code });
    const { token, customer } = res.data.data;
    localStorage.setItem(SESSION_KEY, JSON.stringify({ token, customer }));
    localStorage.setItem(AUTH_USER_KEY, JSON.stringify({ name: customer.firstName || customer.name, email: customer.email, avatar: customer.avatar }));
    window.dispatchEvent(new Event('petcare-auth-change'));
    return customer;
  },
```

- [ ] **Step 2: Verify the file has no syntax errors**

Run: `npx eslint src/api/authApi.js` from `Best-Vet-Care/`
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/api/authApi.js
git commit -m "Add authApi.requestCheckoutOtp and verifyCheckoutOtp"
```

---

### Task 6: Add `verifyCheckoutOtp` to `AuthContext` (Best-Vet-Care)

`isLoggedIn`/`customer` inside `Checkout.jsx` and `AddressStep.jsx` come from `AuthContext`, which only updates its `customer` state via its own `login`/`register` functions (dispatching the `petcare-auth-change` event alone does not update it — only `Header.jsx` listens to that event). This task adds the matching context method so the rest of the checkout flow reacts correctly once a guest verifies.

**Files:**
- Modify: `Best-Vet-Care/src/context/AuthContext.jsx`

**Interfaces:**
- Consumes: `authApi.verifyCheckoutOtp` (Task 5).
- Produces: `useAuth().verifyCheckoutOtp({ otpToken, code }) -> Promise<customer>` — consumed by Task 7 (`VerifyContactStep`).

- [ ] **Step 1: Add the method**

In `Best-Vet-Care/src/context/AuthContext.jsx`, add this after the `register` callback (line 20) and before `logout`:

```js
  const verifyCheckoutOtp = useCallback(async ({ otpToken, code }) => {
    const data = await authApi.verifyCheckoutOtp({ otpToken, code });
    setCustomer(data);
    return data;
  }, []);
```

Update the `useMemo` block to include it:

```js
  const value = useMemo(
    () => ({ customer, isLoggedIn: Boolean(customer), login, register, verifyCheckoutOtp, logout }),
    [customer, login, register, verifyCheckoutOtp, logout]
  );
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx eslint src/context/AuthContext.jsx` from `Best-Vet-Care/`
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/context/AuthContext.jsx
git commit -m "Expose verifyCheckoutOtp through AuthContext"
```

---

### Task 7: Create `VerifyContactStep.jsx` (Best-Vet-Care)

**Files:**
- Create: `Best-Vet-Care/src/components/checkout/VerifyContactStep.jsx`

**Interfaces:**
- Consumes: `useAuth().verifyCheckoutOtp` (Task 6), `authApi.requestCheckoutOtp` (Task 5).
- Produces: `<VerifyContactStep onVerified={() => void} />` — consumed by Task 8 (`Checkout.jsx`).

- [ ] **Step 1: Create the component**

Create `Best-Vet-Care/src/components/checkout/VerifyContactStep.jsx`:

```jsx
import { useEffect, useState } from "react";
import { useAuth } from "../../context/AuthContext";
import { authApi } from "../../api/authApi";

const MAX_ATTEMPTS = 5;
const RESEND_COOLDOWN_SECONDS = 30;

const VerifyContactStep = ({ onVerified }) => {
  const { verifyCheckoutOtp } = useAuth();
  const [phase, setPhase] = useState("form");
  const [form, setForm] = useState({ name: "", email: "", phone: "" });
  const [otpToken, setOtpToken] = useState(null);
  const [devCode, setDevCode] = useState(null);
  const [code, setCode] = useState("");
  const [attempts, setAttempts] = useState(0);
  const [cooldown, setCooldown] = useState(0);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  const requestCode = async (event) => {
    event?.preventDefault();
    setError("");
    setLoading(true);
    try {
      const { otpToken: token, devCode: sentCode } = await authApi.requestCheckoutOtp(form);
      setOtpToken(token);
      setDevCode(sentCode);
      setAttempts(0);
      setCode("");
      setCooldown(RESEND_COOLDOWN_SECONDS);
      setPhase("code");
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Could not send verification code");
    } finally {
      setLoading(false);
    }
  };

  const submitCode = async (event) => {
    event.preventDefault();
    setError("");
    setLoading(true);
    try {
      await verifyCheckoutOtp({ otpToken, code });
      onVerified();
    } catch (err) {
      const nextAttempts = attempts + 1;
      setAttempts(nextAttempts);
      if (nextAttempts >= MAX_ATTEMPTS) {
        setError("Too many incorrect attempts. Please resend the code.");
      } else {
        setError(err.response?.data?.message || err.message || "Incorrect code");
      }
    } finally {
      setLoading(false);
    }
  };

  if (phase === "form") {
    return (
      <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
        <div className="border-b border-[#17345f1a] px-5 py-4">
          <h2 className="font-extrabold text-[#122a50]">Verify Your Contact Details</h2>
        </div>
        <div className="p-5">
          <p className="mb-4 rounded-lg bg-[#f8f1df] px-3 py-2 text-sm font-semibold text-[#122a50]">
            Please add your real details — we&apos;ll send a verification code to confirm
            it&apos;s you, and use these details for your order account.
          </p>

          {error && (
            <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
          )}

          <form className="space-y-4" onSubmit={requestCode}>
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-[#122a50]">Full Name</span>
              <input
                type="text"
                required
                value={form.name}
                onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Enter your full name"
                className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] focus:ring-4 focus:ring-[#d9aa3d]/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-[#122a50]">Email Address</span>
              <input
                type="email"
                required
                value={form.email}
                onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Enter your email"
                className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] focus:ring-4 focus:ring-[#d9aa3d]/20"
              />
            </label>
            <label className="block">
              <span className="mb-2 block text-sm font-extrabold text-[#122a50]">Mobile Number</span>
              <input
                type="tel"
                required
                value={form.phone}
                onChange={(e) => setForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="Enter your mobile number"
                className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-4 text-sm font-semibold text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] focus:ring-4 focus:ring-[#d9aa3d]/20"
              />
            </label>
            <button
              type="submit"
              disabled={loading}
              className="h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] disabled:opacity-60"
            >
              {loading ? "Sending code..." : "Send Verification Code"}
            </button>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-[#17345f1a] bg-white shadow-sm">
      <div className="border-b border-[#17345f1a] px-5 py-4">
        <h2 className="font-extrabold text-[#122a50]">Enter Verification Code</h2>
      </div>
      <div className="p-5">
        <p className="mb-4 text-sm font-semibold text-[#122a50]/70">
          We sent a 6-digit code to {form.phone} / {form.email}.
        </p>

        <p className="mb-4 rounded-lg bg-[#f8f1df] px-3 py-2 text-sm font-semibold text-[#122a50]">
          Dev mode — SMS/email delivery isn&apos;t configured yet. Your code: <strong>{devCode}</strong>
        </p>

        {error && (
          <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{error}</p>
        )}

        <form className="space-y-4" onSubmit={submitCode}>
          <label className="block">
            <span className="mb-2 block text-sm font-extrabold text-[#122a50]">Verification Code</span>
            <input
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              maxLength={6}
              required
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
              placeholder="123456"
              disabled={attempts >= MAX_ATTEMPTS}
              className="h-12 w-full rounded-lg border border-[#17345f1a] bg-white px-4 text-center text-lg font-extrabold tracking-[0.4em] text-[#122a50] outline-none transition-all placeholder:text-[#122a5070] focus:border-[#d9aa3d] focus:ring-4 focus:ring-[#d9aa3d]/20"
            />
          </label>
          <button
            type="submit"
            disabled={loading || attempts >= MAX_ATTEMPTS || code.length !== 6}
            className="h-12 w-full rounded-lg bg-[#17345f] text-sm font-extrabold text-white shadow-[0_12px_28px_rgba(18,42,80,0.24)] transition-all duration-200 hover:bg-[#d9aa3d] disabled:opacity-60"
          >
            {loading ? "Verifying..." : "Verify & Continue"}
          </button>
          <button
            type="button"
            onClick={requestCode}
            disabled={cooldown > 0}
            className="h-12 w-full rounded-lg border border-[#17345f1a] text-sm font-extrabold text-[#17345f] transition-all disabled:opacity-50"
          >
            {cooldown > 0 ? `Resend code in ${cooldown}s` : "Resend Code"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default VerifyContactStep;
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx eslint src/components/checkout/VerifyContactStep.jsx` from `Best-Vet-Care/`
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/components/checkout/VerifyContactStep.jsx
git commit -m "Add VerifyContactStep component for guest checkout"
```

---

### Task 8: Wire `VerifyContactStep` into `Checkout.jsx` and fix the silent-failure bug

Today, `placeOrder()` swallows any error from `orderApi.createOrder` and still shows a fake success page. Once this task lands, an authenticated session always exists by the time `placeOrder()` runs (either pre-existing, or just established via `VerifyContactStep`), so any remaining failure is a real error worth surfacing — the swallow-and-fake-success branch is removed.

**Files:**
- Modify: `Best-Vet-Care/src/pages/Checkout.jsx`

**Interfaces:**
- Consumes: `<VerifyContactStep onVerified={() => void} />` (Task 7).

- [ ] **Step 1: Replace the full file contents**

Replace all of `Best-Vet-Care/src/pages/Checkout.jsx`:

```jsx
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "../components/common/Header";
import Footer from "../components/common/Footer";
import SEO from "../components/common/SEO";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import CheckoutStepper from "../components/checkout/CheckoutStepper";
import CheckoutCartStep from "../components/checkout/CheckoutCartStep";
import VerifyContactStep from "../components/checkout/VerifyContactStep";
import AddressStep from "../components/checkout/AddressStep";
import ShippingStep from "../components/checkout/ShippingStep";
import PaymentStep from "../components/checkout/PaymentStep";
import ReviewStep from "../components/checkout/ReviewStep";
import OrderSummary from "../components/checkout/OrderSummary";
import { orderApi } from "../api/orderApi";
import { ShieldCheck, Headphones } from "lucide-react";

const TAX_RATE = 0.05;

const Checkout = () => {
  const navigate = useNavigate();
  const { cartItems, subtotal, discount, updateQuantity, removeFromCart, clearCart } = useCart();
  const { isLoggedIn } = useAuth();

  const [verified, setVerified] = useState(isLoggedIn);
  const [step, setStep] = useState(1);
  const [promoDiscount, setPromoDiscount] = useState(0);
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [selectedShipping, setSelectedShipping] = useState(null);
  const [selectedPayment, setSelectedPayment] = useState(null);
  const [cardDetails, setCardDetails] = useState({
    number: "",
    expiry: "",
    cvv: "",
    name: "",
    save: false,
  });
  const [orderError, setOrderError] = useState("");

  const shippingCost = selectedShipping?.price ?? 0;
  const taxableAmount = Math.max(0, subtotal - discount - promoDiscount + shippingCost);
  const tax = taxableAmount * TAX_RATE;
  const total = taxableAmount + tax;

  const placeOrder = async () => {
    setOrderError("");
    const orderPayload = {
      items: cartItems.map((item) => ({
        productId: item.id,
        name: item.name,
        image: item.image,
        price: item.price,
        quantity: item.quantity,
      })),
      shippingAddress: selectedAddress,
      shippingMethod: selectedShipping?.label || "Standard",
      paymentMethod: selectedPayment || "cod",
      subtotal,
      discount: discount + promoDiscount,
      shippingCost,
      tax,
      total,
    };

    try {
      const created = await orderApi.createOrder(orderPayload);
      const order = {
        id: created?.id || `#PC${Date.now().toString().slice(-8)}`,
        date: new Date().toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" }),
        items: cartItems,
        address: selectedAddress,
        shipping: selectedShipping,
        payment: selectedPayment,
        cardLast4: cardDetails.number?.slice(-4) || null,
        subtotal,
        discount: discount + promoDiscount,
        shippingCost,
        tax,
        total,
      };
      localStorage.setItem("petcare_last_order", JSON.stringify(order));
      clearCart();
      navigate("/order-success");
    } catch (err) {
      setOrderError(err.response?.data?.message || err.message || "Could not place your order. Please try again.");
    }
  };

  return (
    <>
      <SEO title="Checkout | PetCare" description="Complete your PetCare order securely." />
      <div className="min-h-screen bg-[#fffdf7]">
        <Header />

        <main className="mx-auto max-w-[1200px] px-4 py-6 sm:px-5 lg:px-6">
          {/* Trust bar */}
          <div className="mb-5 flex flex-wrap items-center justify-center gap-6 text-xs font-semibold text-[#122a50]/60">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-4 w-4 text-[#d9aa3d]" />
              Secure Checkout · 100% Secure Payments
            </span>
            <span className="flex items-center gap-1.5">
              <Headphones className="h-4 w-4 text-[#d9aa3d]" />
              24/7 Support · We're here to help
            </span>
          </div>

          {!verified ? (
            <div className="mx-auto max-w-[520px]">
              <VerifyContactStep onVerified={() => setVerified(true)} />
            </div>
          ) : (
            <>
              {/* Stepper */}
              <div className="mb-6 rounded-2xl border border-[#17345f1a] bg-white px-4 py-4 shadow-sm">
                <CheckoutStepper currentStep={step} />
              </div>

              {orderError && (
                <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm font-semibold text-red-600">{orderError}</p>
              )}

              {/* Main layout */}
              <div className="grid gap-6 lg:grid-cols-[1fr_340px] lg:items-start">
                <div>
                  {step === 1 && (
                    <CheckoutCartStep
                      cartItems={cartItems}
                      updateQuantity={updateQuantity}
                      removeFromCart={removeFromCart}
                      onNext={() => setStep(2)}
                      promoDiscount={promoDiscount}
                      setPromoDiscount={setPromoDiscount}
                    />
                  )}
                  {step === 2 && (
                    <AddressStep
                      selectedAddress={selectedAddress}
                      setSelectedAddress={setSelectedAddress}
                      onNext={() => setStep(3)}
                    />
                  )}
                  {step === 3 && (
                    <ShippingStep
                      selectedShipping={selectedShipping}
                      setSelectedShipping={setSelectedShipping}
                      subtotal={subtotal}
                      onNext={() => setStep(4)}
                    />
                  )}
                  {step === 4 && (
                    <PaymentStep
                      selectedPayment={selectedPayment}
                      setSelectedPayment={setSelectedPayment}
                      cardDetails={cardDetails}
                      setCardDetails={setCardDetails}
                      onNext={() => setStep(5)}
                    />
                  )}
                  {step === 5 && (
                    <ReviewStep
                      cartItems={cartItems}
                      selectedAddress={selectedAddress}
                      selectedShipping={selectedShipping}
                      selectedPayment={selectedPayment}
                      cardDetails={cardDetails}
                      subtotal={subtotal}
                      discount={discount}
                      promoDiscount={promoDiscount}
                      shipping={shippingCost}
                      tax={tax}
                      total={total}
                      onEdit={(s) => setStep(s)}
                      onPlaceOrder={placeOrder}
                    />
                  )}
                </div>

                {/* Sticky order summary */}
                <OrderSummary
                  cartItems={cartItems}
                  subtotal={subtotal}
                  discount={discount}
                  shipping={shippingCost}
                  tax={tax}
                  total={total}
                  promoDiscount={promoDiscount}
                />
              </div>
            </>
          )}
        </main>

        <Footer />
      </div>
    </>
  );
};

export default Checkout;
```

- [ ] **Step 2: Verify no syntax errors**

Run: `npx eslint src/pages/Checkout.jsx` from `Best-Vet-Care/`
Expected: no output (clean).

- [ ] **Step 3: Commit**

```bash
git add src/pages/Checkout.jsx
git commit -m "Gate checkout behind guest contact verification; surface real order errors"
```

---

### Task 9: End-to-end manual verification

**Files:** none (verification only).

- [ ] **Step 1: Start both dev servers**

```bash
# Terminal 1
cd Admin-pannel-backend && npm run dev
# Terminal 2
cd Best-Vet-Care && npm run dev
```

Wait for the backend to log "Server running on port 5000" and Vite to print its local URL (typically `http://localhost:5173` or `5174`/`5175` if that port is taken — all three are already in the backend's CORS whitelist in `Admin-pannel-backend/src/app.js`).

- [ ] **Step 2: Drive the guest flow in a browser**

Try the project's `run` skill first (browser-driven via `chromium-cli` if available in this environment) to automate this. If no headless browser tool is available, do it manually in a normal browser:

1. Open the storefront, add any product to the cart, go to `/checkout`.
2. Confirm you see the "Verify Your Contact Details" screen (not the Cart step) since you're not logged in.
3. Fill in a name, a brand-new email (not used before), and a phone number. Submit.
4. Confirm the "Enter Verification Code" screen appears with a "Dev mode" banner showing a 6-digit code.
5. Enter the wrong code once — confirm an inline "Incorrect code" error appears and the form is still usable.
6. Enter the correct code — confirm you're taken to the Cart step of the normal 5-step checkout, and the site header now shows you as logged in.
7. Complete Address → Shipping → Payment → Review → Place Order. Confirm you land on the real `/order-success` page (not a fabricated one).

- [ ] **Step 3: Confirm the account was created correctly**

Run this from `Admin-pannel-backend/` (replace the email with the one used above):

```bash
node -e "
require('dotenv').config();
const { prisma } = require('./src/config/db');
prisma.customer.findUnique({ where: { email: 'YOUR_TEST_EMAIL' } })
  .then(c => { console.log(c); return prisma.\$disconnect(); });
"
```

Expected: one `Customer` row with the name/phone you entered, `passwordHash: null`, and (after Step 2.7) at least one associated `Order`.

- [ ] **Step 4: Confirm returning-guest matching works**

1. Log out (or open a private/incognito window).
2. Add a product to cart, go to `/checkout` again.
3. Enter the **same email** from Step 2 but a **different name**.
4. Verify the code.
5. Re-run the Step 3 query — confirm there is still exactly **one** `Customer` row for that email (not a duplicate), and its `name` is still the original one from Step 2 (proving the matched-account fields were not overwritten).

- [ ] **Step 5: Report results**

Note in the PR/commit description (or to whoever requested this feature) whether headless browser automation was available, and paste the confirmation query output from Steps 3 and 4.
