# Portfolio backend

This is the Express API for Dasun Praweena's portfolio. All work is inside `backend/`; the existing frontend and future admin application are unchanged. Dependencies are installed, but **no connection to your Supabase project, live migration, live seed, or deployment has been performed**.

Use these instructions in order. Enter credentials directly into your local `.env` or the Supabase dashboard. Do not paste passwords, database URLs, secret keys, or access tokens into chat.

## 1. Install dependencies

Use Node.js **24.11 or newer compatible LTS** (22.18+ is also supported). Open PowerShell:

```powershell
cd "D:\my portfolio\portfolio\backend"
npm.cmd install
npm.cmd run prisma:generate
```

`npm.cmd` avoids PowerShell execution-policy problems with `npm.ps1`. For repeat installations, `npm.cmd ci` installs the exact versions in `package-lock.json`. No Git commit is required or performed by these instructions.

The backend uses stable Prisma **7.10.1**, Express 5, Zod, Supabase JS, and the PostgreSQL driver adapter. Prisma 8's release candidate was deliberately excluded. All application code and Prisma configuration are JavaScript ES modules. The supported `prisma-client-js` generator produces JavaScript; Prisma 7's default generator produces TypeScript. [Prisma's generator documentation](https://www.prisma.io/docs/orm/v7/prisma-schema/overview/generators) describes both.

## 2. Create your local configuration

```powershell
Copy-Item .env.example .env
notepad .env
```

Run the copy only if `.env` does not already exist. `.env` is ignored by Git. Keep it in `backend/` and never copy its database URL or secret key into either React application.

| Variable | Where it comes from / what to enter |
| --- | --- |
| `PORT` | Keep `3001` for local development. |
| `DATABASE_URL` | Supabase dashboard **Connect → Session pooler**, port **5432**. Use the host, user, region, and project ref shown for your project. Replace its password locally and append `?schema=portfolio&sslmode=require&sslaccept=strict` (or append the parameters with `&` if a query already exists). |
| `MIGRATION_DATABASE_URL` | Optional. Leave commented out while runtime and migrations use the same Session pooler. Set it only if a separate migration connection/account is actually needed. It must identify the same project and use port 5432. |
| `SUPABASE_URL` | Your dashboard's project API URL, in the form `https://YOUR_PROJECT_REF.supabase.co`. |
| `SUPABASE_SECRET_KEY` | Project Settings **API Keys → Secret keys**. Use a current `sb_secret_...` key. A legacy `service_role` JWT is supported as an alternative; an `anon` or publishable key is rejected. |
| `ADMIN_USER_IDS` | Your verified Auth user UUID from step 3. Multiple IDs can be separated by commas. |
| `FRONTEND_ORIGINS` | Keep `http://localhost:5173`, or use the exact URL Vite prints. Separate multiple allowed origins with commas; omit trailing slashes. |
| `ADMIN_ORIGINS` | Reserve `http://localhost:5174` for the future admin app. |
| `PUBLIC_BUCKET` / `PRIVATE_BUCKET` | Keep `portfolio-public` / `portfolio-private`, matching step 4. |
| `TRUST_PROXY_HOPS` | Keep `0` for local use. Only change for a known trusted reverse-proxy topology. |
| `DB_TARGET_CONFIRMED` | Leave empty until step 5 shows the database target; then enter its exact project ref. |
| `DB_EXISTING_TABLES_REVIEWED` | Keep `false` unless inspection finds unrelated existing public tables and you have reviewed them. |
| `DATABASE_SSL_CA_FILE` | Optional local path to the trusted database CA certificate downloaded from your dashboard, if your machine needs it. Do not disable TLS certificate verification. |

The database password is your **Supabase database password**, not the admin Auth user's password. Encode special characters in the password component only: `@` → `%40`, `:` → `%3A`, `#` → `%23`, `%` → `%25`, `/` → `%2F`, `?` → `%3F`. For example, the dummy password `sample@pass#1` becomes `sample%40pass%231`. Do not encode the entire URL or encode an already encoded password again.

Session pooling supports the local IPv4 setup. This project intentionally refuses transaction-pooler port 6543. Runtime uses `@prisma/adapter-pg` with verified TLS. Prisma CLI reads `MIGRATION_DATABASE_URL` if supplied, otherwise `DATABASE_URL`, through `prisma.config.js`; it applies Prisma-compatible `sslmode=require` and `sslaccept=strict`. No separate direct connection variable is required for this Session-pooler configuration. [Supabase's Prisma guide](https://supabase.com/docs/guides/database/prisma), [Prisma 7 configuration](https://www.prisma.io/docs/orm/v7/reference/prisma-config-reference).

The backend does **not** need `SUPABASE_PUBLISHABLE_KEY`. The future admin React app will use a publishable `sb_publishable_...` key to sign in. Publishable keys and secret keys have different purposes; the server secret bypasses RLS and stays on the server. [Supabase API keys](https://supabase.com/docs/guides/getting-started/api-keys).

## 3. Create the administrator account

1. In your intended Supabase project, open **Authentication → Users**.
2. Use **Add user / Create new user** to create your own email/password account. Set the password in the dashboard; do not put it in `.env`.
3. Open that user and copy its **User UID / UUID** into `ADMIN_USER_IDS` in your local `.env`.
4. Under Authentication's **Sign In / Providers** (Auth settings), switch **Allow new users to sign up** off. The dashboard-created account can still sign in. Do not enable anonymous sign-ins. See [Auth configuration](https://supabase.com/docs/guides/auth/general-configuration).

There is no custom password database or public signup endpoint in Express. The future admin app signs in through Supabase Auth and sends `Authorization: Bearer ACCESS_TOKEN`. Express verifies that token using `supabase.auth.getUser(token)` and then checks the returned UUID against the server allowlist. A request-body user ID, user metadata, or a client-supplied admin role never authorizes access. [Server-side user verification](https://supabase.com/docs/reference/javascript/auth-getuser).

## 4. Configure storage and Data API access

1. Under **Storage**, create `portfolio-private` and `portfolio-public`.
2. **Keep Public bucket switched OFF for BOTH buckets**, including the one named `portfolio-public`. Configure a 10 MB bucket limit and MIME allowlist `image/jpeg`, `image/png`, `image/webp`, `application/pdf`.
3. Check the project name/ref shown in Supabase's SQL Editor, then run the contents of [`sql/storage-policies.sql`](sql/storage-policies.sql) once. If it says the policy already exists, inspect it rather than deleting other policies. Custom bucket names must be changed in both `.env` and the SQL literals.
4. Under the Data API settings, keep the `portfolio` schema out of **Exposed schemas**. Because this application uses Prisma instead of the Supabase Data API, you may disable the Data API if nothing else in your project needs it. Auth and Storage are still used.

The storage SQL adds a **restrictive** policy for `anon` and `authenticated`. It blocks access to these two buckets even if another permissive policy exists, while allowing unrelated buckets to keep their own policies. It does not change managed table columns or stored data. No broad public write policy is added. Application migrations manage only the separate `portfolio` schema, revoke Data API role access, and enable RLS with no browser policies. Supabase-managed Auth and Storage tables are not Prisma models.

Despite its name, `portfolio-public` is a private delivery bucket containing copies for published content. Visitors retrieve a file through `GET /api/assets/:id`; Express checks that it is still referenced by published content, then downloads it with the server key. No storage paths or signed URLs are returned publicly. Draft originals stay in `portfolio-private`. This avoids a permanent public bucket URL continuing to work after unpublishing. Startup refuses incorrectly public buckets or a missing restrictive policy. [Bucket access models](https://supabase.com/docs/guides/storage/buckets/fundamentals), [Storage RLS](https://supabase.com/docs/guides/storage/security/access-control), [Data API security](https://supabase.com/docs/guides/api/securing-your-api).

## 5. Inspect the database before making changes

```powershell
npm.cmd run db:inspect
```

This checks that the connection belongs to `SUPABASE_URL`, connects read-only, and prints the project ref, host, and existing `public`/`portfolio` table names. It does not print credentials or table contents. Confirm those details match your intended project.

Set `DB_TARGET_CONFIRMED` in `.env` to that exact project ref. If unrelated public tables were listed, review their ownership before setting `DB_EXISTING_TABLES_REVIEWED=true`. They are not modified by these application migrations.

Existing `portfolio` tables without matching migration history, unfamiliar tables, failed migrations, or changed migration checksums stop writes. Preserve that database and arrange a reviewed baseline/repair before proceeding. **Do not use reset, db push, forced resets, or delete existing tables to get past the check.**

## 6. Apply migrations and seed the actual portfolio

```powershell
npm.cmd run db:migrate
npm.cmd run prisma:generate
npm.cmd run db:seed
npm.cmd run storage:check
```

`db:migrate` uses `prisma migrate deploy` to apply reviewed SQL; it does not need a shadow database. Initial SQL was generated offline and includes database constraints and RLS. Future schema changes need a new reviewed migration; never edit an already applied migration.

The idempotent seed inserts the actual profile/about copy, six project briefs, five skill categories with 19 skills, four learning topics, six journey milestones, the university record, three academic/university activities, and missing social-link placeholders. It leaves unknown dates, responsibilities, links, files, employment, and certificates empty. Rerunning it preserves existing records and admin edits.

**All six project briefs start as DRAFT.** This is a safe publication default; their implementation/evidence remains unverified. Consequently `/api/projects` initially returns an empty list. Publish individual outlines through the protected admin API when ready; publication does not change `verified` or invent completed implementation. The separate frontend currently still uses its own local data.

The seed snapshot is in `prisma/seed-data.json`. It was extracted from the actual frontend data and original HTML's education/experience fields. It has no runtime dependency on the frontend folder. Certificates and a CV are deliberately not seeded.

## 7. Start the backend

```powershell
npm.cmd run dev
```

For normal execution without watch mode, use `npm.cmd start`. Startup validates `.env`, connects to the configured database, and checks schema/bucket protections before listening. The normal local URL is `http://localhost:3001`.

If startup fails, check the sequential setup above, database password encoding, CA certificate if needed, migration results, private bucket settings, and restrictive storage policy. Raw SDK/database errors, access tokens, and connection strings are not logged.

## 8. Test the health and public endpoints

In another PowerShell terminal:

```powershell
Invoke-RestMethod http://localhost:3001/api/health
Invoke-RestMethod http://localhost:3001/api/portfolio
Invoke-RestMethod "http://localhost:3001/api/projects?category=web"
```

Health returns `{ "data": { "status": "ok" } }` when the running process responds. A missing, unpublished, or unknown project returns 404. Success responses use `{data}` and paginated collections add `{meta}`; errors use `{error:{code,message,requestId}}` and field-validation errors add `details`.

To test a real contact submission deliberately (this **stores** a message in your configured database):

```powershell
$body = @{ name = "Local test"; email = "test@example.com"; subject = "Backend check"; message = "Testing my contact API." } | ConvertTo-Json
Invoke-RestMethod -Method Post -Uri http://localhost:3001/api/messages -ContentType application/json -Body $body
```

The contact API records the message; it does not send email. It permits five submission attempts per IP per 15 minutes, including invalid attempts. General API requests allow 240/minute; admin requests allow 120/minute. The current limiter is for one Node process; use a shared rate-limit store before running multiple workers/instances. Keep `TRUST_PROXY_HOPS=0` unless the network layout justifies a different value.

## 9. Connect the frontend and admin app later

The frontend has intentionally not been changed. When you choose to connect it, set its public API base URL to `http://localhost:3001`, fetch `/api/portfolio` and `/api/projects`, and replace its local data provider. Project responses preserve `id` as the slug plus `name`, `type`, `filter`, `short`, `tech`, and `visual`; they also provide detailed case-study fields. Screenshot entries are metadata objects with API-relative URLs. Resolve asset URLs against the backend origin.

Change the contact form to POST JSON to `/api/messages` only when you want saved messages instead of the current email-draft behavior. The backend does not silently change that frontend behavior.

The future admin React app uses Supabase's publishable key for sign-in, then sends the returned access token in the Authorization header for every `/api/admin` request. It does not use the server secret or database URL. Add its exact origin to `ADMIN_ORIGINS`. [API routes and payloads](docs/API.md) are documented separately.

Uploads are multipart forms with one field named `file`. Uploads create private asset records; attach the returned UUID to content and publish that content to make it publicly retrievable. Images must be JPEG, PNG, or WebP up to 8 MB and 25 megapixels, and are decoded/re-encoded. PDFs may be up to 10 MB/500 pages; damaged, encrypted, or active documents are rejected. SVG and executable files are rejected.

Publishing, unpublishing, replacing, and deleting asset references use a shared PostgreSQL advisory lock. Storage operations and SQL cannot form one atomic transaction: the database rolls back on a storage failure, private source copies are retained, and delivery always checks current publication state. If a crash leaves missing/stale copies, run protected `POST /api/admin/assets/reconcile` after fixing storage; it rebuilds published copies and removes unpublished copies. An asset cannot be deleted while any content, including a draft, references it.

## 10. Checks and current verification limits

```powershell
npm.cmd run check
npm.cmd run prisma:validate
npm.cmd run prisma:generate
npm.cmd test
```

These checks can run without Supabase credentials. Tests use isolated HTTP/service doubles and a disposable embedded PostgreSQL (PGlite) instance; they never use your hosted database. Coverage includes draft/public visibility, authorization failures, publication and file visibility, shared references, input and upload validation, contact limits, actual migration constraints/RLS, the restrictive storage policy, and seed idempotency.

Completed locally: JavaScript syntax checks, Prisma schema validation, Prisma Client generation, and **all 25 tests passed**. Startup and database inspection also stopped safely when required credentials were absent.

**Still requires your credentials:** actual Supabase connection/TLS, hosted migration/seed, real Auth token verification, hosted bucket permissions, and live upload/download operations. No local check is presented as proof those hosted integrations have already succeeded.
