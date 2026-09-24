# AI_RULES.md
## Project Overview
- **Name:** StoneTrail
- **Purpose:** Professional platform for a veteran stone business owner (25+ years of experience). 
  - **Commercial part:** Showcases and manages the owner's private stone inventory (exclusive inventory, NOT a multi-vendor marketplace).
  - **Community part:** A professional hub featuring a discussion forum and expert articles where other companies and specialists can participate.
- **Tone of Voice:** Expert, authoritative, experienced, yet professional. The owner is a "veteran" in the stone industry.
- **Locale:** Russian — set `lang="ru"` and write all user-facing copy in Russian.

## Tech Stack (authoritative — AI_RULES.md)
### Frontend (primary, non-negotiable)
- **Framework:** Next.js 16 (App Router) with React 19 and React Server Components.
- **Language:** TypeScript (strict mode) for all frontend source code.
- **Styling:** Tailwind CSS v4 (`@tailwindcss/postcss`), CSS-variable theming, `base-nova` style.
- **UI primitives:** shadcn/ui (built on `@base-ui/react`) in `components/ui/`, plus `class-variance-authority` for variants.
- **Icons:** `lucide-react` as the single icon library.
- **Class merging:** `cn()` helper (built on `clsx` + `tailwind-merge`) from `@/lib/utils`.
- **Fonts:** Self-hosted via `next/font/google` (Inter, Manrope) with CSS variables.
- **Analytics:** `@vercel/analytics` injected only in production (`app/layout.tsx`).

### Backend (API)
- **Language:** Python 3.11+
- **Framework:** FastAPI (asynchronous)
- **Database:** PostgreSQL
- **ORM:** SQLAlchemy 2.0 (async sessions)
- **Migrations:** Alembic
- **Validation / DTOs:** Pydantic v2

## Library Rules (what to use for what)
| Task | Use | Notes |
|------|-----|-------|
| UI components | shadcn/ui (`components/ui/`) | Reuse before building new. Don't edit files in `components/ui/` — add custom components instead. |
| Icons | `lucide-react` | One icon library only; do not add icon sets. |
| Component variants | `class-variance-authority` | For `variant`/`size` props on custom components. |
| Merging Tailwind classes | `cn()` from `@/lib/utils` | Always for conditional classes; never hand-concatenate with `clsx`/`tailwind-merge` directly. |
| Styling / layout | Tailwind CSS utilities only | No inline `style=` unless the value is truly dynamic. |
| Routing / pages | Next.js App Router (`app/`) | Root layout `app/layout.tsx`; main page `app/page.tsx`. |
| Server-side fonts | `next/font/google` | Self-host; expose via CSS variables. |
| Images | `public/` static assets or `next/image` | `unoptimized` set in `next.config.mjs`; stone sample images in `public/stone/`. |
| Mock / seed data (frontend) | `lib/mock-data.ts` | Source of truth for sample content (materials, inventory). |
| Analytics | `@vercel/analytics` | Render only in production; do not gate behind feature flags. |
| API routes (Python) | FastAPI routers in `api/` or `routes/` | One router per resource; keep thin. |
| Business logic | Service layer (`services/`) | All domain rules live here; no logic in route handlers. |
| Data access | Repository layer (`repositories/`) | Sole point of contact with SQLAlchemy. |
| DTOs / validation | Schemas layer (`schemas/`) | Pydantic v2 models for request/response. |
| DB migrations | Alembic | One migration per schema change; never edit applied migrations. |

## Architecture — Layered (backend)
The Python backend follows strict **Layered Architecture**:
1. **API / Routes** (`api/routes/`) — HTTP handling, auth guards, status codes.
   No business logic, no DB calls.
2. **Service** (`services/`) — all business logic, orchestration, transactions.
3. **Repository** (`repositories/`) — SQLAlchemy 2.0 async queries; the **only**
   layer that imports the ORM session.
4. **Schemas** (`schemas/`) — Pydantic v2 DTOs (request / response / internal).

Frontend (Next.js) communicates with the FastAPI backend via REST/JSON.
No server-side Python templating (Jinja2) is part of the rendering pipeline.

## Project Conventions
### Frontend (TypeScript / Next.js)
- **App structure:**
  - `app/` — Next.js App Router (root layout + pages).
  - `components/` — reusable components (kebab-case: `hero.tsx`, `material-card.tsx`).
  - `components/ui/` — shadcn/ui primitives (do not modify; extend instead).
  - `lib/` — utilities and mock data.
- **Naming:** Named exports, PascalCase (`export function Hero()`), kebab-case filenames.
- **Imports:** Path aliases — `@/components/...`, `@/lib/...` (see `tsconfig.json` `paths`).
- **Classes:** Always go through `cn(...)`.
- **Spacing Rule:** Page titles, headers, and hero sections MUST use `py-24` (vertical padding) to ensure sufficient distance from the site header. Avoid `py-12`.
- **Config:** `next.config.mjs` disables image optimisation — preserve unless explicitly asked. TypeScript errors fail the production build.

### Backend (Python)
- **Style:** PEP 8.
- **Formatter / linter:** Black + Ruff (run on every commit).
- **Typing:** Strict type hints on every function signature and return value.
- **Naming:** `snake_case` (functions / variables), `PascalCase` (classes),
  `UPPER_SNAKE_CASE` (constants / config).
- **Structure:**
  - `api/` — FastAPI app, routers, middleware.
  - `services/` — business logic.
  - `repositories/` — data-access layer.
  - `schemas/` — Pydantic DTOs.
  - `core/` — config, DB session factory, shared utilities.
  - `alembic/` — migration scripts.

### General
- All user-visible copy is in **Russian**.
- Content should reflect the expertise of a person with 30 years of experience in the stone industry.
- Do not switch the app language without an explicit request.
- Inform the user if any extra packages are needed.

## Things to DO
- Reuse existing shadcn/ui components and `lucide-react` icons before adding new ones.
- Follow kebab-case filenames + PascalCase named-export pattern (frontend).
- Keep styling in Tailwind utilities; use `cn()` for all conditional classes.
- **Always apply `py-24` to page headings/hero sections to prevent them from sticking to the header.**
- Maintain Russian-language user-facing content.
- In the backend, keep layers separated; a route handler must not import a repository.
- Use `async` / `await` throughout the Python stack (FastAPI, SQLAlchemy 2.0 async).
- Add Alembic migrations for **every** schema change.

## Things to NOT Do
- Do **not** treat the platform as a multi-vendor marketplace; inventory is for the owner only.
- Do **not** add new icon libraries, CSS frameworks, or UI kits.
- Do **not** modify files in `components/ui/` — create new components in `components/` instead.
- Do **not** use a second class-merging library; always go through `cn()`.
- Do **not** introduce inline `style=` for static values a Tailwind utility can express.
- Do **not** switch the app language away from Russian without an explicit request.
- Do **not** use Jinja2 or any Python template engine for the frontend — the frontend is Next.js.
- Do **not** put business logic in route handlers or query logic in services — respect the layer boundaries.
- Do **not** bypass Pydantic validation; every API input/output must go through a schema.