# Quick Test Reference

## Running Tests

### Run all tests (watch mode)
```bash
npm test
```

### Run tests once (CI mode)
```bash
npm test -- --run
```

### Run specific test file
```bash
npm test -- tests/unit/lib/words/parse-batch-results.test.ts
```

### Run tests with UI dashboard
```bash
npm run test:ui
```

### Generate coverage report
```bash
npm run test:coverage
```

## Test Files Location

```
tests/
├── mocks/
│   └── supabase.ts              # Supabase client mocks
├── fixtures/
│   └── batch-results.ts         # Test data for batch processing
└── unit/
    ├── lib/
    │   ├── ai/
    │   │   └── batch-request-builder.test.ts    (48 tests)
    │   ├── words/
    │   │   ├── parse-batch-results.test.ts      (46 tests)
    │   │   └── client-utils.test.ts             (17 tests)
    │   ├── tags/
    │   │   └── utils.test.ts                    (17 tests)
    │   └── auth/
    │       └── utils.test.ts                    (13 tests)
```

## Current Test Coverage

| Module | Tests | Status |
|--------|-------|--------|
| Batch Request Builder | 48 | ✅ PASS |
| Parse Batch Results | 46 | ✅ PASS |
| Words Client Utils | 17 | ✅ PASS |
| Tags Utils | 17 | ✅ PASS |
| Auth Utils | 13 | ✅ PASS |
| **TOTAL** | **141** | **✅ ALL PASS** |

## Test Execution Time

- Full suite: ~959ms
- Average per test: ~6.8ms

## Key Test Features

- ✅ Comprehensive mocking of Supabase client
- ✅ Test fixtures for complex nested JSON structures
- ✅ Error scenario coverage (PGRST116, connection errors, etc.)
- ✅ Edge case testing (Unicode, special chars, empty values)
- ✅ Type-safe test implementations
- ✅ Async/await pattern support
- ✅ Isolated tests (no dependencies between tests)

## Common Test Patterns Used

### Mocking Supabase
```typescript
const mockQueryBuilder = createMockQueryBuilder()
mockQueryBuilder.single.mockResolvedValue({ data: mockWord, error: null })
const mockSupabase = { from: vi.fn().mockReturnValue(mockQueryBuilder) }
vi.mocked(createClient).mockReturnValue(mockSupabase as any)
```

### Testing Async Functions
```typescript
it("should test async function", async () => {
    const result = await asyncFunction()
    expect(result).toBe(expectedValue)
})
```

### Testing Errors
```typescript
it("should handle errors", async () => {
    await expect(functionThatThrows()).rejects.toThrow("Error message")
})
```

## Adding New Tests

1. Create a `.test.ts` file in `tests/unit/lib/[module]/`
2. Import testing utilities from vitest
3. Import the module to test
4. Use existing fixtures from `tests/fixtures/` or create new ones
5. Mock dependencies using `vi.mock()` and `vi.mocked()`
6. Write test cases with descriptive names
7. Run `npm test` to verify

Example:
```typescript
import { describe, it, expect, vi } from "vitest"
import { createClient } from "@/lib/supabase/client"
import * as myUtils from "@/lib/my-utils"

vi.mock("@/lib/supabase/client")

describe("myFunction", () => {
    it("should do something", async () => {
        // Setup mocks
        const mockSupabase = { /* ... */ }
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)
        
        // Test
        const result = await myUtils.myFunction()
        
        // Assert
        expect(result).toEqual(expected)
    })
})
```

## Troubleshooting

### Tests not running
- Make sure `npm install` was run to install vitest
- Check that test files end with `.test.ts`
- Verify file paths in imports use the `@/` alias

### Mock not working
- Ensure `vi.mock()` is called at the top level (not inside test functions)
- Check that the mock path matches the actual import path
- Use `vi.mocked()` to access mocked functions

### Async issues
- Use `async/await` in test functions
- Make sure to `await` async calls
- Use `resolves` or `rejects` with expect for promises

## Documentation

- Full implementation details: `TEST_SUITE_IMPLEMENTATION.md`
- Analysis and recommendations: `TEST_COVERAGE_ANALYSIS.md`
