# API reference

Base URL during development: `http://localhost:3001`. All JSON writes use `Content-Type: application/json`. Success responses contain `data`; lists also contain `meta` with `page`, `limit`, and `total`. Errors contain `error.code`, `error.message`, and `error.requestId`. Deletes return 204.

## Public routes

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Process liveness. |
| GET | `/api/portfolio` | Public profile, safe site settings/CV reference, published projects, skills, learning, milestones, education, experience, verified published certificates, and social links. |
| GET | `/api/projects` | Published projects; query `category=all\|web\|software\|data`, `featured=true\|false`, `page=1`, `limit=20` (maximum 100). |
| GET | `/api/projects/:slug` | Published case study; drafts and missing records both return 404. |
| GET | `/api/assets/:id` | Verified file bytes only if currently referenced by published content. |
| POST | `/api/messages` | Store a validated contact message; five attempts/IP/15 minutes. Returns only `{data:{accepted:true}}`. |

Message body: `{ "name": "Visitor", "email": "visitor@example.com", "subject": "An idea", "message": "Hello Dasun" }`. Whitespace-only fields, malformed email, unknown fields, oversized bodies, and unsupported content types are rejected.

## Protected admin routes

Every `/api/admin` route verifies `Authorization: Bearer <Supabase access token>` and requires its verified user UUID to appear in `ADMIN_USER_IDS`. Missing, invalid, expired tokens return 401. Valid non-admin accounts return 403. Tokens are not accepted through query strings or request bodies.

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/admin/me` | Verified authorized UUID. |
| GET / PUT / PATCH / DELETE | `/api/admin/profile` | Read, replace/upsert, partially update, or remove the singleton profile. |
| GET / PUT / PATCH / DELETE | `/api/admin/settings` | Manage the singleton settings and CV. |
| GET / POST | `/api/admin/:resource` | Paginated list or create. |
| GET / PATCH / DELETE | `/api/admin/:resource/:id` | Read, update, or delete a record by its database UUID. |
| PATCH | `/api/admin/:resource/order` | `{ "items": [{ "id": "UUID", "sortOrder": 0 }] }`; atomic partial ordering, except technologies which sort by name. |
| PATCH | `/api/admin/projects/:id/publication` | `{ "status": "PUBLISHED" }` or `{ "status": "DRAFT" }`. |
| GET | `/api/admin/messages` | Paginated inbox; optional `read=true\|false`. |
| PATCH | `/api/admin/messages/:id` | `{ "read": true }` or `{ "read": false }`. |
| DELETE | `/api/admin/messages/:id` | Delete one message. |
| POST | `/api/admin/uploads/image` | One multipart `file`: JPEG/PNG/WebP. |
| POST | `/api/admin/uploads/pdf` | One multipart `file`: valid, passive PDF. |
| GET | `/api/admin/assets` | Paginated file metadata. |
| GET | `/api/admin/assets/:id/file` | Authorized private file download/preview bytes. |
| DELETE | `/api/admin/assets/:id` | Delete only after detaching all references, including draft references. |
| POST | `/api/admin/assets/reconcile` | Repair copies for current publication states after a failed operation. |

Resources: `projects`, `technologies`, `skill-categories`, `skills`, `learning-topics`, `milestones`, `education`, `experience`, `certificates`, `social-links`. Unknown fields are rejected. Exact create/update schemas are in `src/validation.js`; the seed snapshot provides real content examples without fabricated links/files.

Most resources accept `status: DRAFT|PUBLISHED` and nonnegative `sortOrder`. Creation defaults to DRAFT. Publication status is separate from a project's `verified`, `workKind`, and `implementationStatus`. A certificate needs `verified: true` before publication. Publishing a CV requires an uploaded PDF.

## Project payload

```json
{
  "slug": "marketplace",
  "name": "Student Marketplace",
  "type": "Web & Mobile",
  "category": "WEB",
  "short": "A university-focused space for products, bike rentals, lost and found, and student services.",
  "tags": ["University marketplace", "Mobile concept"],
  "visual": "market",
  "workKind": "CONCEPT",
  "verified": false,
  "problem": "Students need a convenient way to discover products, rentals, lost items, and useful services within their university community.",
  "solution": "A university marketplace that brings these needs into a shared digital space.",
  "features": ["Student product listings", "Bike rentals", "Lost and found", "Student services"],
  "status": "DRAFT",
  "featured": true,
  "sortOrder": 0,
  "technologyIds": [],
  "screenshots": []
}
```

Optional fields: `contribution`, `lessons`, `implementationStatus`, `repositoryUrl`, and `demoUrl` (all nullable). Use actual technology UUIDs in `technologyIds`. Screenshot entries take `{assetId, caption?, illustrative?, sortOrder?}`. Replacing either array replaces those relationships; omit an array on PATCH to preserve it. Only image assets are accepted as project screenshots or profile photos. CVs require PDF assets. File/bucket paths, uploader identity, timestamps, and internal IDs cannot be set through content payloads.

## CV and missing content

Upload a real PDF, then PATCH `/api/admin/settings` with `{ "cvAssetId": "UPLOADED_UUID", "cvPublished": true }`. Set `cvPublished` false to remove public delivery. To detach a published CV, set both `cvAssetId: null` and `cvPublished: false`. The public response contains `cv: null` until a real published file is attached.

Unknown dates and links should stay null. Empty collections and nullable contributions are intentional. Technical stack entries are related Technology records, while concept tags remain presentation tags; publishing an outline does not establish that its features have been implemented.
