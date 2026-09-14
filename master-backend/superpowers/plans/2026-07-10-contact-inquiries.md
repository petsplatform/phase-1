# Blog Removal + Contact Inquiries Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Remove the unused Blog feature everywhere, and make the storefront Contact form create real `Inquiry` records that admins can view, update the status of, and delete in Admin-Panel.

**Architecture:** Backend gets a new `Inquiry` Prisma model with a public `POST /api/inquiries` (create) and admin-only `GET/PATCH/DELETE`, following the existing `contentRoutes.js` public-route-before-`requireAuth` pattern. The storefront's static Contact form gets a real submit handler. Admin-Panel's already-stubbed Inquiries page gets wired to live data, replacing dummy state with `DataContext`-driven API calls (same pattern as Orders/Customers). Blog is deleted end-to-end: Prisma model, routes, controller, service, validation, and every Admin-Panel reference (page, route, nav, forms, table, context, dummy data).

**Tech Stack:** Express, Prisma (PostgreSQL), Zod validation, Jest, React (Admin-Panel + Best-Vet-Care), plain `fetch`-based `apiRequest` helper in Admin-Panel, axios in Best-Vet-Care.

## Global Constraints

- Inquiry `id` uses the codebase's `generateId()` convention (prefix-based string), not `cuid()`, for consistency with Banner/Blog/Category/Coupon models — deviates from the earlier spec draft's `@default(cuid())`, which was written before checking existing ID conventions.
- Inquiry status enum values are `New`, `InProgress`, `Resolved` (no spaces — Prisma enum constraint); the UI displays `In Progress` for `InProgress` via a small label map, chosen because `StatusBadge` already has color variants for `"In Progress"`.
- `POST /api/inquiries` must be public (no auth) since guest storefront visitors submit it.
- `GET/PATCH/DELETE /api/inquiries` must require `requireAuth` (admin-only).

---

### Task 1: Backend — remove Blog everywhere

