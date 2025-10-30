+  # CLAUDE.md
 
 This file provides guidance to Claude Code (claude.ai/code) when 
working with code in this repository.
 
 ## Project Overview
 
 AI-powered flashcard application built with **Next.js 15** (App 
Router), **React 19**, **Supabase** (PostgreSQL + Auth), and 
**shadcn/ui**. The application supports multi-language flashcards 
with AI-generated collocations, spaced repetition learning via deck 
review system, and role-based admin access.
 
 **Tech Stack**: Next.js 15 with Turbopack, React 19, TypeScript, 
Tailwind CSS, Vitest
 **Backend**: Supabase (PostgreSQL + Auth)
 **UI Components**: shadcn/ui (new-york style) with lucide-react 
icons
 **Testing**: Vitest (141 tests passing, 100% pass rate)
 
 Developed on Windows with PowerShell commands.
 
 ## Development Commands
 
 ```powershell
 # Development servers
 npm run dev          # Start dev server on port 3030 (Turbopack 
enabled)
 npm run dev1         # Alternative dev server on port 3031
 
 # Build & deployment
 npm run build        # Production build with Turbopack
 npm start            # Start production server
 
 # Code quality
 npm run lint         # Run ESLint
 
 # Testing
 npm test             # Run tests in watch mode
 npm run test:ui      # Interactive Vitest UI
 npm run test:coverage # Generate coverage report
 
 # Adding UI components
 npx shadcn@latest add <component-name>  # Installs to 
src/components/ui/
 ```
 
 ## Critical Architecture Patterns
 
 ### 1. Client/Server Split - STRICTLY ENFORCED
 
 **IMPORTANT**: This codebase uses a strict client/server separation
 pattern. Violating this causes runtime errors.
 
 #### Supabase Client Pattern
 - **Client-side** (`"use client"` components): `import { 
createClient } from "@/lib/supabase/client"`
 - **Server-side** (Server Components, middleware): `import { 
createClient } from "@/lib/supabase/server"`
   - Server client returns a Promise: `const supabase = await 
createClient()`
 
 #### Auth Utilities Pattern
 Two parallel implementations for authentication:
 - **Client**: `@/lib/auth/utils.ts` - for `"use client"` components
 - **Server**: `@/lib/auth/server-utils.ts` - for Server 
Components/API routes
 
 ```ts
 // Client component
 import { checkAuth, getCurrentUser } from "@/lib/auth/utils"
 
 // Server component
 import { checkAuth, getCurrentUser } from "@/lib/auth/server-utils"
 ```
 
 #### CRUD Utilities Pattern
 All feature modules follow this dual pattern in their respective 
directories:
 - **Client**: `client-utils.ts` exports CRUD functions for client 
components
 - **Server**: `server-utils.ts` exports same functions (always 
`await` server client)
 - **Convenience**: `index.ts` exports with `Server` suffix: 
`createWordServer`, `getUserProfileServer`
 
 **Feature modules using this pattern**:
 - `@/lib/user-profile/` - User profile operations
 - `@/lib/words/` - Word/collocation operations
 - `@/lib/tags/` - Tag management
 - `@/lib/decks/` - Deck operations
 
 ### 2. Database Schema (Supabase)
 
 **`user_profiles`** - Core user data (linked to auth.users)
 ```typescript
 {
   id: string                         // matches auth.users.id
   email: string
   username: string
   mother_tongues: string[]           // PostgreSQL array: ["en", 
"fa"]
   target_languages: TargetLanguage[] // JSON: [{languageCode: "ja",
 proficiency: "intermediate"}]
   is_admin: boolean
   created_at: string
   updated_at: string
 }
 ```
 
 **`words`** - Unique lemmas per language with AI-generated 
