# AI FlashCards - Copilot Instructions

## Project Overview
AI-powered flashcard application built with **Next.js 15** (App Router), **React 19**, **Supabase** (PostgreSQL + Auth), and **shadcn/ui**. Features sidebar navigation, multi-language support, and role-based admin access.

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
Core table: `user_profiles`
```typescript
{
  id: string              // matches auth.users.id
  email: string
  username: string
  mother_tongues: string[]           // PostgreSQL array
  target_languages: TargetLanguage[] // JSON array: [{languageCode, proficiency}]
  is_admin: boolean
  created_at: string
  updated_at: string
}
```

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
├── layout.tsx          # Root layout with SidebarProvider
├── page.tsx            # Home page
├── (admin)/            # Route group (doesn't affect URL)
│   ├── admin/          # /admin - dashboard
│   └── words/          # /words - add words
└── profile/            # /profile - user settings
```
Route groups `(admin)` organize files without adding URL segments.

## Development Workflow

### Environment Setup
Required `.env.local`:
```
NEXT_PUBLIC_SUPABASE_URL=your-project-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

### Dev Commands (PowerShell)
```powershell
npm run dev    # Port 3030 (Turbopack enabled)
npm run build  # Production build with Turbopack
npm run lint   # ESLint check
```

### Adding shadcn/ui Components
```powershell
npx shadcn@latest add <component-name>
```
Components install to `src/components/ui/` with "new-york" style preset.

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