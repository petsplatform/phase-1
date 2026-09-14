# Security & Config Fixes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Split admin/customer JWT secrets with fail-fast validation, make CORS origins env-configurable, and add brute-force-resistant rate limiting to auth endpoints in the `Admin-pannel-backend` Express API.

**Architecture:** A new `src/config/env.js` module centralizes required-env-var validation (fails the process fast if secrets are missing) and CORS origin parsing. `app.js` and the two auth-signing services (`authService.js`, `customerPanelService.js`) and the two auth-verifying middlewares (`requireAuth`, `requireCustomerAuth`) all read from this module instead of touching `process.env` directly or falling back to an insecure default.

**Tech Stack:** Node.js, Express 5, jsonwebtoken, express-rate-limit, Prisma/PostgreSQL. No automated test suite exists in this repo (`package.json`'s `test` script is a stub). Verification in this plan uses the running dev server + `curl`/small `node -e` scripts, which is the existing de facto testing approach here — do not introduce a new test framework as part of this plan.

## Global Constraints

- Do not commit real secret values anywhere tracked by git — `.env` is already gitignored; only `.env.example` (with placeholder values) is committed.
- No insecure fallback defaults for JWT secrets, in any environment (dev included).
- Preserve current CORS behavior exactly when `CORS_ORIGINS` is unset (no behavior change for existing deployments that don't set it).
- Do not touch password policy, bcrypt cost, or helmet/CSP config — explicitly out of scope per the design doc.

---

### Task 1: Centralized env config module + JWT secret split

**Files:**
- Create: `Admin-pannel-backend/src/config/env.js`
- Modify: `Admin-pannel-backend/.env`
- Create: `Admin-pannel-backend/.env.example`
- Modify: `Admin-pannel-backend/src/app.js:1-39`
- Modify: `Admin-pannel-backend/src/middleware/auth.js`
- Modify: `Admin-pannel-backend/src/services/authService.js:41-45`
- Modify: `Admin-pannel-backend/src/services/customerPanelService.js:30-36`

**Interfaces:**
- Produces: `require("../config/env")` (from `src/services/*` or `src/middleware/*`) or `require("./config/env")` (from `src/app.js`) exports `{ adminJwtSecret: string, customerJwtSecret: string, corsOrigins: string[] }`. Loading this module has the side effect of calling `process.exit(1)` if `ADMIN_JWT_SECRET` or `CUSTOMER_JWT_SECRET` is unset in `process.env` — callers can assume both are always non-empty strings if the module successfully loaded.

- [ ] **Step 1: Create `src/config/env.js`**

```js
function required(name) {
  const value = process.env[name];
  if (!value) {
    console.error(`Missing required environment variable: ${name}`);
    process.exit(1);
  }
  return value;
}

const DEFAULT_CORS_ORIGINS = [
  "http://168.231.69.231:9006",
  "http://168.231.69.231:9007",
  "http://localhost:5173",
  "http://localhost:5174",
  "http://localhost:5175",
];

const adminJwtSecret = required("ADMIN_JWT_SECRET");
const customerJwtSecret = required("CUSTOMER_JWT_SECRET");

const corsOrigins = process.env.CORS_ORIGINS
  ? process.env.CORS_ORIGINS.split(",").map((origin) => origin.trim()).filter(Boolean)
  : DEFAULT_CORS_ORIGINS;

module.exports = { adminJwtSecret, customerJwtSecret, corsOrigins };
```

- [ ] **Step 2: Update `.env`**

Current content:
```
PORT=5000
DATABASE_URL="postgresql://postgres:root@localhost:5432/admin-panel?schema=public"

# DATABASE_URL="postgresql://ecommerce_user:root@localhost:5432/e_commerce"

JWT_SECRET=admin

CLOUDINARY_CLOUD_NAME=dambdzzv3
CLOUDINARY_API_KEY=585295953139398
CLOUDINARY_API_SECRET=oxndn6FguvS1LydQUZBHwzsDn-4
```

Replace the `JWT_SECRET=admin` line with (these are real generated random secrets — safe to use directly since `.env` is gitignored):
```
ADMIN_JWT_SECRET=4cfd953e2a709b196a68ccaadcb3ffc094710c82d1ce5fc2599d73a0da1e906e8929fc6102de1bee01a5463b847ac500
CUSTOMER_JWT_SECRET=a0f88638d9853d5e9dbc02ee43156579c6b422458b14f320a3338080379c353cae3227e8aa02056362d983122cd2df23

CORS_ORIGINS=http://168.231.69.231:9006,http://168.231.69.231:9007,http://localhost:5173,http://localhost:5174,http://localhost:5175
```

Resulting full file:
```
PORT=5000
DATABASE_URL="postgresql://postgres:root@localhost:5432/admin-panel?schema=public"

# DATABASE_URL="postgresql://ecommerce_user:root@localhost:5432/e_commerce"

ADMIN_JWT_SECRET=4cfd953e2a709b196a68ccaadcb3ffc094710c82d1ce5fc2599d73a0da1e906e8929fc6102de1bee01a5463b847ac500
CUSTOMER_JWT_SECRET=a0f88638d9853d5e9dbc02ee43156579c6b422458b14f320a3338080379c353cae3227e8aa02056362d983122cd2df23

CORS_ORIGINS=http://168.231.69.231:9006,http://168.231.69.231:9007,http://localhost:5173,http://localhost:5174,http://localhost:5175

CLOUDINARY_CLOUD_NAME=dambdzzv3
CLOUDINARY_API_KEY=585295953139398
CLOUDINARY_API_SECRET=oxndn6FguvS1LydQUZBHwzsDn-4
```

- [ ] **Step 3: Create `.env.example`**

```
PORT=5000
DATABASE_URL="postgresql://user:password@localhost:5432/admin-panel?schema=public"

# Generate strong random values, e.g.: node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
ADMIN_JWT_SECRET=
CUSTOMER_JWT_SECRET=

# Comma-separated list of allowed frontend origins. If unset, falls back to a
# hardcoded dev/legacy-prod list — see src/config/env.js.
CORS_ORIGINS=http://localhost:5173,http://localhost:5174,http://localhost:5175

CLOUDINARY_CLOUD_NAME=
CLOUDINARY_API_KEY=
CLOUDINARY_API_SECRET=
```

- [ ] **Step 4: Wire `app.js` to use the config module for CORS**

Current (`src/app.js:1-39`):
```js
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const { requireAuth } = require("./middleware/auth");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const contentRoutes = require("./routes/contentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerPanelRoutes = require("./routes/customerPanelRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const couponRoutes = require("./routes/couponRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: [
      "http://168.231.69.231:9006",
      "http://168.231.69.231:9007",
      "http://localhost:5173",
      "http://localhost:5175",
      "http://localhost:5174",
    ],
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

Replace with:
```js
const dotenv = require("dotenv");
dotenv.config();

const cors = require("cors");
const express = require("express");
const helmet = require("helmet");
const morgan = require("morgan");
const rateLimit = require("express-rate-limit");

const env = require("./config/env");
const { requireAuth } = require("./middleware/auth");
const { errorHandler, notFound } = require("./middleware/errorHandler");
const authRoutes = require("./routes/authRoutes");
const categoryRoutes = require("./routes/categoryRoutes");
const contentRoutes = require("./routes/contentRoutes");
const customerRoutes = require("./routes/customerRoutes");
const customerPanelRoutes = require("./routes/customerPanelRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const orderRoutes = require("./routes/orderRoutes");
const productRoutes = require("./routes/productRoutes");
const settingsRoutes = require("./routes/settingsRoutes");
const couponRoutes = require("./routes/couponRoutes");
const uploadRoutes = require("./routes/uploadRoutes");

const app = express();

app.use(helmet());
app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
app.use(
  cors({
    origin: env.corsOrigins,
    credentials: true,
  }),
);
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
```

(The `require("./config/env")` line must come after `dotenv.config()` so `process.env` is already populated when the module validates it.)

- [ ] **Step 5: Update `middleware/auth.js` to use split secrets, no fallback**

Current full file:
```js
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET || "admin");
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

async function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Customer authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET || "admin");
    if (payload.type !== "customer") {
      throw new ApiError(401, "Invalid customer token");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.id },
    });
    if (!customer || customer.status !== "Active") {
      throw new ApiError(401, "Customer account is inactive or unavailable");
    }

    req.customer = customer;
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, "Invalid or expired customer token"));
  }
}

