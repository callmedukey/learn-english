# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Reading Camp - A Next.js 15 application for English learning with reading comprehension features, novels, user authentication, and payment processing.

## Important Development Guidelines

### Data Fetching in Next.js
- **NEVER use fetch() inside useEffect in client components** - this is an anti-pattern
- **ALWAYS prefer passing data from server components as props** (highest priority)
- If async data is needed in client components, use React's `use()` hook as a secondary option
- Server components should fetch all necessary data and pass it down to client components
- This approach prevents hydration mismatches and improves performance

### Next.js 15 Important Changes
- **params and searchParams are now Promises** - In Next.js 15, both `params` and `searchParams` in server components (pages, layouts, route handlers) are Promises that must be awaited
- Example: `const { id } = await params;` instead of `const { id } = params;`
- This applies to:
  - Page components: `export default async function Page({ params }: { params: Promise<{ id: string }> })`
  - Route handlers: `export async function GET(request: Request, { params }: { params: Promise<{ id: string }> })`
  - Layout components: Similar pattern with Promise types

## Essential Commands

### Development
- `npm run dev` - Start development server with Turbopack
- `npm run build` - Build for production
- `npm run lint` - Run ESLint checks
- `npm run test` - Run Jest test suite
- `npm run test:watch` - Run tests in watch mode

### Database Management
- `npm run db:generate` - Generate Prisma client after schema changes
- `npm run db:migrate` - Apply database migrations
- `npm run db:push` - Push schema to database (development)
- Seed database: `tsx prisma/seed.ts`

### Local Database Access
The PostgreSQL database runs via Docker. To access it:

**Docker exec into the container:**
```bash
docker exec -it learn-english-postgres-1 psql -U postgres -d my-local-db
```

**Direct psql connection with password:**
```bash
PGPASSWORD='redisPrismaNaver2025@' psql -h localhost -p 5432 -U postgres -d my-local-db
```

**Connection details:**
- Container name: `learn-english-postgres-1`
- Host: `localhost`
- Port: `5432`
- Database: `my-local-db`
- Username: `postgres`
- Password: `redisPrismaNaver2025@`

**Prisma schema location:** `/prisma/schema/`

**Common database commands:**
- List all tables: `\dt`
- Describe table structure: `\d table_name`
- List all schemas: `\dn`
- Exit psql: `\q`

### Type Checking
Run TypeScript compiler: `npx tsc --noEmit`

## Architecture Overview

### Tech Stack
- **Frontend**: Next.js 15.3.3, React 19, TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Authentication**: NextAuth.js v5 (beta)
- **Styling**: Tailwind CSS v4 with Radix UI components
- **Forms**: React Hook Form + Zod validation
- **Payments**: Toss Payments SDK
- **Caching**: Redis

### Directory Structure
- `/app` - Next.js app directory with route groups:
  - `(auth-flow)` - Login, signup, password reset pages
  - `(after-auth)` - Authenticated user pages (dashboard, novels, profile)
  - `/admin` - Admin panel for user/content management
  - `/api` - API routes for auth, payments, uploads
