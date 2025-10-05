# AI FlashCards - Copilot Instructions

## Project Overview
This is an AI-powered flashcard application built with Next.js 15, React 19, and Supabase. The app uses a sidebar-based layout with shadcn/ui components for the user interface.

## Architecture & Key Patterns

### App Router Structure
- Uses Next.js 15 App Router with the `src/app/` directory
- Root layout (`src/app/layout.tsx`) implements a sidebar-based UI using `SidebarProvider` and `AppSidebar`
- Dashboard page has its own nested layout pattern with breadcrumbs and header

### UI Component System
- Built on **shadcn/ui** with "new-york" style variant
- All UI components live in `src/components/ui/` 
- Uses Radix UI primitives as the foundation (Avatar, Dropdown, Collapsible, etc.)
- **Tailwind CSS** for styling with CSS variables enabled
- Component composition follows the shadcn pattern: primitive + styling + behavior

### Styling Conventions
- Uses `cn()` utility from `src/lib/utils.ts` for conditional class merging (clsx + tailwind-merge)
- CSS variables defined in `src/app/globals.css` for theming
- Geist font family (sans and mono variants) loaded via `next/font/google`

### Supabase Integration
- **Database**: All data is managed by Supabase (PostgreSQL-based)
- **Authentication**: Cookie-based session management with JWT tokens
- **Dual client pattern**: separate clients for browser (`client.ts`) and server (`server.ts`)
  - Use `src/lib/supabase/client.ts` for client-side operations (browser)
  - Use `src/lib/supabase/server.ts` for server-side operations (Server Components, API routes)
- Server client uses Next.js cookies for session management
- Environment variables: `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- Database queries use Supabase's query builder (`.from()`, `.select()`, `.insert()`, etc.)
- **Auth utilities** in `src/lib/auth/utils.ts` provide helper functions for authentication
- **Middleware** (`src/middleware.ts`) automatically refreshes auth tokens on each request

### Component Patterns
- Use `"use client"` directive for interactive components (sidebar, dropdowns, etc.)
- Components accept props extending base component props: `React.ComponentProps<typeof BaseComponent>`
- Icon imports from `lucide-react` library
- Sidebar components use the custom `useSidebar()` hook for responsive behavior

## Development Workflow

### Scripts
- `npm run dev` - Development server with Turbopack on port 3030
- `npm run build` - Production build with Turbopack
- `npm run lint` - ESLint checking

### File Organization
```
src/
├── app/           # Next.js App Router pages
│   └── profile/   # User profile/settings page
├── components/    # React components
│   ├── ui/        # shadcn/ui base components
│   ├── auth-dialog.tsx      # Login/signup modal
│   ├── profile-form.tsx     # User profile edit form
│   └── nav-user.tsx         # User menu in sidebar
├── hooks/         # Custom React hooks
└── lib/           # Utilities and integrations
    ├── auth/      # Authentication utilities
    ├── constants/ # App constants (languages, etc.)
    └── supabase/  # Database client setup
```

## Key Implementation Notes

- **Sidebar Layout**: The app uses a persistent sidebar via `SidebarProvider` that wraps all pages
- **Component Props**: Follow the pattern of extending base component props and spreading them
- **Styling**: Always use the `cn()` utility for combining Tailwind classes
- **Database Access**: 
  - Import from `@/lib/supabase/client` for client components
  - Import from `@/lib/supabase/server` for server components and API routes
  - Always await the server client: `const supabase = await createClient()`
- **Authentication Flow**:
  - Use `src/lib/auth/utils.ts` helper functions (`signIn`, `signUp`, `signOut`, `checkAuth`)
  - Sessions are stored in cookies automatically by Supabase
  - `NavUser` component shows login button when unauthenticated
  - `AuthDialog` component handles login/signup forms
  - Signup requires: email, password, username, and mother tongue selection
  - User metadata includes `username` and `mother_tongue` fields
  - Users can select multiple mother tongues (at least one required)
  - Users must add at least one target language with proficiency level
  - Target languages include language code and proficiency level (elementary, intermediate, upper intermediate, advanced, native)
  - Target languages stored as array of `{languageCode, proficiency}` objects
  - Middleware refreshes tokens on each request
- **Language Support**:
  - Languages dictionary in `src/lib/constants/languages.ts`
  - Includes frequently used languages: English, Japanese, Persian, Arabic, Hindi, Myanmar, Spanish, French, German, Chinese, Korean, Portuguese, Russian, Italian, Turkish
  - Each language has `code`, `name`, and `nativeName` properties
  - Proficiency levels defined in `PROFICIENCY_LEVELS` constant
  - Target languages stored as array of `{languageCode, proficiency}` objects
  - Use `getLanguageByCode()` and `getLanguageDisplayName()` helper functions
- **Icons**: Use lucide-react icons consistently throughout the app
- **TypeScript**: Strict typing enabled with proper type imports from dependencies

When creating new components, follow the established patterns in `src/components/app-sidebar.tsx` and `src/components/nav-user.tsx` for consistency.