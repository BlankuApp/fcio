# AI FlashCards - Copilot Instructions

## Project Overview
AI-powered flashcard application built with **Next.js 15** (App Router), **React 19**, **Supabase** (PostgreSQL + Auth), and **shadcn/ui**. 

**Tech Stack**: Next.js 15 with Turbopack, React 19, TypeScript, Tailwind CSS, Vitest for testing (141 tests passing)  
**Backend**: Supabase (PostgreSQL + Auth)  
**UI Components**: shadcn/ui (new-york style) with lucide-react icons  
**Key Features**: Sidebar navigation, multi-language support, role-based admin access, AI-powered word collocation generation

Developed on Windows with PowerShell commands.
For html/css components, try to use the `npx shadcn@latest add <component-name>` command to scaffold them into `src/components/ui/`.

## Critical Architecture Patterns

### 1. Client/Server Split Architecture
**IMPORTANT**: This codebase uses a strict client/server separation pattern. Violating this causes runtime errors.

#### Supabase Client Pattern
- **Client-side** (`"use client"` components): `import { createClient } from "@/lib/supabase/client"`
- **Server-side** (Server Components, middleware): `import { createClient } from "@/lib/supabase/server"`
  - Server client returns a Promise: `const supabase = await createClient()`

#### Auth Utilities Pattern
Two parallel implementations for authentication:
- **Client**: `@/lib/auth/utils.ts` - for `"use client"` components
- **Server**: `@/lib/auth/server-utils.ts` - for Server Components/API routes
  ```ts
  // Client component
  import { checkAuth, getCurrentUser } from "@/lib/auth/utils"
  
  // Server component
  import { checkAuth, getCurrentUser } from "@/lib/auth/server-utils"
  ```

#### User Profile CRUD Pattern
Same dual pattern in `@/lib/user-profile/`:
- **Client**: `client-utils.ts` exports `createUserProfile`, `getUserProfile`, etc.
- **Server**: `server-utils.ts` exports same functions (always `await` server client)
- **Convenience**: `index.ts` exports with `Server` suffix: `createUserProfileServer`, `getUserProfileServer`

### 2. Database Schema (Supabase)

**`user_profiles`** - Core user data (linked to auth.users)
```typescript
{
  id: string                         // matches auth.users.id
  email: string
  username: string
  mother_tongues: string[]           // PostgreSQL array: ["en", "fa"]
  target_languages: TargetLanguage[] // JSON: [{languageCode: "ja", proficiency: "intermediate"}]
  is_admin: boolean
  created_at: string
  updated_at: string
}
```

**`words`** - Unique lemmas per language with generated collocations
```typescript
{
  id: string                         // UUID
  lemma: string                      // word/base form
  lang: string                       // language code (e.g., "en", "ja")
  collocations: CollocationsPattern  // JSON: {[pattern]: [{collocation, difficulty}]}
  created_at: string
  updated_at: string
  // Unique constraint on (lemma, lang)
}
```

**`tags`** - Categorization tags for organizing words
```typescript
{
  id: string
  name: string                       // display name
  normalized_name: string            // unique indexed: lowercase, trimmed
  creator_id: string                 // user_profiles.id
  created_at: string
  updated_at: string
}
```

**`word_tags`** - Join table linking words to tags (cascade deletes)

### 3. Authentication & Authorization Flow

#### Middleware Protection (`src/middleware.ts`)
- Runs on every request (excludes static assets)
- Refreshes Supabase auth tokens automatically
- **Admin route protection**: `/admin/*` routes redirect non-admin users to `/`
- Admin status checked via `user_profiles.is_admin` column

#### Admin Access Pattern
```tsx
// In Server Components (e.g., src/app/(admin)/admin/page.tsx)
import { getCurrentUser } from '@/lib/auth/server-utils'
import { requireAdmin } from '@/lib/user-profile/server-utils'

const user = await getCurrentUser()
if (!user) redirect('/')

try {
  await requireAdmin() // throws if not admin
} catch {
  redirect('/')
}
```

#### Client-Side Admin UI
```tsx
// Example: src/components/app-sidebar.tsx
const [isAdminUser, setIsAdminUser] = useState(false)

useEffect(() => {
  const checkAdminStatus = async () => {
    const adminStatus = await isAdmin() // from @/lib/auth/utils
    setIsAdminUser(adminStatus)
  }
  checkAdminStatus()
}, [])
```

### 4. Route Organization
```
src/app/
├── layout.tsx              # Root layout with SidebarProvider
├── page.tsx                # Home page
├── (admin)/                # Route group (doesn't affect URL)
│   ├── admin/page.tsx      # /admin - dashboard (admin-only)
│   └── words/              # /words/* (admin-only)
│       ├── list/page.tsx   # /words/list
│       ├── generate/       # /words/generate (JSONL generation)
│       ├── tags/           # /words/tags (tag management)
│       └── upload/         # /words/upload (batch upload)
└── profile/page.tsx        # /profile - user settings
```
Route groups `(admin)` organize files without affecting URLs. Middleware (`src/middleware.ts`) enforces admin protection on `/admin` and `/words` routes.

## Development Workflow

### Environment Setup
Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Dev Commands (PowerShell)
```powershell
npm run dev          # Port 3030 (Turbopack enabled)
npm run build        # Production build with Turbopack
npm run lint         # ESLint check
npm test             # Run tests in watch mode
npm run test:ui      # Interactive Vitest UI
npm run test:coverage # Coverage report
```

### Adding shadcn/ui Components
```powershell
npx shadcn@latest add <component-name>
```
Components install to `src/components/ui/` with "new-york" style preset.