module.exports = { requireAuth, requireCustomerAuth };
```

Replace with:
```js
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/apiError");

function requireAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Authentication token is required"));
  }

  try {
    req.user = jwt.verify(token, env.adminJwtSecret);
    return next();
  } catch (error) {
    return next(new ApiError(401, "Invalid or expired token"));
  }
}

async function requireCustomerAuth(req, res, next) {
  const header = req.headers.authorization || "";
  const token = header.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new ApiError(401, "Customer authentication token is required"));
  }

  try {
    const payload = jwt.verify(token, env.customerJwtSecret);
    if (payload.type !== "customer") {
      throw new ApiError(401, "Invalid customer token");
    }

    const customer = await prisma.customer.findUnique({
      where: { id: payload.id },
    });
    if (!customer || customer.status !== "Active") {
      throw new ApiError(401, "Customer account is inactive or unavailable");
    }

    req.customer = customer;
    return next();
  } catch (error) {
    if (error instanceof ApiError) return next(error);
    return next(new ApiError(401, "Invalid or expired customer token"));
  }
}

module.exports = { requireAuth, requireCustomerAuth };
```

(The `payload.type !== "customer"` check in `requireCustomerAuth` is kept as defense-in-depth even though the secret split now makes it impossible for an admin token to reach this point at all.)

- [ ] **Step 6: Update `authService.js` to sign with `adminJwtSecret`**

Current (`src/services/authService.js:1-4` and `:41-45`):
```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
```
```js
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    process.env.JWT_SECRET || "admin",
    { expiresIn: "7d" },
  );
