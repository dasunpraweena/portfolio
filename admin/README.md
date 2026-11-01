# Portfolio Studio

React, Vite, JavaScript and Tailwind CSS (`@tailwindcss/vite`) admin dashboard, based on the reference HTML's admin preview. Dark mode is the default; the theme switch remembers your choice. All portfolio data and files go through the existing Express API. Supabase is used only for browser authentication.

## Start locally

Use Node **22.18+ within v22**, or **24.11+** (the same versions supported by the backend).

```powershell
cd "D:\my portfolio\portfolio\admin"
npm.cmd install
Copy-Item .env.example .env.local
```

If `.env.local` already exists, edit it instead of overwriting it. A local configuration containing only the existing project's public URL and publishable key has been prepared in this workspace.

Enter these three values in **admin/.env.local**:

```dotenv
VITE_API_BASE_URL=http://localhost:5432
VITE_SUPABASE_URL=your_project_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_publishable_key
```

Copy **Project URL** and the **publishable** (`sb_publishable_…`) key from your Supabase project. Use the same project as the Express backend. These are public browser configuration. Never enter a database URL/password, Supabase secret key, service-role key or user access token here. The app does not need them. Restart Vite after changing environment variables.

Start the admin app:

```powershell
cd "D:\my portfolio\portfolio\admin"
npm.cmd run dev
```

Open **http://localhost:5174**. Vite uses `strictPort: true`; it fails if port 5174 is occupied instead of moving to another origin.

The existing backend must be running at **http://localhost:5432**. To start it in a separate terminal using its existing configuration:

```powershell
cd "D:\my portfolio\portfolio\backend"
npm.cmd run dev
```

No migration, seed, publication, account creation or storage change is needed to start this admin app. Backend and public frontend files have not been changed. The “View portfolio” link opens the public frontend at `http://localhost:5173`.

## Sign in and access

Use an existing Supabase Auth email/password account. Enter the password only on the login screen. The account's verified user UUID must already be in the backend's `ADMIN_USER_IDS` allowlist. If needed, the project owner can create an Auth user in the Supabase dashboard and configure that allowlist on the server. This app offers no signup or admin-permission editor.

Sessions are restored and refreshed by the Supabase Auth SDK. Each Express call retrieves the current access token and sends `Authorization: Bearer TOKEN`. Before any management content is loaded, `GET /api/admin/me` must authorize the same user. A valid non-admin account sees Access denied. A terminal 401 removes management content and asks for login again. A rejected 401 request can refresh and retry once; other failed writes are never retried automatically. Logout removes the local browser session and stops automatic refresh.

## CORS

The exact admin browser origin is **http://localhost:5174**. The backend reads `ADMIN_ORIGINS` and `FRONTEND_ORIGINS`; it should allow:

```dotenv
ADMIN_ORIGINS=http://localhost:5174
```

If the backend already has other admin origins, append this one to its comma-separated list. Preserve existing public frontend origins. Restart the backend after changing its environment. Use `localhost`, since `http://127.0.0.1:5174` is a different origin. The read-only live checks in this workspace confirmed that `http://localhost:5174` is already allowed, including for unauthenticated admin requests.

## Managing content

- Overview reads real collection totals. Empty collections remain empty.
- Profile includes all profile/about text and the profile-photo attachment.
- Projects include details, separate display tags and implementation technologies, URLs, ordered screenshot captions and illustrative flags. New projects always save as **DRAFT**. Existing publication state is omitted from ordinary edits. Separate confirmed Publish/Unpublish actions control public availability. Feature and ordering actions persist through the API.
- Technologies, skill categories, skills, education, experience, learning topics, milestones, verified certificates and social links use the documented resource endpoints. Use **Manage categories** on Skills to manage categories. Technologies sort by name; other ordered resources have earlier/later controls.
- The inbox paginates and filters on the server. Opening a message does not change its read state. Mark read/unread and confirmed deletion use the documented endpoints. Search applies to the current inbox page; resource search loads all collection pages first.
- Uploads use multipart `file` with the protected image/PDF upload endpoints. Originals remain private. Select/upload, then save the referencing record. The server handles publication copies when the record is published. Authenticated previews fetch file bytes through Express, never directly from Supabase Storage. Images accept JPEG/PNG/WebP up to 8 MB; PDFs up to 10 MB. The server also checks actual content, image dimensions and PDF safety.
- CV publishing requires a real uploaded PDF and explicit confirmation. Clearing an attachment does not delete its file. The Asset library can preview files, delete unreferenced originals with confirmation, or explicitly reconcile publication copies after a storage failure. The server refuses deletion of referenced files, including draft references.
- Website settings persist title, SEO description, availability visibility, default theme, private notes, section order and indexed section text. CV settings are managed on the CV page. Empty section-text entries preserve later text positions.

Successful form writes are followed by a GET of the saved record. If that GET fails, **Reload saved record** retries only the read, avoiding a duplicate create. Server validation and upload failures remain visible. Delete/publication actions require confirmation. Form reset and closing a changed record dialog confirm discarding edits.

## Existing API and frontend limits

The reference prototype includes controls for global site publication, skill proficiency, learning-resource URLs and CV version history. The backend has no fields/endpoints for those capabilities, so this app does not simulate them. Technologies have no custom ordering endpoint.

The current public frontend does not consume `settings.sectionOrder` or `settings.defaultTheme`: it keeps its existing section order and dark default. The admin can save these supported settings, but cannot make the separate public app apply them within this task's admin-only scope. The public frontend reads the existing `hero`, `about`, `skills`, `learning`, `journey`, `contact` and `footer` section-text groups by position.

The backend accepts up to 100 items per ordering request. Larger collections use consecutive batches; a failure between batches can leave partial ordering. Refresh the list before trying again. Lists are fetched fresh; this is not a simultaneous multi-editor conflict-resolution system.

## Verification

```powershell
cd "D:\my portfolio\portfolio\admin"
npm.cmd test
npm.cmd run test:e2e
npm.cmd run build
```

Browser checks use installed Google Chrome (`channel: chrome`), intercepted Supabase Auth and Express responses, and synthetic credentials. Stop your admin dev server before the browser suite because the suite owns strict port 5174. It starts and closes Vite itself. It does not submit requests that mutate your live API. Unit checks cover API envelopes, pagination, refreshed authorization, uploads, failed writes, and content validation. Browser checks cover the authorization gate, restoration, denied access, login/logout, token expiry/refresh, CRUD, publication confirmation, uploads, CV/settings, inbox, themes and mobile keyboard focus. Review screenshots are written to ignored `test-results/`.

Actual login with your own password, allowlist acceptance, real database writes, storage validation/publication and real browser PDF rendering still require your local credentials/files. They were not exercised against live content.

To check the production bundle locally:

```powershell
npm.cmd run build
npm.cmd run preview
```

Preview also uses `http://localhost:5174` with a strict port. No deploy, commit or push is part of this app's setup.
