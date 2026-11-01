# Dasun Praweena portfolio frontend

Public React + Vite portfolio based on the supplied `Dasun_Praweena_Portfolio.html`. It preserves the original CSS, SVG illustrations, content, responsive breakpoints, and notebook-style project overlays. Project notebooks also have direct `/projects/:id` URLs. This application is local frontend work; the backend and separate admin folders are untouched.

## Run locally

Use Node.js 22.12+ or a compatible newer release. In Windows PowerShell, use `npm.cmd` if execution policy blocks `npm.ps1`.

```powershell
cd "D:\my portfolio\portfolio\frontend"
npm.cmd install
npm.cmd run dev
```

Open the Local URL printed by Vite, usually `http://localhost:5173`.

```powershell
npm.cmd run build
npm.cmd run preview
```

Preview serves the production output, usually at `http://localhost:4173`.

## Content and files

- `src/data/projects.json`: shared card and notebook content. Project concepts and unverified details remain labeled. Only `C#`, `MySQL`, and `SPSS` are presented as verified implementation technologies where supplied; concept tags do not imply an implementation stack.
- `src/data/skills.json`, `learningTopics.json`: categorized skills and learning goals.
- `src/data/copy.json`: original section copy, including education, university activities, and the journey. The arrays follow the text order in the corresponding section component.
- `src/data/notebook.js`: shared notebook disclosures and project-section copy.
- `src/data/profile.js`: email, exact social profile URLs, and the CV configuration. Missing links are `null`; buttons explain their availability.
- `src/styles/reference.css`: reference styling. `index.css` integrates Tailwind's official Vite plugin without preflight so browser defaults in the original illustrations are preserved, plus routing and accessibility adjustments.

Place real screenshots in `public/images/` and add `"screenshots": ["/images/project-name.webp"]` to a project. The first image replaces the illustrative cover and is explicitly labeled as a project screenshot. The default covers remain labeled illustrative UI concepts. Add exact `repositoryUrl` and `demoUrl` values only when available. Optional `status`, `technologies`, `contribution`, and `lessons` fields replace the honest notebook placeholders.

Place a real CV in `public/files/`, then change `profile.cv.url` to `/files/Dasun_Praweena_CV.pdf` and update `fileName`. Its dialog will then preview and download that file. No CV or certificate has been fabricated. Add exact GitHub/LinkedIn URLs to `profile.socials` when supplied.

Content is separated from JSX. To connect Express later, fetch projects once in a shared provider or route loader and expose that same collection to `Projects` and `ProjectDetails`, replacing their JSON imports while keeping the data shape. Fetch skills, learning topics, and profile configuration the same way. Do not put API secrets in frontend source or Vite environment variables.

The contact form validates fields and prepares an encoded `mailto:` draft for the supplied email address. It opens the visitor's email application; it does not send, store, or submit a message to a backend.

Dark is the first-visit default. The saved theme is applied in the document head before React loads. Theme switching still works if browser storage is disabled. Keyboard focus, Escape and focus trapping in dialogs, mobile navigation, section offsets, and reduced-motion preferences are supported.

## Checks

```powershell
npm.cmd test
npm.cmd run build
npm.cmd run test:e2e
```

Browser tests use a locally installed Google Chrome via Playwright's `chrome` channel and launch the production preview server. Install Chrome if unavailable, or change the channel in `playwright.config.js` and install the chosen browser. Screenshots and traces are written to ignored `test-results/`.

## Verification performed

- Production build passed with Vite.
- All 8 Node tests passed for required fields, email validation, trimming, Unicode, newlines, and safe URL encoding.
- All 11 Chrome browser checks passed, covering public sections, filters, all six direct project routes, notebook overlays and nested dialogs, focus restoration, unknown routes, theme persistence, CV/social unavailable states, contact-form validation, mobile navigation, and responsive layouts.
- Compared 13 section/artwork bounding boxes, computed typography, text colors, and backgrounds against the supplied public HTML at 1440px, 820px, and 390px. All matched exactly after excluding the reference's admin navigation entries. This is a geometry/style comparison rather than an assertion that every screen pixel is identical.

Verification limitations: browser automation confirms that the contact form requests an email draft; opening and sending through a visitor's external email application depends on their device. Real PDF downloads, profile URLs, repository URLs, live demos, certificates, and screenshots cannot be verified until the actual files and links are supplied.
## Future hosting

Build output is in `dist/`. A static host must rewrite unknown paths to `index.html` with a successful response so direct visits and reloads at `/projects/marketplace` work. Serve existing files normally. For a subdirectory deployment, configure Vite's `base` and the router's `basename` together. No deployment has been configured or performed.