collocations
 ```typescript
 {
   id: string                         // UUID
   lemma: string                      // word/base form
   lang: string                       // language code (e.g., "en", 
"ja")
   collocations: CollocationsPattern  // JSON: {[pattern]: 
[{collocation, difficulty}]}
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
   normalized_name: string            // unique indexed: lowercase, 
trimmed
   creator_id: string                 // user_profiles.id
   created_at: string
   updated_at: string
 }
 ```
 
 **`word_tags`** - Join table linking words to tags (cascade 
deletes)
 
 **`decks`** - User-created flashcard decks
 ```typescript
 {
   id: string                         // YouTube-like ID (11 chars)
   user_id: string                    // Links to auth.users.id
   name: string                       // Deck name (max 50 chars)
   que_lang: string                   // Question language code
   ans_langs: string[]                // Array of answer language
codes
   diff_level: ProficiencyLevel       // Difficulty level
   ai_prompts: AIPrompts              // JSON: AI prompts for deck
features (e.g., {"question": "prompt...", "review": "prompt..."})
   created_at: string
   updated_at: string
 }
 ```
 
 **`deck_words`** - Words in decks with spaced repetition learning 
metrics
 ```typescript
 {
   id: string                           // UUID
   deck_id: string                      // Links to decks.id
   word_id: string                      // Links to words.id
   state: number                        // Learning state (1=new, 
2=learning, 3=review, 4=relearning)
   stability: number                    // Stability metric for FSRS
 algorithm (0.0-1.0+)
   difficulty: number                   // Difficulty metric for 
FSRS algorithm (1.0-10.0)
   due: string                          // ISO timestamp - when card
 is due for review
   last_review: string | null           // ISO timestamp - last 
review
   step: number                         // Current learning step
   created_at: string
   updated_at: string
 }
 ```
 
 ### 3. Authentication & Authorization Flow
 
 #### Middleware Protection (`src/middleware.ts`)
 - Runs on every request (excludes static assets)
 - Refreshes Supabase auth tokens automatically
 - **Admin route protection**: `/admin/*` and `/words/*` routes 
redirect non-admin users to `/`
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
 ├── layout.tsx              # Root layout with SidebarProvider + 
Toaster
 ├── page.tsx                # Home page
 ├── (admin)/                # Route group (doesn't affect URL)
 │   ├── admin/page.tsx      # /admin - dashboard (admin-only)
 │   └── words/              # /words/* (admin-only)
 │       ├── list/page.tsx   # /words/list
 │       ├── generate/       # /words/generate (JSONL generation)
 │       ├── tags/           # /words/tags (tag management)
 │       └── upload/         # /words/upload (batch upload)
 ├── profile/page.tsx        # /profile - user settings
 └── decks/
     ├── page.tsx            # /decks - list user decks
     ├── [deck_id]/page.tsx  # /decks/[id] - deck detail
     └── [deck_id]/review/page.tsx # /decks/[id]/review - review 
