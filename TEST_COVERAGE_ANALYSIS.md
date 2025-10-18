# Test Coverage Analysis - AI FlashCards (FCIO)

**Date:** October 18, 2025  
**Current Test Status:** ❌ **NO TESTS FOUND** - Project lacks any test suite

---

## Executive Summary

The project currently has **ZERO automated tests** despite containing critical business logic across multiple layers:
- ✅ Testing infrastructure installed: `tsx` (for running TS scripts)
- ❌ Testing framework: NOT installed (Jest, Vitest, etc.)
- ❌ Test files: NONE (`*.test.ts`, `*.spec.ts`, `__tests__/`)
- ⚠️ Manual testing only: `npm run test:collocation` script exists but is exploratory

---

## Priority Areas Requiring Tests

### **TIER 1: CRITICAL (High-Risk Business Logic)**

These functions handle core data operations and have no test coverage:

#### 1. **Data Parsing & Transformation** 🔴
**File:** `src/lib/words/parse-batch-results.ts`  
**Why:** Parses OpenAI batch API responses - failures cause data loss

```typescript
export function parseBatchLine(line: string, lineNumber: number): ParsedResult | ParsedResultError
export function parseBatchFile(fileContent: string): ParsedResultType[]
export function detectLanguageFromFilename(filename: string): string | null
export function isValidParsedResult(result: ParsedResultType): result is ParsedResult
export function filterValidResults(results: ParsedResultType[]): ParsedResult[]
export function filterErrorResults(results: ParsedResultType[]): ParsedResultError[]
```

**Test Cases Needed:**
- ✓ Valid JSONL line parsing with nested object structure
- ✓ Invalid JSON syntax handling (line corruption)
- ✓ Missing/malformed nested properties
- ✓ Edge cases: empty lines, null values, type mismatches
- ✓ Batch file parsing (multi-line processing)
- ✓ Language detection from filenames: `batch_words_en.jsonl`, `batch_words_ja.jsonl`
- ✓ Type guards: `isValidParsedResult()` correctly identifies errors
- ✓ Filtering: Separate valid and error results correctly

**Impact:** Wrong parsing = corrupted word/collocation data in database

---

#### 2. **Batch Request Generation** 🔴
**File:** `src/lib/ai/batch-request-builder.ts`  
**Why:** Generates API requests to OpenAI - malformed requests fail silently

```typescript
export function buildBatchRequest(word: string, languageName: string): BatchRequest
export function requestToJsonl(request: BatchRequest): string
export function generateJsonlContent(words: string[], languageName: string): string
```

**Test Cases Needed:**
- ✓ Valid batch request structure (matches OpenAI API spec)
- ✓ Custom ID encoding (special characters, Unicode)
- ✓ JSONL formatting (newlines, no extra whitespace)
- ✓ Prompt injection prevention (user input sanitization)
- ✓ Bulk generation (1, 100, 10000 words)
- ✓ Schema validation in request body
- ✓ Language name handling (special characters, case sensitivity)

**Impact:** Failed batch submissions = API errors, wasted quota

---

#### 3. **Database CRUD Operations - Words** 🔴
**Files:** 
- `src/lib/words/client-utils.ts` (35+ functions)
- `src/lib/words/server-utils.ts` (40+ functions)

**Why:** Identical implementations in client/server - must test both paths

```typescript
// Core CRUD
createWord(input: CreateWordInput): Promise<Word>
getWordById(id: string): Promise<Word | null>
getWordByLemmaAndLang(lemma: string, lang: string): Promise<Word | null>
updateWord(id: string, input: UpdateWordInput): Promise<Word>
deleteWord(id: string): Promise<void>
deleteWordByLemmaAndLang(lemma: string, lang: string): Promise<void>

// Bulk operations
bulkCreateWords(inputs: CreateWordInput[]): Promise<Word[]>
bulkUpsertWords(inputs: CreateWordInput[]): Promise<Word[]>
upsertWord(input: CreateWordInput): Promise<Word>

// Search & filtering
searchWords(query: string, lang?: string): Promise<Word[]>
listWords(options?: ListWordsOptions): Promise<Word[]>
getWordsByLanguage(lang: string): Promise<Word[]>
getAvailableLanguages(): Promise<string[]>
checkExistingWords(lemmas: string[], lang: string): Promise<Record<string, boolean>>

// Aggregations
countWordsByLanguage(lang: string): Promise<number>
getTotalWordCount(): Promise<number>
```

