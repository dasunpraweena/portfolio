# Dasun Praweena portfolio frontend

The existing React/Vite portfolio now loads public content from the Express API at `http://localhost:5432`. The original styling, illustrations, responsive layouts, project overlays, navigation, and dark-theme preference are preserved. An empty project list is expected while every project remains a draft.

## Run both applications

The backend is already running on port 5432. Keep that terminal running. To start it again after stopping it, open a separate PowerShell terminal:

```powershell
cd "D:\my portfolio\portfolio\backend"
npm.cmd run dev
```

Its existing local configuration must use `PORT=5432`. This integration has not changed the backend configuration, source files, admin application, or database records. Backend credentials and setup remain in `backend/`.

Start the frontend in another terminal:

```powershell
cd "D:\my portfolio\portfolio\frontend"
npm.cmd install
npm.cmd run dev
```

Open **http://localhost:5173**. Vite uses that exact host and port and stops if the port is occupied instead of silently changing the browser origin.

`frontend/.env.local` is already configured and ignored by Git:

```dotenv
VITE_API_BASE_URL=http://localhost:5432
```

For a new checkout, copy `.env.example` to `.env.local` if it does not already exist. Restart Vite after changing environment files. The value is the backend **origin**, without an `/api` suffix. Only this public API address belongs in the frontend. Never put a database connection string or Supabase secret key in a `VITE_` variable; those values would be bundled into the browser application.

## API integration

- `src/api/client.js` provides JSON envelope handling, HTTP errors, timeouts/cancellation, pagination, file loading, and URL resolution. Requests omit credentials and contain no Supabase keys or admin tokens.
- `src/api/adapters.js` maps backend fields to existing components. API-relative image, screenshot, certificate, and CV URLs resolve against the backend origin. It preserves screenshot captions, illustration labels, skill names, learning statuses, milestone data, and missing fields.
- `PortfolioProvider` loads `GET /api/portfolio`. Section text comes from `settings.sectionCopy`, while profile, skills, learning topics, milestones, certificates, social links, and CV references come from their structured API fields. Education and experience details are accessible through the existing journey milestone icons.
- Projects load independently from `GET /api/projects?category=...&page=...&limit=100`. The client follows every reported page before offering “View all”; category filters request the corresponding API category.
- Both direct `/projects/:slug` visits and notebook overlays fetch `GET /api/projects/:slug`. A 404 is an honest missing/unpublished state, while connection/server errors offer Retry.
- `useApiResource` cancels stale requests and provides loading/error/retry states. Request failures never display local portfolio records as a substitute. Successful empty collections have explicit empty states.

Portfolio content should be edited through the backend's content management API/future admin application. Existing local portfolio JSON files are retained for reference and test fixtures; the application does not import them as a source of live profile, project, skill, or learning records. `illustrations.json`, navigation definitions, and notebook UI labels are presentation assets, not an API fallback.

Full backend payloads and routes are documented in [the API reference](../backend/docs/API.md). No projects have been published as part of this connection work.

## Contact messages and files

The contact form now sends exactly `{name, email, subject, message}` to `POST /api/messages`. Required values, email format, and length limits are checked. The form shows a pending state and prevents duplicate submissions; only `{data:{accepted:true}}` produces a saved-message confirmation. Network/server errors, validation failures, missing confirmation, and rate limits preserve the entered message and offer a retry. It does not open an email draft or claim that email was sent. The separate email link still opens the visitor's email application.

API-provided screenshot objects retain their caption and illustrative/actual status; extra screenshots appear in the notebook. A published CV opens the existing dialog, loads the PDF as a blob for preview, and keeps an absolute API download link. Blob URLs are revoked when the preview closes. Missing files/URLs remain unavailable states.

## Production build and preview

```powershell
npm.cmd run build
```

The build output is in `dist/`. To test that output at the already allowed origin, stop the frontend development server first, then run:

```powershell
npm.cmd run preview -- --host localhost --port 5173 --strictPort
```

Open http://localhost:5173. Build-time changes to `VITE_API_BASE_URL` require another build. A future static host must serve `index.html` for direct `/projects/:slug` visits while serving existing asset files normally. Nothing has been deployed.

## CORS

The live backend currently allows **`http://localhost:5173`**, verified with an actual browser and GET requests. Use that exact URL; `localhost` and `127.0.0.1` are distinct origins.

The test preview origin **`http://127.0.0.1:4173`** returned HTTP 403 `ORIGIN_NOT_ALLOWED` during inspection. If you choose to use that address against the live API, add exactly `http://127.0.0.1:4173` to the backend's `FRONTEND_ORIGINS` and restart the backend. Similarly, a preview at `http://localhost:4173` needs that exact origin added. This task has left `backend/` unchanged. Using the preview command above avoids needing an origin change.

## Verification

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

- 19 unit checks cover response unwrapping, adapters, empty data, pagination, relative URLs, HTTP/network/timeout errors, required contact fields, and save confirmation.
- 21 Chrome browser checks cover the preserved layouts/interactions, dark mode and persistence, real API data mapping through mocks, loading/error/retry/empty states, project routes and pagination, contact pending/failure/rate-limit/success behavior, and file URLs.
- A populated API fixture reproduced the previous section geometry at 1440px, 820px, and 390px. The live empty-project state intentionally contains no old draft cards.
- A separate browser check at `http://localhost:5173` read the actual backend portfolio and empty project collection, verified the theme across reloads, and confirmed that an unpublished project returns the friendly 404.

Automated browser tests intercept the API, including **all contact POST requests**, and do not publish projects or write messages to the hosted database. The live check allowed only GET/OPTIONS requests. Actual message persistence was not tested against your database; success/failure handling was verified with documented mocked responses.

Browser tests use locally installed Chrome through Playwright and a temporary preview at `127.0.0.1:4173`. Because the API is mocked in those tests, the preview origin does not need live CORS access. Screenshots and traces are in ignored `test-results/`.
