### AffordMed URL Shortener — Frontend (React + Vite + MUI)

Minimal instructions to install, configure, and run the React UI that consumes the backend APIs.

---

#### Prerequisites
- Node 20+ or Bun

#### Environment
Create `.env` in `frontend/` or use Vite env files (`.env.local`):

```
VITE_API_BASE_URL=http://localhost:5000

```

#### Install
```
bun install
# or: npm install / bun install
```

#### Run
```
bun dev
# opens http://localhost:3000
```

#### Build & Preview
```
bun build
bun preview
```

#### What’s inside
- Material UI components for forms and tables
- Client-side validation for URL, validity (minutes), and optional shortcode
- Calls to backend endpoints via `src/services/api.ts`

Ensure the backend is running at the same time and CORS allows `http://localhost:3000`.