**Test Cases Needed (per function):**
- ✓ Happy path: successful CRUD
- ✓ Error handling: constraint violations, connection errors
- ✓ Data validation: empty strings, null values, type mismatches
- ✓ Edge cases: very long lemmas, special Unicode characters
- ✓ Collocation merging in `upsertWord()` (complex logic at line 345)
- ✓ Bulk operations with mixed success/failure
- ✓ Search with SQL injection prevention
- ✓ Pagination: `offset`, `limit` boundary conditions

**Impact:** Data corruption, inconsistent database state, failed transactions

---

#### 4. **Tag Management System** 🔴
**Files:**
- `src/lib/tags/client-utils.ts` (197 lines)
- `src/lib/tags/server-utils.ts`
- `src/lib/tags/utils.ts` (helper functions)

**Why:** New feature (tag_management branch) lacks validation

```typescript
// Normalization
export function normalizeName(name: string): string

// CRUD
createTag(input: CreateTagInput): Promise<Tag>
getTagById(id: string): Promise<Tag | null>
getTagByName(name: string): Promise<Tag | null>
updateTag(id: string, updates: UpdateTagInput): Promise<Tag>
deleteTag(id: string): Promise<void>

// Search & lists
listTags(opts: ListTagsOptions = {}): Promise<Tag[]>

// Error handling
handleSingleQueryError(error, context): null
```

**Test Cases Needed:**
- ✓ Normalization: spaces→underscores, case conversion, Unicode handling
- ✓ Unique constraints: duplicate normalized names rejected
- ✓ CRUD operations (same as words module)
- ✓ Search with pagination and query strings
- ✓ Error handling: returns `null` for "not found" (PGRST116)
- ✓ Case-insensitive search: `.ilike.%query%`
- ✓ Created_by tracking (optional field handling)

**Impact:** Duplicate tags, search failures, inconsistent data

---

#### 5. **Authentication & Authorization** 🟡 (Medium Priority)
**Files:**
- `src/lib/auth/utils.ts` (client-side)
- `src/lib/auth/server-utils.ts` (server-side)

**Why:** Wrong implementation causes unauthorized access

```typescript
// Session checks
checkAuth(): Promise<{isAuthenticated, user, session}>
getCurrentUser(): Promise<User | null>
getCurrentUserProfile(): Promise<UserProfile | null>

// Auth operations
signIn(email, password): Promise<{success, error|data}>
signUp(email, password, username?, motherTongues?, targetLanguages?): Promise<{success, error|data}>
signOut(): Promise<void>

// Admin access
isAdmin(userId?): Promise<boolean>
requireAdmin(userId?): Promise<UserProfile>
```

**Test Cases Needed:**
- ✓ Session detection (valid/expired tokens)
- ✓ Sign-up validation: duplicate emails rejected
- ✓ Password hashing (never test actual passwords, only flow)
- ✓ Admin flag checking in `user_profiles.is_admin`
- ✓ Admin enforcement: `requireAdmin()` throws on non-admin
- ✓ Middleware protection: `/admin/*` redirects unauthorized users
- ✓ Profile creation during signup

**Impact:** Unauthorized admin access, broken auth flows

---

#### 6. **Language & Proficiency Constants** 🟡
**File:** `src/lib/constants/languages.ts`

**Why:** Used for validation throughout app