## Business Logic Patterns

### Words & Collocations Workflow
1. **AI Batch Generation**: `src/lib/ai/batch-request-builder.ts` generates OpenAI batch requests for JSONL files
2. **Result Parsing**: `src/lib/words/parse-batch-results.ts` parses batch results into `CollocationsPattern` format
3. **Upsert Logic**: `upsertWord()` automatically deduplicates by (lemma, lang) unique constraint
4. **Tagging**: `word_tags` join table with cascade deletes for word categorization

### Language Configuration
- **Mother Tongues**: `user_profiles.mother_tongues` (PostgreSQL array of language codes)
- **Target Languages**: `user_profiles.target_languages` (JSON: `[{languageCode: "ja", proficiency: "intermediate"}]`)
- Constants in `src/lib/constants/languages.ts`: 15+ languages with proficiency levels

### Admin Workflows
- **Profile Setup**: Admin users set `is_admin: true` in `user_profiles` table
- **Route Protection**: Middleware redirects non-admin users attempting `/admin` or `/words` routes
- **Dynamic UI**: `app-sidebar.tsx` checks `isAdmin()` to show admin nav items only to admins

## Test Suite Status

✅ **COMPLETE - 141 tests passing**

Comprehensive test suite implemented covering TIER 1 CRITICAL and TIER 2 HIGH priority areas:

| Component | Tests | Status |
|-----------|-------|--------|
| Parse Batch Results (`tests/unit/lib/words/parse-batch-results.test.ts`) | 46 | ✅ Passing |
| Batch Request Builder (`tests/unit/lib/ai/batch-request-builder.test.ts`) | 48 | ✅ Passing |
| Word Client Utils (`tests/unit/lib/words/client-utils.test.ts`) | 17 | ✅ Passing |
| Tag Utils (`tests/unit/lib/tags/utils.test.ts`) | 17 | ✅ Passing |
| Auth Utils (`tests/unit/lib/auth/utils.test.ts`) | 13 | ✅ Passing |
| **TOTAL** | **141** | **✅ 100% Pass Rate** |

**Run tests**: `npm test` or `npm run test:ui` for interactive mode  
**Coverage**: All critical parsing, request generation, CRUD operations, and authentication flows  
**Mocks**: See `tests/mocks/supabase.ts` for client mock patterns

## Styling & UI Conventions

### Tailwind + CSS Variables
- Theme colors defined in `src/app/globals.css` using CSS custom properties
- Always use `cn()` utility for conditional classes:
  ```tsx
  import { cn } from "@/lib/utils"
  <div className={cn("base-class", condition && "conditional-class")} />
  ```

### Component Composition Pattern
```tsx
// Extend base component props
interface MyComponentProps extends React.ComponentProps<typeof BaseComponent> {
  customProp?: string
}

export function MyComponent({ customProp, ...props }: MyComponentProps) {
  return <BaseComponent {...props} />
}
```

### Icons
Use **lucide-react** exclusively. Import specific icons:
```tsx
import { Shield, Users, Settings } from "lucide-react"
```

## Common Pitfalls

1. **Wrong Supabase client**: Using client in Server Component → "cookies() can only be used in Server Component"
2. **Missing await on server client**: `createClient()` instead of `await createClient()`
3. **Wrong auth utility**: Importing from `utils.ts` in Server Component → session errors
4. **Array field handling**: `mother_tongues` and `target_languages` stored as PostgreSQL arrays/JSON - always validate array type before `.from().insert()`

## Migration Utilities
`src/lib/user-profile/migration-utils.ts` provides `migrateUserToProfile()` for moving auth metadata to `user_profiles` table (legacy support).

---

**Key Files Reference**:
- Layout: `src/app/layout.tsx` (SidebarProvider wrapper)
- Auth middleware: `src/middleware.ts` (admin protection)
- Admin guard: `src/lib/user-profile/server-utils.ts` (`requireAdmin()`)
- Type definitions: `src/lib/types/user-profile.ts`

## Database tables (very short)

- `words`
  - Stores unique words/lemmas per language. `collocations` holds generated collocation data as JSON. Unique on (lemma, lang).

- `tags`
  - Tag records for categorizing words. `normalized_name` is indexed for fast lookups. Tracks creator and timestamps.

- `word_tags`
  - Join table linking `words` and `tags`. Prevents duplicate word-tag pairs and cascades deletes from `words` or `tags`.

- `tags_normalized_name_idx` (index)
  - Unique index on `tags.normalized_name` for fast, case/format-normalized tag lookups.

- `word_tags_word_id_idx` (index)
  - Index on `word_tags.word_id` to speed queries that fetch tags for a word.

- `word_tags_tag_id_idx` (index)
  - Index on `word_tags.tag_id` to speed queries that fetch words for a tag.

## Language Support System

### Language Constants (`src/lib/constants/languages.ts`)
```typescript
export const LANGUAGES: Language[] = [
  { code: "en", name: "English", nativeName: "English" },
  { code: "ja", name: "Japanese", nativeName: "日本語" },
  // ... 15 total languages
]

export const PROFICIENCY_LEVELS: ProficiencyLevel[] = [
  { value: "elementary", label: "Elementary", description: "..." },
  // ... 5 levels total
]
```

### User Language Configuration
- **Mother tongues**: Array of language codes (`["en", "fa"]`)
- **Target languages**: Array of `{languageCode: string, proficiency: string}` objects
- Helper functions: `getLanguageByCode()`, `getLanguageDisplayName()`