**Files:**
- Modify: `Admin-pannel-backend/prisma/schema.prisma` (remove `enum BlogStatus` at lines 32-35, remove `model Blog` at lines 139-150)
- Modify: `Admin-pannel-backend/src/controllers/contentController.js` (remove `blogController`, remove from exports)
- Modify: `Admin-pannel-backend/src/services/contentService.js` (remove `blogService`, remove from exports, remove the `typeName === "blog"` branch in `makeCrudService`'s `list`)
- Modify: `Admin-pannel-backend/src/routes/contentRoutes.js` (remove the 5 `/blogs` route lines and the `blogController`/`blogSchema` imports)
- Modify: `Admin-pannel-backend/src/validations/adminSchemas.js` (remove `blogSchema`, remove from exports)

**Interfaces:**
- Produces: nothing new (pure deletion). Confirms no other backend file imports `blogController`, `blogService`, or `blogSchema` after this task.

- [ ] **Step 1: Remove Blog from the Prisma schema**

Delete lines 32-35 (`enum BlogStatus { ... }`) and lines 139-150 (`model Blog { ... }`) from `prisma/schema.prisma`.

- [ ] **Step 2: Generate the migration**

Run: `cd Admin-pannel-backend && npx prisma migrate dev --name remove_blog`
Expected: migration created, applied, and `Blog` table dropped locally without errors.

- [ ] **Step 3: Remove `blogController` from `contentController.js`**

Delete this line:
```js
const blogController = makeCrudController(contentService.blogService, "blog");
```
And remove `blogController` from the `module.exports` object.

- [ ] **Step 4: Remove `blogService` from `contentService.js`**

Delete this line:
```js
const blogService = makeCrudService("blog", "blog");
```
Simplify the `list` function's ternary (it currently branches on `typeName === "blog"`) back to a single search config, since only `banner` uses `makeCrudService` now:
```js
list: ({ q }) => {
  return model.findMany({
    where: q ? { OR: [{ title: { contains: q, mode: "insensitive" } }, { subtitle: { contains: q, mode: "insensitive" } }] } : undefined,
    orderBy: { createdAt: "desc" },
  });
},
```
Remove `blogService` from `module.exports`.

- [ ] **Step 5: Remove `/blogs` routes from `contentRoutes.js`**

Delete these 5 lines:
```js
router.get("/blogs", blogController.list);
router.post("/blogs", ...uploadSingleImage("image"), validate(blogSchema), blogController.create);
router.get("/blogs/:id", validate(idParam), blogController.get);
router.put("/blogs/:id", ...uploadSingleImage("image"), validate(blogSchema), blogController.update);
router.delete("/blogs/:id", validate(idParam), blogController.remove);
```
Remove `blogController` from the top `require("../controllers/contentController")` destructure and `blogSchema` from the `require("../validations/adminSchemas")` destructure.

- [ ] **Step 6: Remove `blogSchema` from `adminSchemas.js`**

Delete the `blogSchema` definition (lines 151-163) and remove `blogSchema` from `module.exports`.

- [ ] **Step 7: Run the full backend test suite**

Run: `cd Admin-pannel-backend && npx jest`
Expected: all suites pass except the pre-existing unrelated `tests/services/checkoutOtpService.test.js` failure (missing module, predates this work — confirmed via `git stash` earlier). No new failures.

- [ ] **Step 8: Commit**

```bash
cd Admin-pannel-backend
git add prisma/schema.prisma prisma/migrations src/controllers/contentController.js src/services/contentService.js src/routes/contentRoutes.js src/validations/adminSchemas.js
git commit -m "$(cat <<'EOF'
feat: remove unused Blog feature from backend

Deletes the Blog Prisma model, routes, controller, service, and
validation schema. Blog was never linked to any storefront content
and is being replaced by the Inquiries feature.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 2: Admin-Panel — remove Blog everywhere

**Files:**
- Delete: `Admin-Panel/src/pages/Configurations/Blogs.jsx`
- Modify: `Admin-Panel/src/routes/AppRoutes.jsx` (remove `Blogs` import at line 15, remove `/config/blogs` route at line 120)
- Modify: `Admin-Panel/src/components/layout/Sidebar.jsx` (remove `blogs` nav item at line 65, remove unused `BookOpen` import)
- Modify: `Admin-Panel/src/components/layout/Topbar.jsx` (remove `Blogs` entry at line 62, remove unused `BookOpen` import)
- Modify: `Admin-Panel/src/lib/api.js` (remove `blogs: () => apiRequest("/content/blogs"),` at line 198)
- Modify: `Admin-Panel/src/api/contentApi.js` (remove `getAllBlogs`/`createBlog`/`updateBlog`/`deleteBlog`, lines 24-42)
- Modify: `Admin-Panel/src/context/DataContext.jsx` (remove all blog state/actions — see steps)
- Modify: `Admin-Panel/src/components/Configurations/ConfigurationTables.jsx` (remove `BlogTable`, lines 269-525, and the `BlogForm` import)
- Modify: `Admin-Panel/src/components/Configurations/ConfigForms.jsx` (remove `toBlogStatus` at lines 32-35 and `BlogForm` at lines 342-445)
- Modify: `Admin-Panel/src/data/dummyData.js` (remove `export const blogs = [];` at line 18)

**Interfaces:**
- Produces: nothing new (pure deletion). After this task, `grep -ri blog Admin-Panel/src` should only match `DemoForm.jsx`'s unrelated `<option>Blog Feature</option>` dropdown placeholder (left as-is — generic demo scaffolding, not the real feature).

- [ ] **Step 1: Delete the Blogs page and its route**

Delete `src/pages/Configurations/Blogs.jsx`.

In `src/routes/AppRoutes.jsx`, remove:
```js
import Blogs from "../pages/Configurations/Blogs";
```
and:
```js
<Route path="/config/blogs" element={<Blogs />} />
```

- [ ] **Step 2: Remove Blog nav entries**

In `src/components/layout/Sidebar.jsx`, remove:
```js
{ key: "blogs", label: "Blogs", icon: BookOpen, path: "/config/blogs" },
```
and remove `BookOpen` from the `lucide-react` import list at the top (it becomes unused once this line is gone — confirm no other usage in the file before removing).

In `src/components/layout/Topbar.jsx`, remove:
```js
{ label: "Blogs", path: "/config/blogs", icon: BookOpen },
```
and remove `BookOpen` from its `lucide-react` import list (same unused-import check).

- [ ] **Step 3: Remove Blog from the API clients**

In `src/lib/api.js`, remove:
```js
blogs: () => apiRequest("/content/blogs"),
```

In `src/api/contentApi.js`, remove the four methods `getAllBlogs`, `createBlog`, `updateBlog`, `deleteBlog` (lines 24-42), keeping the `Banner`/`Coupon` methods intact.

- [ ] **Step 4: Remove Blog from `DataContext.jsx`**

Remove the import:
```js
blogs as initialBlogs,
```
Remove the state line:
```js
const [blogs, setBlogs] = useState(initialBlogs)
```
In `loadBackendData`, change:
```js
const [ordersData, customersData, bannersData, blogsData, couponsData] = await Promise.all([
  adminApi.orders(),
  adminApi.customers(),
  adminApi.banners(),
  adminApi.blogs(),
  adminApi.coupons(),
])
```
to:
```js
const [ordersData, customersData, bannersData, couponsData] = await Promise.all([
  adminApi.orders(),
  adminApi.customers(),
  adminApi.banners(),
  adminApi.coupons(),
])
```
and remove the line `setBlogs(blogsData.map(normalizeContent))`.

Remove the "Blogs" action block:
```js
// Blogs
const addBlog = (item) => setBlogs(prev => [normalizeContent(item), ...prev])
const deleteBlog = (id) => setBlogs(prev => prev.filter(b => b.id !== id))
const updateBlog = (id, updatedData) => setBlogs(prev => prev.map(b => b.id === id ? normalizeContent({ ...b, ...updatedData }) : b))
```
Remove `blogs, addBlog, deleteBlog, updateBlog,` from the returned context value object.

- [ ] **Step 5: Remove `BlogTable` and `BlogForm`**

In `src/components/Configurations/ConfigurationTables.jsx`, delete the entire `BlogTable` function (lines 269-525, everything between `BannerTable`'s closing and `InquiryTable`'s opening), and remove `BlogForm` from the import:
```js
import { CouponForm, BannerForm, BlogForm, NotificationForm } from './ConfigForms'
```
becomes:
```js
import { CouponForm, BannerForm, NotificationForm } from './ConfigForms'
```

In `src/components/Configurations/ConfigForms.jsx`, delete the `toBlogStatus` function (lines 32-35) and the entire `BlogForm` function (lines 342-445, everything between `BannerForm`'s closing and `NotificationForm`'s opening).

- [ ] **Step 6: Remove the dummy data export**

In `src/data/dummyData.js`, remove:
```js
export const blogs = [];
```

- [ ] **Step 7: Verify the app builds and no stale references remain**

Run: `cd Admin-Panel && npm run build`
Expected: build succeeds with no errors about missing `Blogs`, `BlogTable`, `BlogForm`, `blogs`, `addBlog`, `deleteBlog`, `updateBlog`, or `blogSchema`.

Also run a grep to confirm cleanup: `grep -ril blog Admin-Panel/src` — expect only `DemoForm.jsx` in the output.

- [ ] **Step 8: Commit**

```bash
cd Admin-Panel
git add -A
git commit -m "$(cat <<'EOF'
feat: remove unused Blog page from Admin Panel

Removes the Blogs page, route, nav entries, forms, table, API client
methods, and DataContext wiring. Matches the backend Blog removal.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 3: Backend — Inquiry Prisma model

**Files:**
- Modify: `Admin-pannel-backend/prisma/schema.prisma` (add `enum InquiryStatus` and `model Inquiry`)
- Modify: `Admin-pannel-backend/src/utils/ids.js` (add `inquiry: "INQ"` prefix)

**Interfaces:**
- Produces: `prisma.inquiry` model with fields `id, fullName, email, phone, subject, message, status (New|InProgress|Resolved), createdAt, updatedAt`. `generateId("inquiry")` returns `"INQ-<timestamp>"`.

- [ ] **Step 1: Add the Inquiry model**

Add this block to `prisma/schema.prisma`, near the other content models (after `model Popup`, before `model Announcement` — or anywhere models live; exact position doesn't matter to Prisma):
```prisma
enum InquiryStatus {
  New
  InProgress
  Resolved
}

model Inquiry {
  id        String        @id
  fullName  String
  email     String
  phone     String?
  subject   String
  message   String
  status    InquiryStatus @default(New)
  createdAt DateTime      @default(now())
  updatedAt DateTime      @updatedAt
}
```

- [ ] **Step 2: Add the ID prefix**

In `src/utils/ids.js`, add `inquiry: "INQ",` to the `PREFIXES` object:
```js
const PREFIXES = {
  product: "PRD",
  category: "CAT",
  order: "ORD",
  customer: "CUS",
  banner: "BAN",
  coupon: "CPN",
  inquiry: "INQ",
};
```
(Note: `blog: "BLG"` was already removed in Task 1's schema cleanup — if it's still present from before Task 1 ran, remove it here.)

- [ ] **Step 3: Generate the migration**

Run: `cd Admin-pannel-backend && npx prisma migrate dev --name add_inquiry`
Expected: migration created and applied, `Inquiry` table exists locally.

- [ ] **Step 4: Commit**

```bash
cd Admin-pannel-backend
git add prisma/schema.prisma prisma/migrations src/utils/ids.js
git commit -m "$(cat <<'EOF'
feat: add Inquiry Prisma model

Adds the Inquiry table backing the storefront Contact form submission
feature, with a New/InProgress/Resolved status workflow.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 4: Backend — Inquiry validation schemas

**Files:**
- Modify: `Admin-pannel-backend/src/validations/adminSchemas.js` (add `inquirySchema`, `inquiryStatusSchema`)

**Interfaces:**
- Consumes: `requiredString`, `optionalString` helpers already defined at the top of the file.
- Produces: `inquirySchema` (validates `POST /api/inquiries` body: `fullName`, `email`, `subject`, `message` required; `phone` optional). `inquiryStatusSchema` (validates `PATCH /:id/status` body: `status` enum, `id` param).

- [ ] **Step 1: Add the schemas**

Add near `couponSchema`, before `settingsSchema`:
```js
const inquirySchema = z.object({
  body: z.object({
    fullName: requiredString("Full name"),
    email: z.string().email("A valid email address is required"),
    phone: optionalString,
    subject: requiredString("Subject"),
    message: requiredString("Message"),
  }),
  params: z.any().optional(),
  query: z.any().optional(),
});

const inquiryStatusSchema = z.object({
  body: z.object({
    status: z.enum(["New", "InProgress", "Resolved"]),
  }),
  params: z.object({ id: z.string().min(1) }),
  query: z.any().optional(),
});
```

Add `inquirySchema` and `inquiryStatusSchema` to `module.exports`.

- [ ] **Step 2: Run backend tests**

Run: `cd Admin-pannel-backend && npx jest`
Expected: no failures introduced (this file has no dedicated test suite; this step just confirms the file still parses and nothing else broke).

- [ ] **Step 3: Commit**

```bash
cd Admin-pannel-backend
git add src/validations/adminSchemas.js
git commit -m "$(cat <<'EOF'
feat: add Inquiry validation schemas

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 5: Backend — Inquiry service (TDD)

**Files:**
- Create: `Admin-pannel-backend/src/services/inquiryService.js`
- Test: `Admin-pannel-backend/tests/services/inquiryService.test.js`

**Interfaces:**
- Consumes: `prisma.inquiry` (from Task 3), `generateId("inquiry")` (from Task 3), `ApiError` (`src/utils/apiError.js`).
- Produces: `inquiryService.create(payload)`, `inquiryService.list()`, `inquiryService.updateStatus(id, status)`, `inquiryService.remove(id)` — consumed by Task 6's controller.

- [ ] **Step 1: Write the failing test**

Create `tests/services/inquiryService.test.js`:
```js
jest.mock("../../src/config/db", () => ({
  prisma: {
    inquiry: {
      create: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
  },
}));

const { prisma } = require("../../src/config/db");
const inquiryService = require("../../src/services/inquiryService");

describe("inquiryService", () => {
  beforeEach(() => {
    Object.values(prisma.inquiry).forEach((fn) => fn.mockReset());
  });

  it("creates an inquiry with a generated id", async () => {
    prisma.inquiry.create.mockResolvedValue({ id: "INQ-1", fullName: "Jane" });

    const result = await inquiryService.create({
      fullName: "Jane",
      email: "jane@example.com",
      subject: "Order Support",
      message: "Where is my order?",
    });

    expect(prisma.inquiry.create).toHaveBeenCalledWith({
      data: expect.objectContaining({
        id: expect.stringMatching(/^INQ-/),
        fullName: "Jane",
        email: "jane@example.com",
      }),
    });
    expect(result).toEqual({ id: "INQ-1", fullName: "Jane" });
  });

  it("lists inquiries newest first", async () => {
    prisma.inquiry.findMany.mockResolvedValue([]);

    await inquiryService.list();

    expect(prisma.inquiry.findMany).toHaveBeenCalledWith({
      orderBy: { createdAt: "desc" },
    });
  });

  it("updates status when the inquiry exists", async () => {
    prisma.inquiry.findUnique.mockResolvedValue({ id: "INQ-1" });
    prisma.inquiry.update.mockResolvedValue({ id: "INQ-1", status: "Resolved" });

    const result = await inquiryService.updateStatus("INQ-1", "Resolved");

    expect(prisma.inquiry.update).toHaveBeenCalledWith({
      where: { id: "INQ-1" },
      data: { status: "Resolved" },
    });
    expect(result).toEqual({ id: "INQ-1", status: "Resolved" });
  });

  it("throws 404 when updating status of a missing inquiry", async () => {
    prisma.inquiry.findUnique.mockResolvedValue(null);

    await expect(inquiryService.updateStatus("missing", "Resolved")).rejects.toMatchObject({
      statusCode: 404,
    });
  });

  it("deletes an inquiry when it exists", async () => {
    prisma.inquiry.findUnique.mockResolvedValue({ id: "INQ-1" });
    prisma.inquiry.delete.mockResolvedValue({});

    await inquiryService.remove("INQ-1");

    expect(prisma.inquiry.delete).toHaveBeenCalledWith({ where: { id: "INQ-1" } });
  });

  it("throws 404 when deleting a missing inquiry", async () => {
    prisma.inquiry.findUnique.mockResolvedValue(null);

    await expect(inquiryService.remove("missing")).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
```

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Admin-pannel-backend && npx jest tests/services/inquiryService.test.js`
Expected: FAIL with "Cannot find module '../../src/services/inquiryService'".

- [ ] **Step 3: Write the implementation**

Create `src/services/inquiryService.js`:
```js
const { prisma } = require("../config/db");
const ApiError = require("../utils/apiError");
const { generateId } = require("../utils/ids");

async function ensureExists(id) {
  const record = await prisma.inquiry.findUnique({ where: { id } });
  if (!record) throw new ApiError(404, "Inquiry not found");
  return record;
}

const create = (payload) =>
  prisma.inquiry.create({ data: { id: generateId("inquiry"), ...payload } });

const list = () => prisma.inquiry.findMany({ orderBy: { createdAt: "desc" } });

async function updateStatus(id, status) {
  await ensureExists(id);
  return prisma.inquiry.update({ where: { id }, data: { status } });
}

async function remove(id) {
  await ensureExists(id);
  await prisma.inquiry.delete({ where: { id } });
}

module.exports = { create, list, updateStatus, remove };
```

- [ ] **Step 4: Run test to verify it passes**

Run: `cd Admin-pannel-backend && npx jest tests/services/inquiryService.test.js`
Expected: PASS, 6 tests.

- [ ] **Step 5: Commit**

```bash
cd Admin-pannel-backend
git add src/services/inquiryService.js tests/services/inquiryService.test.js
git commit -m "$(cat <<'EOF'
feat: add inquiryService with TDD coverage

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 6: Backend — Inquiry controller, routes, and auth-gating test

**Files:**
- Create: `Admin-pannel-backend/src/controllers/inquiryController.js`
- Create: `Admin-pannel-backend/src/routes/inquiryRoutes.js`
- Modify: `Admin-pannel-backend/src/app.js` (mount the router)
- Test: `Admin-pannel-backend/tests/routes/inquiryRoutes.test.js`

**Interfaces:**
- Consumes: `inquiryService` (Task 5), `inquirySchema`/`inquiryStatusSchema`/`idParam` (Task 4), `validate` middleware (`src/middleware/validate.js`), `requireAuth` (`src/middleware/auth.js`), `asyncHandler` (`src/utils/asyncHandler.js`).
- Produces: `POST/GET /api/inquiries`, `PATCH /api/inquiries/:id/status`, `DELETE /api/inquiries/:id`.

- [ ] **Step 1: Write the failing route test**

Create `tests/routes/inquiryRoutes.test.js`:
```js
const request = require("supertest");

jest.mock("../../src/config/db", () => ({
  prisma: {
    inquiry: {
      create: jest.fn().mockResolvedValue({ id: "INQ-1", status: "New" }),
      findMany: jest.fn().mockResolvedValue([]),
      findUnique: jest.fn().mockResolvedValue({ id: "INQ-1" }),
      update: jest.fn().mockResolvedValue({ id: "INQ-1", status: "Resolved" }),
      delete: jest.fn().mockResolvedValue({}),
    },
  },
}));

const app = require("../../src/app");

describe("Inquiry routes", () => {
  it("allows a public POST without a token", async () => {
    const res = await request(app).post("/api/inquiries").send({
      fullName: "Jane",
      email: "jane@example.com",
      subject: "Order Support",
      message: "Where is my order?",
    });

    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("rejects GET without a token", async () => {
    const res = await request(app).get("/api/inquiries");
    expect(res.status).toBe(401);
  });

  it("rejects PATCH status without a token", async () => {
    const res = await request(app).patch("/api/inquiries/INQ-1/status").send({ status: "Resolved" });
    expect(res.status).toBe(401);
  });

  it("rejects DELETE without a token", async () => {
    const res = await request(app).delete("/api/inquiries/INQ-1");
    expect(res.status).toBe(401);
  });
});
```

Check `supertest` is available: run `cd Admin-pannel-backend && npm ls supertest`. If it's not installed, add it: `npm install --save-dev supertest`.

- [ ] **Step 2: Run test to verify it fails**

Run: `cd Admin-pannel-backend && npx jest tests/routes/inquiryRoutes.test.js`
Expected: FAIL — routes don't exist yet (404s / "Cannot find module" if `app.js` require fails first, in which case fix the require path, not the app).

- [ ] **Step 3: Write the controller**

Create `src/controllers/inquiryController.js`:
```js
const inquiryService = require("../services/inquiryService");
const asyncHandler = require("../utils/asyncHandler");

const create = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.create(req.validated.body);
  res.status(201).json({ success: true, data: inquiry });
});

const list = asyncHandler(async (req, res) => {
  const inquiries = await inquiryService.list();
  res.json({ success: true, data: inquiries });
});

const updateStatus = asyncHandler(async (req, res) => {
  const inquiry = await inquiryService.updateStatus(req.params.id, req.validated.body.status);
  res.json({ success: true, data: inquiry });
});

const remove = asyncHandler(async (req, res) => {
  await inquiryService.remove(req.params.id);
  res.json({ success: true, message: "Inquiry deleted" });
});

module.exports = { create, list, updateStatus, remove };
```

- [ ] **Step 4: Write the routes**

Create `src/routes/inquiryRoutes.js`:
```js
const express = require("express");
const inquiryController = require("../controllers/inquiryController");
const validate = require("../middleware/validate");
const { requireAuth } = require("../middleware/auth");
const { inquirySchema, inquiryStatusSchema, idParam } = require("../validations/adminSchemas");

const router = express.Router();

router.post("/", validate(inquirySchema), inquiryController.create);

router.use(requireAuth);

router.get("/", inquiryController.list);
router.patch("/:id/status", validate(inquiryStatusSchema), inquiryController.updateStatus);
router.delete("/:id", validate(idParam), inquiryController.remove);

module.exports = router;
```

- [ ] **Step 5: Mount the router**

In `src/app.js`, add the require near the other route requires:
```js
const inquiryRoutes = require("./routes/inquiryRoutes");
```
And mount it near the other `/api/*` mounts (no `requireAuth` at the mount level, since the router self-gates like `contentRoutes`):
```js
app.use("/api/inquiries", inquiryRoutes);
```

- [ ] **Step 6: Run test to verify it passes**

Run: `cd Admin-pannel-backend && npx jest tests/routes/inquiryRoutes.test.js`
Expected: PASS, 4 tests.

- [ ] **Step 7: Run the full suite**

Run: `cd Admin-pannel-backend && npx jest`
Expected: all pass except the known pre-existing `checkoutOtpService` failure.

- [ ] **Step 8: Commit**

```bash
cd Admin-pannel-backend
git add src/controllers/inquiryController.js src/routes/inquiryRoutes.js src/app.js tests/routes/inquiryRoutes.test.js package.json package-lock.json
git commit -m "$(cat <<'EOF'
feat: add Inquiry API routes with public create + admin-gated manage

POST /api/inquiries is public for storefront Contact form submissions.
GET/PATCH/DELETE require admin auth.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 7: Storefront — wire the Contact form to the API

**Files:**
- Create: `Best-Vet-Care/src/api/inquiryApi.js`
- Modify: `Best-Vet-Care/src/pages/Contact.jsx` (`handleSubmit`, lines 163-169)

**Interfaces:**
- Consumes: shared axios instance `Best-Vet-Care/src/api/axios.js` default export.
- Produces: `inquiryApi.submit(payload)` → `Promise<data>`, throws on failure.

- [ ] **Step 1: Create the API client**

Create `src/api/inquiryApi.js`:
```js
import api from './axios';

export const inquiryApi = {
  submit: async ({ fullName, email, phone, subject, message }) => {
    const res = await api.post('/inquiries', { fullName, email, phone, subject, message });
    return res.data.data;
  },
};
```

- [ ] **Step 2: Wire up the form submit handler**

In `src/pages/Contact.jsx`, add the import near the other imports:
```js
import { inquiryApi } from "../api/inquiryApi";
```

Replace `handleSubmit` (lines 163-169):
```js
const handleSubmit = (event) => {
  event.preventDefault();
  if (!validate()) return;

  setForm(initialForm);
  showToast("Thanks! Your message has been sent.");
};
```
with:
```js
const [submitting, setSubmitting] = useState(false);

const handleSubmit = async (event) => {
  event.preventDefault();
  if (!validate()) return;

  setSubmitting(true);
  try {
    await inquiryApi.submit(form);
    setForm(initialForm);
    showToast("Thanks! Your message has been sent.");
  } catch (error) {
    showToast("Something went wrong. Please try again.");
  } finally {
    setSubmitting(false);
  }
};
```
Add `submitting` to the existing `useState` imports at the top if not already destructured (it already imports `useState` from React at line 1, so this is just an additional `useState` call inside the component — place it next to the other `useState` calls, not inline where shown above; move the `const [submitting, setSubmitting] = useState(false);` line up next to `const [form, setForm] = useState(initialForm);` at line 141).

Disable the submit button while submitting — change the button (line 320-326):
```jsx
<button
  type="submit"
  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#17345f] px-7 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#d9aa3d]"
>
  <SendIcon className="h-4 w-4" />
  Send Message
</button>
```
to:
```jsx
<button
  type="submit"
  disabled={submitting}
  className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-lg bg-[#17345f] px-7 text-sm font-extrabold text-white shadow-[0_10px_24px_rgba(18,42,80,0.22)] transition-all hover:-translate-y-0.5 hover:bg-[#d9aa3d] disabled:cursor-not-allowed disabled:opacity-70"
>
  <SendIcon className="h-4 w-4" />
  {submitting ? "Sending..." : "Send Message"}
</button>
```

- [ ] **Step 3: Manual verification**

Run: `cd Best-Vet-Care && npm run dev`
Navigate to `/contact`, fill in Full Name, Email, Subject, Message, click "Send Message". Expected: button shows "Sending...", then the success toast appears and the form clears. Check the Network tab for a `201` response from `POST /inquiries`.

- [ ] **Step 4: Commit**

```bash
cd Best-Vet-Care
git add src/api/inquiryApi.js src/pages/Contact.jsx
git commit -m "$(cat <<'EOF'
feat: submit Contact form to the Inquiry API

The Contact page form previously only showed a toast and reset itself
with no backend call. It now creates a real Inquiry record that shows
up in Admin Panel.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 8: Admin-Panel — API client methods for inquiries

**Files:**
- Modify: `Admin-Panel/src/lib/api.js` (add to `adminApi`)

**Interfaces:**
- Produces: `adminApi.inquiries()`, `adminApi.updateInquiryStatus(id, status)`, `adminApi.deleteInquiry(id)` — consumed by Task 9.

- [ ] **Step 1: Add the methods**

In `src/lib/api.js`, add to the `adminApi` object (near `deleteCoupon`, before the closing `};`):
```js
inquiries: () => apiRequest("/inquiries"),
updateInquiryStatus: (id, status) =>
  apiRequest(`/inquiries/${id}/status`, {
    method: "PATCH",
    body: JSON.stringify({ status }),
  }),
deleteInquiry: (id) => apiRequest(`/inquiries/${id}`, { method: "DELETE" }),
```

- [ ] **Step 2: Commit**

```bash
cd Admin-Panel
git add src/lib/api.js
git commit -m "$(cat <<'EOF'
feat: add inquiry API client methods

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 9: Admin-Panel — wire Inquiries into DataContext

**Files:**
- Modify: `Admin-Panel/src/context/DataContext.jsx`

**Interfaces:**
- Consumes: `adminApi.inquiries()`, `adminApi.updateInquiryStatus()`, `adminApi.deleteInquiry()` (Task 8).
- Produces: `inquiries` (array with `{ id, name, email, phone, subject, message, status, date }`), `deleteInquiry(id)`, `updateInquiryStatus(id, status)` — consumed by Task 10.

- [ ] **Step 1: Add a status label map and normalizer**

Near `normalizeContent` (around line 75), add:
```js
const INQUIRY_STATUS_LABELS = { New: 'New', InProgress: 'In Progress', Resolved: 'Resolved' }
const INQUIRY_STATUS_TO_ENUM = { New: 'New', 'In Progress': 'InProgress', Resolved: 'Resolved' }

const normalizeInquiry = (inquiry) => ({
  ...inquiry,
  name: inquiry.fullName || inquiry.name,
  date: inquiry.createdAt ? new Date(inquiry.createdAt).toISOString().split('T')[0] : inquiry.date,
  status: INQUIRY_STATUS_LABELS[inquiry.status] || inquiry.status || 'New',
})
```

- [ ] **Step 2: Fetch inquiries in `loadBackendData`**

Change:
```js
const [ordersData, customersData, bannersData, couponsData] = await Promise.all([
  adminApi.orders(),
  adminApi.customers(),
  adminApi.banners(),
  adminApi.coupons(),
])
```
to:
```js
const [ordersData, customersData, bannersData, couponsData, inquiriesData] = await Promise.all([
  adminApi.orders(),
  adminApi.customers(),
  adminApi.banners(),
  adminApi.coupons(),
  adminApi.inquiries(),
])
```
and add, alongside the other `setX(...)` calls:
```js
setInquiries(inquiriesData.map(normalizeInquiry))
```

- [ ] **Step 3: Replace `deleteInquiry` and add `updateInquiryStatus`**

Replace:
```js
// Inquiries
const deleteInquiry = (id) => setInquiries(prev => prev.filter(i => i.id !== id))
```
with:
```js
// Inquiries
const deleteInquiry = async (id) => {
  if (getAdminToken()) {
    try { await adminApi.deleteInquiry(id) } catch { /* fallback */ }
  }
  setInquiries(prev => prev.filter(i => i.id !== id))
}

const updateInquiryStatus = async (id, status) => {
  const enumStatus = INQUIRY_STATUS_TO_ENUM[status] || status
  if (getAdminToken()) {
    try {
      const updated = await adminApi.updateInquiryStatus(id, enumStatus)
      setInquiries(prev => prev.map(i => i.id === id ? normalizeInquiry(updated) : i))
      return
    } catch { /* fallback */ }
  }
  setInquiries(prev => prev.map(i => i.id === id ? { ...i, status } : i))
}
```

- [ ] **Step 4: Expose `updateInquiryStatus` from the context**

Change:
```js
inquiries, deleteInquiry,
```
to:
```js
inquiries, deleteInquiry, updateInquiryStatus,
```

- [ ] **Step 5: Manual verification**

Run: `cd Admin-Panel && npm run dev`, log in, open the browser console, confirm no errors on load. (The Inquiries page isn't reachable yet — that's Task 10 — this step just confirms `DataContext` doesn't throw.)

- [ ] **Step 6: Commit**

```bash
cd Admin-Panel
git add src/context/DataContext.jsx
git commit -m "$(cat <<'EOF'
feat: fetch and manage inquiries through the real API in DataContext

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```

---

### Task 10: Admin-Panel — Inquiry detail modal, table wiring, and nav

**Files:**
- Create: `Admin-Panel/src/components/Configurations/InquiryDetailModal.jsx`
- Modify: `Admin-Panel/src/components/Configurations/ConfigurationTables.jsx` (`InquiryTable`, lines 526-563)
- Modify: `Admin-Panel/src/components/layout/Sidebar.jsx` (uncomment inquiries nav item, line 79)
- Modify: `Admin-Panel/src/components/layout/Topbar.jsx` (uncomment inquiries entry, line 70)

**Interfaces:**
- Consumes: `inquiries`, `deleteInquiry`, `updateInquiryStatus` from `useData()` (Task 9); `Modal`, `DeleteModal`, `StatusSelect`, `StatusBadge`, `Table` (existing common components).

- [ ] **Step 1: Create the detail modal**

Create `src/components/Configurations/InquiryDetailModal.jsx`:
```jsx
import StatusSelect from '../common/StatusSelect'

const STATUS_OPTIONS = ['New', 'In Progress', 'Resolved']

export default function InquiryDetailModal({ inquiry, onStatusChange, onDelete }) {
  if (!inquiry) return null

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Full Name</p>
          <p className="text-sm font-semibold text-gray-800">{inquiry.name}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Email</p>
          <p className="text-sm font-semibold text-gray-800">{inquiry.email}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Phone</p>
          <p className="text-sm font-semibold text-gray-800">{inquiry.phone || '—'}</p>
        </div>
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase">Subject</p>
          <p className="text-sm font-semibold text-gray-800">{inquiry.subject}</p>
        </div>
      </div>

      <div>
        <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Message</p>
        <p className="text-sm text-gray-700 whitespace-pre-wrap bg-gray-50 rounded-xl p-4 border border-gray-100">{inquiry.message}</p>
      </div>

      <div className="flex items-center justify-between pt-4 border-t border-gray-100">
        <div>
          <p className="text-[10px] font-bold text-gray-400 uppercase mb-1">Status</p>
          <StatusSelect status={inquiry.status} options={STATUS_OPTIONS} onChange={onStatusChange} />
        </div>
        <button
          onClick={onDelete}
          className="px-4 py-2 rounded-xl border border-red-200 text-sm font-semibold text-red-600 hover:bg-red-50 transition-all"
        >
          Delete Inquiry
        </button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Wire it into `InquiryTable`**

In `src/components/Configurations/ConfigurationTables.jsx`, add the import near the top:
```js
import InquiryDetailModal from './InquiryDetailModal'
```

Replace the `InquiryTable` function (lines 526-563):
```js
export function InquiryTable() {
  const { inquiries, deleteInquiry } = useData()
  const [isDeleting, setIsDeleting] = useState(null)

  const handleDelete = () => {
    deleteInquiry(isDeleting)
    setIsDeleting(null)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject', render: v => <span className="font-medium text-gray-800">{v || '—'}</span> },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]
  return (
    <>
      <Table title="Inquiries" data={inquiries} columns={columns} searchKey="name" />
      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Inquiry"
      />
    </>
  )
}
```
with:
```js
export function InquiryTable() {
  const { inquiries, deleteInquiry, updateInquiryStatus } = useData()
  const [isDeleting, setIsDeleting] = useState(null)
  const [viewingInquiry, setViewingInquiry] = useState(null)

  const handleDelete = () => {
    deleteInquiry(isDeleting)
    setIsDeleting(null)
  }

  const handleStatusChange = (status) => {
    updateInquiryStatus(viewingInquiry.id, status)
    setViewingInquiry(prev => prev ? { ...prev, status } : prev)
  }

  const columns = [
    { key: 'id', label: 'ID' },
    { key: 'name', label: 'Name' },
    { key: 'phone', label: 'Phone' },
    { key: 'subject', label: 'Subject', render: v => <span className="font-medium text-gray-800">{v || '—'}</span> },
    { key: 'date', label: 'Date' },
    { key: 'status', label: 'Status', render: v => <StatusBadge status={v} /> },
    {
      key: 'id', label: '', render: (_, row) => (
        <div className="flex items-center gap-2">
          <button onClick={() => setViewingInquiry(row)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-blue-600 transition-colors" title="View">
            <Eye size={16} />
          </button>
          <button onClick={() => setIsDeleting(row.id)} className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 hover:text-red-600 transition-colors" title="Delete">
            <Trash2 size={16} />
          </button>
        </div>
      )
    }
  ]
  return (
    <>
      <Table title="Inquiries" data={inquiries} columns={columns} searchKey="name" />
      <Modal isOpen={!!viewingInquiry} onClose={() => setViewingInquiry(null)} title="Inquiry Details">
        <InquiryDetailModal
          inquiry={viewingInquiry}
          onStatusChange={handleStatusChange}
          onDelete={() => {
            setIsDeleting(viewingInquiry.id)
            setViewingInquiry(null)
          }}
        />
      </Modal>
      <DeleteModal 
        isOpen={!!isDeleting} 
        onClose={() => setIsDeleting(null)} 
        onConfirm={handleDelete}
        title="Delete Inquiry"
      />
    </>
  )
}
```
(`Eye`, `Modal`, `DeleteModal`, `Table`, `StatusBadge`, `useData` are all already imported at the top of this file — no new imports needed besides `InquiryDetailModal`.)

- [ ] **Step 3: Enable the nav entries**

In `src/components/layout/Sidebar.jsx`, replace:
```js
// { key: 'inquiries', label: 'Inquiries', icon: MessageSquare, path: '/config/inquiries' },
```
with:
```js
{ key: 'inquiries', label: 'Inquiries', icon: MessageSquare, path: '/config/inquiries' },
```

In `src/components/layout/Topbar.jsx`, replace:
```js
// { label: "Inquiries", path: "/config/inquiries", icon: MessageSquare },
```
with:
```js
{ label: "Inquiries", path: "/config/inquiries", icon: MessageSquare },
```

- [ ] **Step 4: Manual verification**

Run: `cd Admin-Panel && npm run dev`, log in, click "Inquiries" in the sidebar. Expected: table loads (empty, or showing any test inquiries submitted in Task 7's verification). Click the eye icon on a row: modal opens showing full name/email/phone/subject/message and a status pill. Click the status pill: it cycles New → In Progress → Resolved → New, and persists after closing/reopening the modal (refresh the page to confirm it's saved server-side, not just local state). Click "Delete Inquiry": confirmation modal appears; confirming removes the row.

- [ ] **Step 5: Commit**

```bash
cd Admin-Panel
git add src/components/Configurations/InquiryDetailModal.jsx src/components/Configurations/ConfigurationTables.jsx src/components/layout/Sidebar.jsx src/components/layout/Topbar.jsx
git commit -m "$(cat <<'EOF'
feat: enable the Inquiries admin page

Wires the previously-stubbed Inquiries nav entry, table, and a new
detail modal (view + status update + delete) to live API data.

Co-Authored-By: Claude Sonnet 5 <noreply@anthropic.com>
EOF
)"
```
