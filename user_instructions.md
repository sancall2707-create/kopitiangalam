# Kopi Tiang Alam

A full-stack coffee shop ordering PWA. Customers browse the menu, add to cart, checkout (dine-in via QR or takeaway), and track their order in real time. Admins manage orders, products, categories, and tables with QR code generation.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm --filter @workspace/kopi-tiang-alam run dev` — run the frontend (auto-assigns PORT)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string, `SESSION_SECRET` — JWT signing secret

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite, Tailwind CSS, wouter (routing), TanStack Query
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Auth: JWT (`jsonwebtoken`) + `bcryptjs`
- Build: esbuild (CJS bundle)

## Where things live

- `lib/api-spec/openapi.yaml` — source of truth for API contracts
- `lib/db/src/schema/` — Drizzle ORM table definitions
- `artifacts/api-server/src/routes/` — Express route handlers (`public.ts`, `admin.ts`)
- `artifacts/api-server/src/middlewares/auth.ts` — JWT middleware
- `artifacts/kopi-tiang-alam/src/pages/` — React pages (customer + admin)
- `artifacts/kopi-tiang-alam/src/lib/` — cart context (`cart.tsx`), auth helpers (`auth.ts`)

## Architecture decisions

- Contract-first API: OpenAPI spec drives both Zod validators (server) and React Query hooks (client)
- JWT stored in `kta_admin_token` localStorage key; `setAuthTokenGetter` wires it into every API call
- PostgreSQL `numeric` columns return strings — all route handlers call `parseFloat()` before responding
- Cart state persisted in `kta_cart` localStorage key via React Context
- Admin routes protected by `requireAdmin` middleware (Bearer JWT); frontend redirects to `/admin/login` if no token

## Product

- **Customer flow**: Landing → Menu (with category filter + search) → Product Detail → Cart → Checkout → Order Tracking (auto-refresh every 10s)
- **Admin flow**: Login → Dashboard (stats + chart + live orders) → Orders (status management) → Products (CRUD) → Categories (CRUD) → Tables (CRUD + QR download)
- Dine-in orders carry a `?table=XX` URL param from QR code scans

## User preferences

_Populate as you build — explicit user instructions worth remembering across sessions._

## Gotchas

- Always run `pnpm run typecheck:libs` after changing DB schema or OpenAPI spec (lib rebuild needed before route typechecks pass)
- PostgreSQL `numeric` → always coerce to float in routes before JSON response
- After adding new routes, restart the API workflow (it builds on start)

## Credentials (dev only)

- Admin: `admin` / `admin123`

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details
Please use Japanese for all GitHub interactions (PR titles, descriptions, commit messages, and review replies).
