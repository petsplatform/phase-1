# Contact Inquiries + Blog Removal — Design

Date: 2026-07-10
Repos touched: `Admin-pannel-backend`, `Best-Vet-Care`, `Admin-Panel`

## Summary

Two changes:

1. Remove the Blog feature entirely (Admin-Panel UI, backend routes/controller/service, and the `Blog` Prisma model/migration).
2. Wire the storefront Contact page form to a new backend `Inquiry` resource, so submissions appear in a real, functional Inquiries page in Admin-Panel (currently stubbed with dummy data and hidden from the nav).

## 1. Blog removal (full)

**Backend (`Admin-pannel-backend`)**
- `prisma/schema.prisma`: delete `model Blog` and `enum BlogStatus`; generate a migration dropping the `Blog` table.
- `src/controllers/contentController.js`: remove `blogController` and its export.
- `src/services/contentService.js`: remove `blogService` and its export.
- `src/routes/contentRoutes.js`: remove the five `/blogs` route lines.
- `src/validations/adminSchemas.js`: remove `blogSchema` and its export.

**Admin-Panel**
- Delete `src/pages/Configurations/Blogs.jsx`.
- `src/routes/AppRoutes.jsx`: remove the `Blogs` import and its `/config/blogs` route.
- `src/components/layout/Sidebar.jsx`: remove the "Blogs" nav item.
- `src/components/layout/Topbar.jsx`: remove the mirrored blog entry.
- `src/lib/api.js` / `src/api/contentApi.js`: remove `blogs`/`createBlog`/`updateBlog`/`deleteBlog`.
- `src/context/DataContext.jsx`: remove `blogs` state, `addBlog`/`updateBlog`/`deleteBlog`, and drop `adminApi.blogs()` from the `loadBackendData` `Promise.all`.
- `src/components/Configurations/ConfigurationTables.jsx`: remove `BlogTable`.
- Leave `dummyData.js` / `ConfigForms.jsx` / `DemoForm.jsx` blog references alone if they belong to unrelated generic demo scaffolding rather than the real Blogs feature — confirm at implementation time before touching.

Out of scope: no other repo references blogs.

## 2. Inquiry feature

### Data model (`Admin-pannel-backend/prisma/schema.prisma`, new)

```prisma
enum InquiryStatus {
  New
  InProgress
  Resolved
}

model Inquiry {
  id        String        @id @default(cuid())
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

### Backend API

New `src/routes/inquiryRoutes.js`, mounted at `/api/inquiries` in `app.js`:

| Method | Path            | Auth        | Purpose                                   |
|--------|-----------------|-------------|--------------------------------------------|
| POST   | `/`             | Public      | Create inquiry from storefront Contact form |
| GET    | `/`             | `requireAuth` | List all inquiries, newest first          |
| PATCH  | `/:id/status`   | `requireAuth` | Update status (New/InProgress/Resolved)   |
| DELETE | `/:id`          | `requireAuth` | Delete an inquiry                         |

Follows the `contentRoutes.js` pattern: public route declared before `router.use(requireAuth)` gates the rest of the router.

New `src/validations/adminSchemas.js` addition: `inquirySchema` (fullName, email, subject, message required; phone optional) for the create body, and an `inquiryStatusSchema` for the PATCH body (`status` enum).

New `src/controllers/inquiryController.js` + `src/services/inquiryService.js`, following the existing `asyncHandler` + service-layer convention used by other controllers (not the generic `makeCrudController`, since this needs a public create and a custom status-patch, unlike the symmetric admin-only CRUD banners use).

### Storefront (`Best-Vet-Care`)

- New `src/api/inquiryApi.js` (mirrors `couponApi.js`): `inquiryApi.submit({ fullName, email, phone, subject, message })` → `POST /inquiries`.
- `src/pages/Contact.jsx`: `handleSubmit` becomes `async`. Existing client-side `validate()` runs first (unchanged). On success: call `inquiryApi.submit(form)`, then reset form + `showToast("Thanks! Your message has been sent.")` (unchanged UX copy). On failure: show an error toast, keep the form filled in (no reset) so the user doesn't lose their draft.

### Admin-Panel

- Un-comment the "Inquiries" sidebar nav entry in `Sidebar.jsx` (route/page already exist).
- `src/lib/api.js`: add
  - `inquiries: () => apiRequest("/inquiries")`
  - `updateInquiryStatus: (id, status) => apiRequest(\`/inquiries/${id}/status\`, { method: "PATCH", body: { status } })`
  - `deleteInquiry: (id) => apiRequest(\`/inquiries/${id}\`, { method: "DELETE" })`
- `src/context/DataContext.jsx`:
  - Add `adminApi.inquiries()` to the `loadBackendData` `Promise.all`; normalize via a small mapper (date formatting, matching `normalizeContent`'s style).
  - Replace the current local-only `deleteInquiry` with one that calls `adminApi.deleteInquiry(id)` then updates state (mirrors `deleteOrder`).
  - Add `updateInquiryStatus(id, status)` (mirrors `updateOrder`'s status-only path).
  - Remove the `inquiries as initialInquiries` import from `dummyData.js`; state starts as `[]` and is populated by `loadBackendData`.
- `InquiryTable` (`ConfigurationTables.jsx`): row click opens a new `InquiryDetailModal` component showing full name, email, phone, subject, full message, a status `<select>` (reusing `StatusSelect`), and a delete action — reusing the existing `Modal`/`DeleteModal` components already used by `CustomerList.jsx`.

## Testing

- Backend: Jest tests for `inquiryService` (create/list/update-status/delete) and `inquiryController`/route-level validation (public POST succeeds without a token; GET/PATCH/DELETE reject without a token), following the existing `tests/services/*.test.js` pattern.
- Manual verification: submit the storefront Contact form as a guest, confirm the inquiry appears in Admin-Panel's Inquiries page, change its status, delete it.

## Non-goals

- No rate-limiting/spam protection on the public POST endpoint (noted as a known gap, not addressed here).
- No email notification to admins on new inquiry (out of scope).