cards
 ```
 
 Route groups `(admin)` organize files without affecting URLs. 
Middleware enforces admin protection.
 
 ## Business Logic Patterns
 
 ### Words & Collocations Workflow
 1. **AI Batch Generation**: `src/lib/ai/batch-request-builder.ts` 
generates OpenAI batch requests for JSONL files
 2. **Result Parsing**: `src/lib/words/parse-batch-results.ts` 
parses batch results into `CollocationsPattern` format
 3. **Upsert Logic**: `upsertWord()` automatically deduplicates by 
(lemma, lang) unique constraint
 4. **Tagging**: `word_tags` join table with cascade deletes for 
word categorization
 
 ### Deck Review System
 - Uses spaced repetition learning algorithm (FSRS-inspired)
 - `deck_words` table tracks individual card learning metrics
 - Cards have states: 1=new, 2=learning, 3=review, 4=relearning
 - Review logic calculates next review date based on 
stability/difficulty
 
 ### Language Configuration
 - **Mother Tongues**: `user_profiles.mother_tongues` (PostgreSQL 
array of language codes)
 - **Target Languages**: `user_profiles.target_languages` (JSON: 
`[{languageCode: "ja", proficiency: "intermediate"}]`)
 - Constants in `src/lib/constants/languages.ts`: 15+ languages with
 5 proficiency levels
 
 ### Deck ID Generation
 - Uses YouTube-like IDs: 11 character alphanumeric strings
(`A-Za-z0-9-_`)
 - Generated via `generateDeckId()` in `@/lib/decks/client-utils.ts`

 ### AI Prompts for Decks
 - Each deck has an `ai_prompts` field (JSONB) for customizable AI
prompts
 - Default prompts defined in `src/lib/constants/ai-prompts.ts`
 - **Default Question Prompt**: Template for generating flashcard
questions with AI
   - Uses template variables: `${questionLanguage}`,
`${answerLangsArray}`, `${word}`, `${collocation}`, `${difficulty}`
   - Creates sentence-based flashcards with hints and translations
 - **Default Review Prompt**: Template for reviewing student answers
   - Uses template variables: `${difficulty}`, `${wordLemma}`,
`${question}`, `${userAnswer}`, `${expectedAnswer}`
   - Provides constructive feedback and scoring (0-10)
 - Automatically applied to new decks via `getDefaultAIPrompts()`
 - Prompts can be customized per deck by passing `ai_prompts` in
`CreateDeckInput`
 - Structure: `{"question": "prompt text...", "review": "prompt
text...", [otherFeature]: "prompt..."}`

 ## Environment Setup
 
 Required `.env.local`:
 ```
 NEXT_PUBLIC_SUPABASE_URL=your-project-url
 NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
 ```
 
 ## Testing Architecture
 
 Comprehensive test suite: **141 tests, 100% pass rate**
 
 Test structure:
 ```
 tests/
 ├── mocks/
 │   └── supabase.ts          # Mock Supabase client
 └── unit/
     └── lib/
         ├── ai/
         │   └── batch-request-builder.test.ts (48 tests)
         ├── auth/
         │   └── utils.test.ts (13 tests)
         ├── tags/
         │   └── utils.test.ts (17 tests)
         └── words/
             ├── client-utils.test.ts (17 tests)
             └── parse-batch-results.test.ts (46 tests)
 ```
 
 Mock pattern for Supabase client (see `tests/mocks/supabase.ts`):
 - Mock `createClient()` to return chainable query builder
 - Mock `.from().select().eq()` patterns
 - Return test data via resolved promises
 
 ## Styling & UI Conventions
 
 ### Tailwind + CSS Variables
 - Theme colors defined in `src/app/globals.css` using CSS custom 
properties
 - Always use `cn()` utility for conditional classes:
   ```tsx
   import { cn } from "@/lib/utils"
   <div className={cn("base-class", condition && 
"conditional-class")} />
   ```
 
 ### Component Composition Pattern
 ```tsx
 // Extend base component props
 interface MyComponentProps extends React.ComponentProps<typeof 
BaseComponent> {
   customProp?: string
 }
 
 export function MyComponent({ customProp, ...props }: 
MyComponentProps) {
   return <BaseComponent {...props} />
 }
 ```
 
 ### Icons
 Use **lucide-react** exclusively:
 ```tsx
 import { Shield, Users, Settings } from "lucide-react"
 ```
 
 ### Toast Notifications
 Use Sonner for notifications (already configured in layout):
 ```tsx
 import { toast } from "sonner"
 toast.success("Action completed")
 toast.error("Something went wrong")
 ```
 
 ## Common Pitfalls to Avoid
 
 1. **Wrong Supabase client**: Using client in Server Component → 
"cookies() can only be used in Server Component"
 2. **Missing await on server client**: `createClient()` instead of 
`await createClient()` in server code
 3. **Wrong auth utility**: Importing from `utils.ts` in Server 
Component → session errors
 4. **Array field handling**: `mother_tongues`, `ans_langs`, and 
`target_languages` stored as PostgreSQL arrays/JSON - always 
validate array type before `.from().insert()`
 5. **Deck name length**: Maximum 50 characters enforced in database
 6. **Unique constraints**:
    - `words`: (lemma, lang) must be unique
    - `tags`: normalized_name must be unique
    - `word_tags`: (word_id, tag_id) must be unique
 
 ## Path Aliases
 
 TypeScript path alias configured in `tsconfig.json`:
 ```typescript
 "@/*": ["./src/*"]
 ```
 
 Use `@/` prefix for all imports from `src/` directory.
 
 ## Key Files Reference

 - Layout: `src/app/layout.tsx` (SidebarProvider + Toaster wrapper)
 - Auth middleware: `src/middleware.ts` (admin protection)
 - Admin guard: `src/lib/user-profile/server-utils.ts`
(`requireAdmin()`)
 - Type definitions: `src/lib/types/` (user-profile, words, tags,
deck, deck-words)
 - Language constants: `src/lib/constants/languages.ts`
 - AI prompts constants: `src/lib/constants/ai-prompts.ts` (default
prompts for deck features)
 - Supabase clients: `src/lib/supabase/client.ts` and
`src/lib/supabase/server.ts`