```typescript
export const LANGUAGES: Language[]
export const PROFICIENCY_LEVELS: ProficiencyLevel[]

// Helper functions (not visible in excerpt but likely needed)
export function getLanguageByCode(code: string): Language | undefined
export function getLanguageDisplayName(code: string, format?: 'name'|'nativeName'): string
```

**Test Cases Needed:**
- ✓ 15 languages present and have valid structure
- ✓ Language codes are unique and valid (ISO 639-1)
- ✓ 6 proficiency levels in correct order
- ✓ `getLanguageByCode()` returns correct language
- ✓ Invalid codes return `undefined`
- ✓ Display name formatting functions work

**Impact:** UI bugs, failed validations, localization issues

---

### **TIER 2: HIGH (Component/Integration Logic)**

#### 7. **File Upload & Download Utilities** 🟡
**File:** `src/lib/utils/file-download.ts`

```typescript
export function downloadAsJsonl(content: string, filename: string): void
export function getJsonlLineCount(content: string): number
```

**Test Cases Needed:**
- ✓ JSONL line counting (empty file, single line, multiple lines)
- ✓ Download filename validation and encoding
- ✓ Blob creation and formatting
- ✓ Special characters in filenames

---

#### 8. **Collocation Generation** 🟡
**File:** `src/lib/ai/collocation-generator.ts`

```typescript
export async function generateCollocations(word: string, lang: string): Promise<string>
```

**Test Cases Needed:**
- ✓ API key validation (error when missing)
- ✓ Prompt template substitution (word, language)
- ✓ OpenAI client initialization
- ✓ Timeout handling

---

#### 9. **React Components - Client-Side Logic** 🟡

**Components needing tests:**
- `words-list-client.tsx` - Table display, filtering, pagination
- `tags-management-client.tsx` - Tag CRUD UI
- `word-edit-dialog.tsx` - Form validation
- `profile-form.tsx` - Profile update logic
- `app-sidebar.tsx` - Admin status checking, navigation

**Test Cases Needed (using React Testing Library):**
- ✓ Component rendering with various data states
- ✓ Form submission and validation
- ✓ Error handling and display
- ✓ Admin-only UI visibility
- ✓ Loading states

---

### **TIER 3: MEDIUM (Utility Functions)**

#### 10. **Utility Functions** 🟡
**File:** `src/lib/utils.ts`

```typescript
export function cn(...inputs: ClassValue[]): string
```

**Test Cases:** 
- ✓ Tailwind class merging with conflicts
- ✓ Null/undefined handling
- ✓ Array/object spreading

---

## Testing Infrastructure Recommendations

### **Phase 1: Setup (1-2 hours)**
```bash
# Install testing framework
npm install --save-dev vitest @vitest/ui

# Install test utilities
npm install --save-dev @testing-library/react @testing-library/jest-dom
npm install --save-dev @supabase/supabase-js @testing-library/user-event

# Update package.json scripts
"test": "vitest"
"test:ui": "vitest --ui"
"test:coverage": "vitest --coverage"
```

### **Phase 2: Configuration**
- Create `vitest.config.ts` with Next.js support
- Create `tests/` directory structure
- Mock Supabase client for unit tests
- Setup test database or use in-memory SQLite for integration tests

### **Phase 3: Priority Test Files to Create**

