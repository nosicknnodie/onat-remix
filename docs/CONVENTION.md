# Project Convention

## 1. Tech Stack
- **Framework**: Remix (Vite)
- **Language**: TypeScript
- **Package Manager**: pnpm
- **Database**: PostgreSQL (via Prisma)
- **Styling**: TailwindCSS (with `tailwindcss-animate`, `shadcn/ui`)
- **Linting/Formatting**: Biome
- **Testing**: Vitest, Playwright, Storybook

## 2. Project Structure
- **`app/`**: Main application source code.
- **`features/`**: Feature-based modules.
    - **Rule**: Do not deep import from `~/features/*/**`. Use the barrel file (`index.ts`) or specific allowed paths (`client`, `server`, `isomorphic`).
    - **Structure**:
        - `isomorphic/`: Shared code (Types, Hooks, Schemas).
            - `*.hooks.ts`: React Query hooks.
            - `*.schema.ts`: Zod schemas (for react-hook-form).
            - `*.types.ts`: Types derived from Prisma/Schemas (Single source of truth for Client/Server).
        - `server/`: Server-side logic (Service Layer).
            - `*Service`: Business logic & Prisma queries.
            - **Export Rule**: Export only Services via barrel file (e.g., `export * as matchService`).
            - **Return Rule**: Return plain objects/data. **NEVER** return HTTP objects (e.g., `Response.json`) here. HTTP responses belong in the Router/API layer.
- **`prisma/`**: Database schema and migrations.

## 3. Data Fetching & State Management
- **React Query**: Used for data fetching.
    - **Hooks**: Located in `~/features/*/isomorphic/*.hooks.ts`.
    - **Query Keys**: Managed as a `const` object factory in the same file.
        ```typescript
        export const clubMemberQueryKeys = {
          approved: (clubId: string) => ["club", clubId, "members", "approved"] as const,
          pendings: (clubId: string) => ["club", clubId, "members", "pendings"] as const,
        } as const;
        ```


## 4. Coding Standards
- **Type Safety**: Strict mode enabled (`strict: true`).
- **Imports**: Use absolute paths with `~` alias (e.g., `~/components/...`).
- **UI & Styling**:
    - **Components**: Prioritize using `shadcn/ui` components (`~/components/ui`). Custom implementation should be the last resort.
    - **Colors**: STRICTLY use Tailwind theme colors (e.g., `bg-primary`, `text-muted-foreground`) defined in `tailwind.config.ts`. Avoid arbitrary hex/rgb values.
    - **Font**: `Pretendard` (primary), `Inter`.
- **Naming**:
    - Files: `kebab-case` (e.g., `user-profile.tsx`).
    - Components: `PascalCase` (e.g., `UserProfile`).
    - Functions/Variables: `camelCase`.

## 5. Remix Specifics
- **Loader/Action Returns**:
    - **API Routes (`api+/`)**: Always return `Response.json()`.
    - **UI Routes**:
        - `loader`: Return plain objects.
        - `action`: Return `Response.json()`.
- **Navigation**:
    - Use `~/components/ui/Link.tsx` wrapper instead of direct Remix `<Link>` for feature UI components.

## 6. Workflow
- **Lint & Format**: Run `pnpm biome check .` and `pnpm biome format .`.
- **Verification**: Run `pnpm verify` (Typecheck + Lint) before committing.
- **Testing**:
    - Unit/Integration: `pnpm test` (Vitest).
    - UI: `pnpm test:ui`.
    - E2E: `pnpm playwright test`.

## 7. AI Agent Guidelines
- **Communication**:
    - **NO Assumptions**: If requirements are ambiguous or implementation details are missing, **ALWAYS ASK** the user for clarification before proceeding. Do not make arbitrary decisions.
    - **Language**: Korean (한국어).
- **File Access**: Respect `.gitignore` and `.geminiignore`.
- **Task Management**: Maintain `task.md` for complex tasks.
- **Documentation**: Keep `docs/CONVENTION.md` up to date as rules evolve.