- `/components` - React components:
  - `/ui` - Shadcn/ui components (auto-generated, don't edit directly)
  - `/custom-ui` - Custom UI components
  - `/emails` - Email templates using React Email
- `/prisma/schema` - Modularized Prisma schemas (auth.prisma, payments.prisma, etc.)
- `/lib` - Utilities, services, and shared functions
- `/actions` - Next.js server actions
- `/hooks` - Custom React hooks
- `/types` - TypeScript type definitions

### Database Schema Organization
Prisma schemas are split into multiple files in `/prisma/schema/`:
- `base.prisma` - Datasource and generator config
- `auth.prisma` - User authentication models
- `payments.prisma` - Payment and subscription models
- `novels.prisma` - Novel and chapter models
- `notifications.prisma` - Notification system models

After modifying schemas, run `npm run db:generate` to update the Prisma client.

### Testing Strategy
- Test files in `__tests__/` directories
- Jest with React Testing Library for component testing
- Run individual tests: `npm run test -- path/to/test.spec.ts`

### Import Conventions
- Use `@/` path alias for imports from project root
- Import order enforced by ESLint: builtin → external → internal → parent/sibling
- Components from `/components/ui` are auto-generated from shadcn/ui

### Authentication Flow
- NextAuth v5 with Prisma adapter
- OAuth providers: Naver
- Session strategy: JWT
- Protected routes use middleware and route groups

### Development Tips
- Always run `npm run lint` before committing
- Generate Prisma types after schema changes: `npm run db:generate`
- UI components in `/components/ui` are managed by shadcn/ui CLI
- Server actions go in `/actions` directory with proper error handling
- Use TypeScript strict mode - avoid `any` types where possible
- IMPORTANT: Run `npx tsc --noEmit` and `npm run lint` after every work to catch errors early

---

## Mobile App (React Native / Expo)

The mobile app lives in `/mobile` as a nested Expo project within the same repository.

### Mobile Tech Stack
- **Framework**: Expo SDK 54+ with Expo Router (file-based routing)
- **Styling**: NativeWind (Tailwind CSS for React Native)
- **Fonts**: Noto Sans (same as web app)
- **State**: Zustand + TanStack Query
- **Forms**: React Hook Form + Zod (same as web)
- **Auth Storage**: expo-secure-store
- **HTTP**: Axios

### Mobile Commands
```bash
npm run mobile          # Start Expo dev server
npm run mobile:ios      # Run on iOS simulator
npm run mobile:android  # Run on Android emulator
```

### Shared Code (`/lib/shared/`)
Both web and mobile apps import from `/lib/shared/`:
- **Types**: `ActionResponse`, BPA types
- **Utils**: `calculateGrade`, `formatCurrency`, `calculateDaysRemaining`, BPA semester utils
- **Constants**: Timezone settings
- **Hooks**: `useDebounce`

```typescript
// In mobile app
import { calculateGrade } from "@shared/utils";
import type { ActionResponse } from "@shared/types";

// In web app
import { calculateGrade } from "@/lib/shared/utils";
```

### Mobile Directory Structure
```
mobile/
├── app/                    # Expo Router screens
│   ├── (auth)/             # Auth flow (login, signup)
│   ├── (tabs)/             # Main tab navigator
│   └── _layout.tsx         # Root layout (loads fonts, global.css)
├── components/             # Mobile-specific components
├── services/api/           # API client
├── store/                  # Zustand stores
├── global.css              # Tailwind directives
├── tailwind.config.js      # Tailwind config with Noto Sans
├── metro.config.js         # Metro bundler (parent imports + NativeWind)
├── babel.config.js         # Babel with NativeWind preset
└── nativewind-env.d.ts     # TypeScript types for className
```

### NativeWind Usage
```tsx
import { View, Text } from "react-native";

export default function Screen() {
  return (
    <View className="flex-1 items-center justify-center bg-white dark:bg-gray-900">
      <Text className="text-2xl font-bold text-blue-600 font-sans">
        Hello NativeWind!
      </Text>
    </View>
  );
}
```

### Font Classes (Tailwind)
- `font-sans` → NotoSans_400Regular
- `font-noto-sans-medium` → NotoSans_500Medium
- `font-noto-sans-semibold` → NotoSans_600SemiBold
- `font-noto-sans-bold` → NotoSans_700Bold

### Mobile Path Aliases
- `@/*` → `./mobile/*` (mobile-local imports)
- `@shared/*` → `../lib/shared/*` (shared code)

### API Strategy
The Next.js web app serves as the API backend for mobile:
```
Mobile App → API calls → Next.js /app/api/* → Prisma → PostgreSQL
```

### Key Differences from Web
- **Auth**: Uses `expo-secure-store` instead of NextAuth (NextAuth is web-only)
- **Payments**: Uses Toss Payments React Native SDK (different from web SDK)
- **Navigation**: Expo Router instead of Next.js App Router