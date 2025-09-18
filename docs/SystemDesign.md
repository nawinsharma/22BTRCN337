### System Design Document — URL Shortener (Microservice + React UI)

This document summarizes architecture, key design choices, data modeling, and assumptions.

---

#### Architecture Overview
- Single backend microservice built with Bun + Express.
- PostgreSQL via Prisma ORM for persistence.
- React (Vite) frontend consumes backend APIs only; no business logic in UI.
- Logging middleware used across all routes for request, response, and error logs.
- Redirects pass through the service to record click analytics, then 302 to the target.

High-level flow:
1. Frontend calls `POST /shorturls` to create a short link.
2. Backend validates inputs, ensures shortcode uniqueness, computes expiry, persists.
3. Users hit `GET /:shortcode`; backend records click metadata and redirects.
4. Frontend retrieves analytics via `GET /shorturls/:shortcode` or lists active links via `GET /shorturls`.

#### Technology Choices & Rationale
- Bun + Express: rapid startup, familiar Express API, Bun runtime performance.
- Prisma + PostgreSQL: type-safe schema, migrations, unique constraints for shortcode, relational model for clicks.
- Material UI: consistent, accessible UI components under the given constraint.
- Axios: robust HTTP client with interceptors (future auth/telemetry ready).

#### API Design
- `POST /shorturls` — create; defaults validity to 30 minutes if omitted.
- `GET /shorturls/:shortcode` — returns stats including clicks; ISO 8601 timestamps.
- `GET /shorturls` — list active short URLs; expired links auto-deactivated.
- `GET /:shortcode` — redirect and record click (referrer, UA, IP, timestamp, location placeholder).

Validation rules:
- URL must be syntactically valid.
- `validity` positive integer (minutes). Default 30.
- `shortcode` 3–20 alphanumeric; uniqueness enforced by DB and checked in service.

#### Data Model (Prisma)
- `ShortUrl` (`id`, `originalUrl`, `shortcode` unique, `createdAt`, `expiresAt`, `validity`, `isActive`, `clicks[]`).
- `Click` (`id`, `shortUrlId` FK, `timestamp`, `referrer?`, `userAgent?`, `ip?`, `location?`).

Indexes & Constraints:
- Unique index on `ShortUrl.shortcode` prevents collisions.
- Relation `Click.shortUrlId -> ShortUrl.id` with `onDelete: Cascade`.

Expiry handling:
- On reads, expired links are filtered and marked inactive; prevents redirection to stale targets.

#### Scalability Considerations
- Stateless service; can horizontally scale behind a load balancer.
- DB connection pooling recommended (e.g., PgBouncer) for high concurrency.
- Add caching layer (e.g., Redis) for shortcode→URL lookup to reduce DB load on redirects.
- Batch/stream click events to a queue (e.g., Kafka) for write-intensive analytics at scale.
- Add rate limiting and surge protection (e.g., token bucket) to protect from abuse.

#### Security & Reliability
- Helmet and CORS configured; strict origin via `FRONTEND_URL`.
- Input validation on all endpoints; descriptive error responses.
- Avoid open redirects by validating URL format; optionally allowlist protocols (`http`, `https`).
- Graceful shutdown closes Prisma.
- Observability: structured logs; add request IDs and tracing in future.

#### Config & Deployment
- Config via `.env`: `PORT`, `FRONTEND_URL`, `BACKEND_URL`, `DATABASE_URL`.
- Containerization ready (add Dockerfile); run migrations on deploy (`db:push`/`migrate`).
- Serve behind reverse proxy (Nginx) to terminate TLS and compress.

#### Assumptions
- No authentication required per assignment; backend trusts callers.
- Geolocation is coarse and placeholder; can integrate with IP geo service later.
- Default validity is acceptable if client omits it.
- Single database schema; multi-tenant not required for this scope.

#### Future Enhancements
- Custom domains per tenant; vanity paths.
- Click enrichment pipeline (UTM parsing, device classification, geo lookup).
- Soft-delete and restoration of links; archival analytics store.
- Background job to periodically deactivate expired links.


