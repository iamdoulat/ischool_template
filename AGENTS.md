# AGENTS.md — iSchool

School management system (SMS) — Next.js 16 frontend + Laravel 12 backend.

## Commands

```bash
# Frontend (root) — uses webpack, not turbopack
npm run dev       # next dev --webpack
npm run build     # next build
npm run lint      # eslint
npm run start     # next start

# Backend (backend/ — separate git repo, ignored by root .gitignore)
composer install
php artisan serve
php artisan migrate
composer test     # runs config:clear then php artisan test
composer dev      # concurrently: server + queue + logs + next dev
composer setup    # install + .env + key:generate + migrate + npm install + npm build
```

## Architecture

- **Frontend**: `src/app/` — Next.js App Router. 36 dashboard modules under `src/app/dashboard/`. Dynamic slug catch-all at `src/app/[slug]/page.tsx`.
- **Backend**: `backend/` — standalone Laravel 12 app with its own `.git`. Routes modularized under `backend/routes/api/v1/` per feature domain.
- **Auth**: Laravel Sanctum. Token in `localStorage` as `auth_token`, sent as `Bearer`. Axios interceptor redirects to `/login` on 401.
- **State**: React hooks + context providers. No global state library.
- **MSW (dev only)**: `<MSWInit />` in root layout starts MSW. Handlers in `src/mocks/handlers.ts`. If `mockServiceWorker.js` missing from `public/`, run `npx msw init public/`.

## Provider Nesting

**Root layout** (`src/app/layout.tsx`):
```
ThemeProvider → MSWInit → ToastProvider → SettingsProvider → {children} → Toaster + SonnerToaster
```

**Dashboard layout** (`src/app/dashboard/layout.tsx`):
```
ThemeProvider → LanguageProvider → CurrencyProvider → DashboardLayoutContent
```
`DashboardLayoutContent` reads `settings` from API to sync theme mode, primary color, sidebar state, and skin class (`skin-bordered`/`skin-shadow`).

## Key Conventions

- **Design system** at `design-system/ischool/MASTER.md` specifies Purple `#7C3AED`, but `globals.css` (source of truth) uses Indigo `#6366f1`.
- **Path alias**: `@/*` → `src/*` (tsconfig.json).
- **Style**: Tailwind CSS v4 (`@import "tailwindcss"` in globals.css, no `tailwind.config.ts`), `tw-animate-css`, `@tailwindcss/postcss` plugin, `@tailwindcss/typography` plugin. Shadcn UI (new-york style).
- **`.npmrc`**: `legacy-peer-deps=true` — use npm, not pnpm/yarn.
- **Two toasts coexist**: `sonner` (`toast.success`/`toast.error`) AND custom `useToast()` hook from `@/components/ui/use-toast`.

## Data Fetching

- **No data-fetching library** — each page uses raw `useEffect` + `api.get()` with local `loading`/`saving` state.
- **Mock strategy**: MSW covers auth + system settings only. Most pages use inline `const mockX = [...]` in the component. Only main dashboard (`/dashboard`) uses catch-and-fallback to `mockDashboardData` from `src/lib/mock-data.ts`.
- **API response shape inconsistency** — unwrap defensively:
  - `BaseController`+`ApiResponse` trait → `{ status, success, message, data: { data: [...], current_page, ... } }` → `response.data.data`
  - Raw `response()->json()` → `{ data: [...] }` → safe fallback: `result?.data || result || []`
- **Backend `.env`** uses **MySQL** (`DB_CONNECTION=mysql`, DB: `ischool`, root, no password). Only tests force SQLite `:memory:`.
- **Sanctum CORS**: `FRONTEND_URL=http://localhost:3000`, `SANCTUM_STATEFUL_DOMAINS=localhost:3000`.

## Coding Conventions

- **State variable naming**: `loading`, `saving`, `editingId`, `searchTerm`, `currentPage`, `lastPage`, `isDeleteDialogOpen`, `deleteId`, `selectedIds`.
- **Form layout**: left form panel (1/3) + right table (2/3) in a responsive grid.
- **CRUD pattern**: `fetchData()` → `handleSave()` → `startEdit(item)` → `handleDelete(id)` with `AlertDialog` confirmation.
- **Export toolbar**: every list page includes Copy/Excel/PDF/Print buttons (via `xlsx`, `jspdf`, `jspdf-autotable`).
- **Primary action buttons**: `bg-gradient-to-r from-[#FF9800] to-[#6366F1]` (orange-to-indigo gradient).

## Libraries

| Category | Libraries |
|----------|-----------|
| HTTP | `axios` (configured in `src/lib/api.ts`) |
| UI | `shadcn/ui` (radix primitives), `framer-motion`, `lucide-react` |
| Charts | `recharts` |
| Export | `xlsx` + `papaparse` (spreadsheet), `jspdf` + `jspdf-autotable` (PDF) |
| Forms | `react-day-picker`, `react-quill-new` (rich text) |
| DnD | `@hello-pangea/dnd` |
| Other | `face-api.js`, `html2canvas`, `jsqr`, `qrcode`, `next-themes`, `date-fns` (formatDate in `src/lib/utils.ts`) |

## Testing

- **Frontend**: no test runner. `npm run lint` for code quality.
- **Backend**: PHPUnit via `composer test` (runs `config:clear` first). Config forces `sqlite :memory:` in `phpunit.xml`. Suites: Unit, Feature.

## Gotchas

- `next.config.ts` sets `serverExternalPackages: ["face-api.js"]` and webpack fallback for `{ fs: false, path: false, os: false }` — needed because face-api.js imports Node modules.
- ESLint uses flat config (`eslint.config.mjs`, ESM) with `eslint-config-next/core-web-vitals` + TypeScript.
- Backend git is separate; `backend/` in root `.gitignore`. Commit/push from inside `backend/`.
- `composer dev` runs 4 concurrent processes via concurrently: `php artisan serve`, `php artisan queue:listen --tries=1 --timeout=0`, `php artisan pail --timeout=0`, `npm run dev`.
- MSW only starts in development (dynamic import in `src/lib/msw.ts`). No effect in production builds.
- No CI workflows, no opencode.json, no cursor rules exist in this repo.
