### AffordMed URL Shortener — Backend (Bun + Express + Prisma)

Minimal instructions to install, configure, run, and test the microservice.

---

#### Prerequisites
- Bun installed (`https://bun.sh`)
- PostgreSQL 14+ and a database URL

#### Environment
Create a `.env` file in `backend/`:

```
PORT=5000
FRONTEND_URL=http://localhost:3000
# Optional: used to build absolute short links in API responses
BACKEND_URL=http://localhost:5000
DATABASE_URL=postgresql://USER:PASSWORD@HOST:5432/DBNAME?schema=public
NODE_ENV=development
```

#### Install
```
bun install
```

#### Database (Prisma)
```
# Generate client
bun run db:generate

# Push schema (creates tables)
bun run db:push

# Optional: interactive studio
bun run db:studio
```

#### Run
```
# Dev (watch)
bun run dev

# Prod
bun run build
bun run start
```

Server starts on `http://localhost:5000` (or `PORT`).

#### Health
```
GET /health -> { status, timestamp, service, database }
```

#### Core Endpoints
- `POST /shorturls` — Create short URL
  - Body: `{ url: string, validity?: number (minutes, default 30), shortcode?: string }`
  - 201 Response: `{ shortLink: string, expiry: ISO8601 }`

- `GET /shorturls/:shortcode` — Stats for a shortcode
  - 200 Response: `{ shortcode, originalUrl, shortLink, createdAt, expiresAt, totalClicks, clicks: [...] }`

- `GET /shorturls` — List all active short URLs

- `GET /:shortcode` — Redirect (records click)

#### Notes
- Logging uses custom middleware in `src/middleware/logger.ts` (no console logging in app code).
- Default validity is 30 minutes if not supplied.
- Shortcodes must be 3–20 alphanumeric characters; uniqueness is enforced in DB.