```

Replace the import block with:
```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
```

Replace the sign call with:
```js
  const token = jwt.sign(
    { id: user.id, email: user.email, role: user.role },
    env.adminJwtSecret,
    { expiresIn: "7d" },
  );
```

- [ ] **Step 7: Update `customerPanelService.js` to sign with `customerJwtSecret`**

Current (`src/services/customerPanelService.js:1-5` and `:30-36`):
```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
```
```js
function signCustomerToken(customer) {
  return jwt.sign(
    { id: customer.id, email: customer.email, type: "customer" },
    process.env.JWT_SECRET || "admin",
    { expiresIn: "7d" },
  );
}
```

Replace the import block with:
```js
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { prisma } = require("../config/db");
const env = require("../config/env");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");
```

Replace `signCustomerToken` with:
```js
function signCustomerToken(customer) {
  return jwt.sign(
    { id: customer.id, email: customer.email, type: "customer" },
    env.customerJwtSecret,
    { expiresIn: "7d" },
  );
}
```

- [ ] **Step 8: Verify fail-fast behavior (no DB required)**

Run:
```bash
cd Admin-pannel-backend
node -e "delete process.env.ADMIN_JWT_SECRET; process.env.CUSTOMER_JWT_SECRET='x'; require('dotenv').config(); process.env.ADMIN_JWT_SECRET=''; require('./src/config/env');"
```
Expected: prints `Missing required environment variable: ADMIN_JWT_SECRET` and the process exits non-zero (confirm with `echo $?` on the next line showing `1`).

- [ ] **Step 9: Verify secret isolation (no DB, no running server required)**

Run:
```bash
cd Admin-pannel-backend
node -e "
require('dotenv').config();
const jwt = require('jsonwebtoken');
const env = require('./src/config/env');

const customerToken = jwt.sign({ id: 'cust_1', email: 'a@b.com', type: 'customer' }, env.customerJwtSecret);
const adminToken = jwt.sign({ id: 'admin_1', email: 'x@y.com', role: 'Store Owner' }, env.adminJwtSecret);

try {
  jwt.verify(customerToken, env.adminJwtSecret);
  console.log('FAIL: customer token verified with admin secret');
} catch (e) {
  console.log('PASS: customer token rejected by admin secret (' + e.message + ')');
}

try {
  jwt.verify(adminToken, env.customerJwtSecret);
  console.log('FAIL: admin token verified with customer secret');
} catch (e) {
  console.log('PASS: admin token rejected by customer secret (' + e.message + ')');
}
"
```
Expected output:
```
PASS: customer token rejected by admin secret (invalid signature)
PASS: admin token rejected by customer secret (invalid signature)
```

- [ ] **Step 10: Commit**

```bash
cd Admin-pannel-backend
git add src/config/env.js .env.example src/app.js src/middleware/auth.js src/services/authService.js src/services/customerPanelService.js
git commit -m "security: split admin/customer JWT secrets, fail fast on missing config, move CORS origins to env"
```

(`.env` is gitignored and intentionally not part of this commit.)

---

### Task 2: Stricter rate limiting on auth endpoints

**Files:**
- Modify: `Admin-pannel-backend/src/app.js`

**Interfaces:**
- Consumes: `env` module from Task 1 (already required in `app.js`); `rateLimit` from `express-rate-limit` (already imported in `app.js`).
- Produces: no new exports; purely adds middleware to the existing Express app.

- [ ] **Step 1: Add a dedicated auth rate limiter, applied before the general routes**

Current (`src/app.js`, after the global rate limiter block, before route mounting):
```js
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