```
tests/
├── unit/
│   ├── lib/
│   │   ├── words/
│   │   │   ├── parse-batch-results.test.ts          [HIGH PRIORITY]
│   │   │   ├── client-utils.test.ts                 [HIGH PRIORITY]
│   │   │   └── server-utils.test.ts                 [HIGH PRIORITY]
│   │   ├── ai/
│   │   │   ├── batch-request-builder.test.ts        [HIGH PRIORITY]
│   │   │   ├── collocation-generator.test.ts        [MEDIUM]
│   │   │   └── openai-client.test.ts                [MEDIUM]
│   │   ├── tags/
│   │   │   ├── utils.test.ts                        [HIGH PRIORITY]
│   │   │   ├── client-utils.test.ts                 [HIGH PRIORITY]
│   │   │   └── server-utils.test.ts                 [HIGH PRIORITY]
│   │   ├── auth/
│   │   │   ├── utils.test.ts                        [MEDIUM]
│   │   │   └── server-utils.test.ts                 [MEDIUM]
│   │   ├── constants/
│   │   │   └── languages.test.ts                    [MEDIUM]
│   │   └── utils/
│   │       └── file-download.test.ts                [MEDIUM]
│   └── components/
│       ├── words-list-client.test.tsx               [MEDIUM]
│       ├── tags-management-client.test.tsx          [MEDIUM]
│       └── app-sidebar.test.tsx                     [MEDIUM]
├── integration/
│   ├── words-workflow.test.ts                       [HIGH PRIORITY]
│   ├── tags-workflow.test.ts                        [HIGH PRIORITY]
│   ├── batch-processing.test.ts                     [HIGH PRIORITY]
│   └── auth-flow.test.ts                            [MEDIUM]
└── mocks/
    ├── supabase.mock.ts
    ├── openai.mock.ts
    └── fixtures.ts
```

---

## Test Statistics & Metrics

### **Current State**
| Metric | Value |
|--------|-------|
| Total Functions | 100+ |
| Functions with Tests | 0 |
| Test Coverage | 0% |
| Test Files | 0 |
| Lines of Code (testable) | 2,000+ |

### **Target State (Recommended)**
| Metric | Value |
|--------|-------|
| Unit Tests | 80-100 tests |
| Integration Tests | 20-30 tests |
| Coverage Target | 75%+ |
| Priority Coverage | 95%+ (Tier 1 functions) |

---

## Risk Assessment Without Tests

| Function | Risk Level | Impact if Fails | Frequency |
|----------|------------|-----------------|-----------|
| `parseBatchLine()` | 🔴 CRITICAL | Data corruption | On every batch upload |
| `buildBatchRequest()` | 🔴 CRITICAL | API failures | On every bulk operation |
| Word CRUD ops | 🔴 CRITICAL | Database inconsistency | Every user interaction |
| Tag CRUD ops | 🔴 CRITICAL | Data loss | Tag management feature |
| `isAdmin()` | 🟠 HIGH | Security breach | Every admin page load |
| Collocations generation | 🟠 HIGH | Batch failures | On demand |
| Components | 🟡 MEDIUM | UI bugs | User-facing |

---

## Next Steps

1. **Immediate (This Week):**
   - [ ] Setup Vitest + @testing-library
   - [ ] Create test infrastructure (mocks, fixtures)
   - [ ] Write 15-20 tests for `parse-batch-results.ts` (critical)

2. **Short-term (Next 2 weeks):**
   - [ ] Complete TIER 1 unit tests (60+ tests)
   - [ ] Setup integration test suite
   - [ ] Achieve 75%+ coverage on critical paths

3. **Medium-term (Next month):**
   - [ ] Expand to TIER 2 components
   - [ ] Setup CI/CD pipeline to run tests
   - [ ] Document testing patterns for team

4. **Ongoing:**
   - [ ] Require tests for all new features (TDD)
   - [ ] Maintain 75%+ coverage threshold
   - [ ] Review coverage monthly

---

## Summary Table: What Needs Testing

| Priority | Category | Files | Est. Tests | Risk |
|----------|----------|-------|-----------|------|
| 🔴 TIER 1 | Batch Processing | 3 files | 40 tests | CRITICAL |
| 🔴 TIER 1 | Word CRUD | 2 files | 50 tests | CRITICAL |
| 🔴 TIER 1 | Tag Management | 3 files | 40 tests | CRITICAL |
| 🟠 TIER 2 | Auth/Admin | 2 files | 25 tests | HIGH |
| 🟡 TIER 2 | Components | 5 files | 30 tests | HIGH |
| 🟡 TIER 3 | Utils | 4 files | 20 tests | MEDIUM |
| **TOTAL** | | **19 files** | **205 tests** | |

---

*Generated: October 18, 2025*