app.get("/", (req, res) => {
  res.send("E-Commerce server is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Admin panel backend is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/customer-panel", customerPanelRoutes);
```

Replace with:
```js
app.use(
  "/api",
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 300,
    standardHeaders: true,
    legacyHeaders: false,
  }),
);

const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { success: false, message: "Too many attempts. Please try again later." },
});

app.use("/api/auth/login", authRateLimit);
app.use("/api/customer-panel/auth/login", authRateLimit);
app.use("/api/customer-panel/auth/register", authRateLimit);

app.get("/", (req, res) => {
  res.send("E-Commerce server is running 🚀");
});

app.get("/health", (req, res) => {
  res.json({ success: true, message: "Admin panel backend is healthy" });
});

app.use("/api/auth", authRoutes);
app.use("/api/customer-panel", customerPanelRoutes);
```

- [ ] **Step 2: Verify the stricter limit triggers before the global one**

Run (starts the dev server in the background, hits the login endpoint 11 times, then stops the server):
```bash
cd Admin-pannel-backend
npm run dev &
SERVER_PID=$!
sleep 2
for i in $(seq 1 11); do
  curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:5000/api/auth/login \
    -H "Content-Type: application/json" \
    -d '{"email":"nobody@example.com","password":"wrong"}'
done
kill $SERVER_PID
```
Expected: the first 10 lines print a status code other than `429` (e.g. `401` if the DB is reachable, or `500` if it isn't — either is fine, since the limiter runs before the DB call), and the 11th line prints `429`.

- [ ] **Step 3: Commit**

```bash
cd Admin-pannel-backend
git add src/app.js
git commit -m "security: add stricter rate limit on login/register endpoints"
```

---

### Task 3: Confirm CORS behavior (default preserved, env override works)

**Files:**
- None (verification-only task; the CORS code itself was already written in Task 1 Step 4).

**Interfaces:**
- Consumes: running server from Task 1/2's `app.js` changes, `.env`'s `CORS_ORIGINS` value.

- [ ] **Step 1: Verify default origins still work when `CORS_ORIGINS` is set (current `.env` value)**

Run:
```bash
cd Admin-pannel-backend
npm run dev &
SERVER_PID=$!
sleep 2
echo "--- allowed origin ---"
curl -s -i -H "Origin: http://localhost:5173" http://localhost:5000/health | grep -i "access-control-allow-origin"
echo "--- disallowed origin ---"
curl -s -i -H "Origin: http://evil.example.com" http://localhost:5000/health | grep -i "access-control-allow-origin"
kill $SERVER_PID
```
Expected: the first `grep` prints `Access-Control-Allow-Origin: http://localhost:5173`; the second `grep` prints nothing (no matching header for a disallowed origin).

- [ ] **Step 2: Verify overriding `CORS_ORIGINS` changes the allowlist**

Run:
```bash
cd Admin-pannel-backend
cp .env .env.bak
echo "CORS_ORIGINS=http://example-test.com" >> .env
npm run dev &
SERVER_PID=$!
sleep 2
echo "--- new allowed origin ---"
curl -s -i -H "Origin: http://example-test.com" http://localhost:5000/health | grep -i "access-control-allow-origin"
echo "--- old default origin, now disallowed ---"
curl -s -i -H "Origin: http://localhost:5173" http://localhost:5000/health | grep -i "access-control-allow-origin"
kill $SERVER_PID
mv .env.bak .env
```
Expected: first `grep` prints `Access-Control-Allow-Origin: http://example-test.com`; second `grep` prints nothing. The `.env` restore at the end must leave the file exactly as Task 1 Step 2 set it.

- [ ] **Step 3: No commit needed**

This task only verifies behavior already committed in Task 1 and Task 2 — nothing new to commit.

---

## Plan Self-Review Notes

- **Spec coverage:** §1 JWT split → Task 1. §2 CORS env-configurable → Task 1 Step 4 (code) + Task 3 (verification). §3 rate limiting → Task 2. §4 (avatar upload) → confirmed not needed, no task, per the design doc's correction. `.env.example` → Task 1 Step 3. Fail-fast startup → Task 1 Steps 1 & 8.
- **Type consistency:** `env.adminJwtSecret` / `env.customerJwtSecret` / `env.corsOrigins` names are identical across `config/env.js`, `app.js`, `middleware/auth.js`, `authService.js`, and `customerPanelService.js`.
- **No placeholders:** every step has literal runnable code/commands and concrete expected output.
