# Test Case Examples & Templates

This document provides concrete test case examples for the highest-priority functions.

---

## 1. Parse Batch Results Tests

**File to test:** `src/lib/words/parse-batch-results.ts`

### Test Suite Template

```typescript
// tests/unit/lib/words/parse-batch-results.test.ts

import { describe, it, expect } from 'vitest'
import {
  parseBatchLine,
  parseBatchFile,
  detectLanguageFromFilename,
  isValidParsedResult,
  filterValidResults,
  filterErrorResults,
} from '@/lib/words/parse-batch-results'

describe('parseBatchLine', () => {
  it('should parse valid batch line with correct structure', () => {
    const validLine = JSON.stringify({
      custom_id: 'happy',
      response: {
        body: {
          usage: { total_tokens: 150 },
          output: [
            null,
            {
              content: [
                {
                  text: JSON.stringify({
                    primary: ['very happy', 'extremely happy'],
                    secondary: ['happy ending', 'happy hour'],
                  }),
                },
              ],
            },
          ],
        },
      },
    })

    const result = parseBatchLine(validLine, 1)
    
    expect(result).not.toHaveProperty('error')
    expect(result).toHaveProperty('word', 'happy')
    expect(result).toHaveProperty('tokens', 150)
    expect(result).toHaveProperty('collocations')
  })

  it('should handle invalid JSON syntax', () => {
    const invalidLine = 'not valid json at all {'

    const result = parseBatchLine(invalidLine, 5)

    expect(result).toHaveProperty('error')
    expect(result).toHaveProperty('raw', invalidLine)
    expect((result as any).error).toMatch(/Line 5/)
    expect((result as any).error).toMatch(/Invalid JSON syntax/)
  })

  it('should handle missing nested properties gracefully', () => {
    const incompleteStructure = JSON.stringify({
      custom_id: 'word',
      response: {
        body: {
          // Missing 'output' array
        },
      },
    })

    const result = parseBatchLine(incompleteStructure, 10)

    expect(result).toHaveProperty('error')
    expect((result as any).error).toMatch(/Line 10/)
  })

  it('should handle non-JSON content in nested text field', () => {
    const malformedContent = JSON.stringify({
      custom_id: 'test',
      response: {
        body: {
          usage: { total_tokens: 100 },
          output: [
            null,
            {
              content: [
                {
                  text: 'not valid json content {',
                },
              ],
            },
          ],
        },
      },
    })

    const result = parseBatchLine(malformedContent, 3)

    expect(result).toHaveProperty('error')
    expect((result as any).error).toMatch(/Invalid content JSON/)
  })

  it('should handle edge case: empty line', () => {
    const result = parseBatchLine('', 1)

    expect(result).toHaveProperty('error')
  })

  it('should handle edge case: only whitespace', () => {
    const result = parseBatchLine('   \t  ', 1)

    expect(result).toHaveProperty('error')
  })

  it('should preserve line numbers in error messages', () => {
    const result = parseBatchLine('invalid', 42)

    expect((result as any).error).toMatch(/Line 42/)
  })
})

describe('parseBatchFile', () => {
  it('should parse valid multi-line JSONL file', () => {
    const fileContent = [
      { custom_id: 'word1', response: { body: { usage: { total_tokens: 100 }, output: [null, { content: [{ text: '{}' }] }] } } },
      { custom_id: 'word2', response: { body: { usage: { total_tokens: 150 }, output: [null, { content: [{ text: '{}' }] } ] } } },
    ]
      .map(obj => JSON.stringify(obj))
      .join('\n')

    const results = parseBatchFile(fileContent)

    expect(results).toHaveLength(2)
    expect(results[0]).not.toHaveProperty('error')
    expect(results[1]).not.toHaveProperty('error')
  })

  it('should skip empty lines', () => {
    const fileContent = [
      JSON.stringify({ custom_id: 'word1', response: { body: { usage: { total_tokens: 100 }, output: [null, { content: [{ text: '{}' }] }] } } }),
      '',
      '   ',
      JSON.stringify({ custom_id: 'word2', response: { body: { usage: { total_tokens: 150 }, output: [null, { content: [{ text: '{}' }] }] } } }),
    ].join('\n')

    const results = parseBatchFile(fileContent)

    // Should have 2 valid + 2 error (empty lines)
    expect(results.length).toBeGreaterThanOrEqual(2)
  })

  it('should handle mixed valid and invalid lines', () => {
    const fileContent = [
      JSON.stringify({ custom_id: 'valid', response: { body: { usage: { total_tokens: 100 }, output: [null, { content: [{ text: '{}' }] }] } } }),
      'invalid line',
    ].join('\n')

    const results = parseBatchFile(fileContent)

    expect(results).toHaveLength(2)
    expect(results.some(r => !('error' in r))).toBe(true)
    expect(results.some(r => 'error' in r)).toBe(true)
  })
})

describe('detectLanguageFromFilename', () => {
  it('should extract language code from valid filename', () => {
    expect(detectLanguageFromFilename('batch_words_en.jsonl')).toBe('en')
    expect(detectLanguageFromFilename('batch_words_ja.jsonl')).toBe('ja')
    expect(detectLanguageFromFilename('batch_words_fa.jsonl')).toBe('fa')
  })

  it('should return null for invalid filename format', () => {
    expect(detectLanguageFromFilename('batch_results.jsonl')).toBeNull()
    expect(detectLanguageFromFilename('words_en.jsonl')).toBeNull()
    expect(detectLanguageFromFilename('random_file.txt')).toBeNull()
  })

  it('should handle edge cases', () => {
    expect(detectLanguageFromFilename('')).toBeNull()
    expect(detectLanguageFromFilename('batch_words_123.jsonl')).toBeNull() // numbers not valid
    expect(detectLanguageFromFilename('BATCH_WORDS_EN.JSONL')).toBeNull() // case sensitive
  })
})

describe('isValidParsedResult', () => {
  it('should return true for valid result', () => {
    const validResult = {
      word: 'test',
      tokens: 100,
      output: 'output',
      collocations: { primary: [] },
    }

    expect(isValidParsedResult(validResult)).toBe(true)
  })

  it('should return false for error result', () => {
    const errorResult = {
      error: 'Something went wrong',
      raw: '{}',
    }

    expect(isValidParsedResult(errorResult)).toBe(false)
  })
})

describe('filterValidResults', () => {
  it('should filter out error results', () => {
    const results = [
      { word: 'valid1', tokens: 100, output: 'text', collocations: {} },
      { error: 'Error 1', raw: '{}' },
      { word: 'valid2', tokens: 150, output: 'text', collocations: {} },
      { error: 'Error 2', raw: '{}' },
    ]

    const valid = filterValidResults(results as any)

    expect(valid).toHaveLength(2)
    expect(valid.every(r => !('error' in r))).toBe(true)
  })

  it('should return empty array if all are errors', () => {
    const results = [
      { error: 'Error 1', raw: '{}' },
      { error: 'Error 2', raw: '{}' },
    ]

    const valid = filterValidResults(results as any)

    expect(valid).toHaveLength(0)
  })
})

describe('filterErrorResults', () => {
  it('should filter out valid results', () => {
    const results = [
      { word: 'valid1', tokens: 100, output: 'text', collocations: {} },
      { error: 'Error 1', raw: '{}' },
      { word: 'valid2', tokens: 150, output: 'text', collocations: {} },
      { error: 'Error 2', raw: '{}' },
    ]

    const errors = filterErrorResults(results as any)

    expect(errors).toHaveLength(2)
    expect(errors.every(r => 'error' in r)).toBe(true)
  })
})
```

---

## 2. Batch Request Builder Tests

**File to test:** `src/lib/ai/batch-request-builder.ts`

```typescript
// tests/unit/lib/ai/batch-request-builder.test.ts

import { describe, it, expect } from 'vitest'
import {
  buildBatchRequest,
  requestToJsonl,
  generateJsonlContent,
} from '@/lib/ai/batch-request-builder'

describe('buildBatchRequest', () => {
  it('should build valid batch request structure', () => {
    const request = buildBatchRequest('happy', 'English')

    expect(request).toHaveProperty('custom_id', 'happy')
    expect(request).toHaveProperty('method', 'POST')
    expect(request.url).toContain('/v1/messages')
    expect(request.body).toHaveProperty('model')
    expect(request.body).toHaveProperty('input')
    expect(request.body).toHaveProperty('text')
  })

  it('should use custom_id as word parameter', () => {
    const word = 'policy'
    const request = buildBatchRequest(word, 'English')

    expect(request.custom_id).toBe(word)
  })

  it('should include prompt template with word and language', () => {
    const request = buildBatchRequest('食べる', 'Japanese')

    // The prompt should be somewhere in the body
    const bodyStr = JSON.stringify(request.body)
    expect(bodyStr).toContain('食べる')
    expect(bodyStr).toContain('Japanese')
  })

  it('should handle special characters in word', () => {
    const specialWords = ['café', 'naïve', 'Ñoño', '日本語', 'العربية', '中文']

    specialWords.forEach(word => {
      const request = buildBatchRequest(word, 'English')

      expect(request.custom_id).toBe(word)
      expect(() => JSON.stringify(request)).not.toThrow()
    })
  })

  it('should not contain schema injection vectors', () => {
    const maliciousWord = 'test"; DROP TABLE words; --'
    const request = buildBatchRequest(maliciousWord, 'English')

    expect(request.custom_id).toBe(maliciousWord)
    // The word is just stored as ID, not executed, so it's safe
    // But should be validated before database insertion
  })
})

describe('requestToJsonl', () => {
  it('should convert request to valid JSONL line', () => {
    const request = buildBatchRequest('test', 'English')
    const jsonl = requestToJsonl(request)

    expect(() => JSON.parse(jsonl)).not.toThrow()
    expect(jsonl).not.toContain('\n')
  })

  it('should preserve all request properties', () => {
    const request = buildBatchRequest('test', 'English')
    const jsonl = requestToJsonl(request)
    const parsed = JSON.parse(jsonl)

    expect(parsed.custom_id).toBe(request.custom_id)
    expect(parsed.method).toBe(request.method)
    expect(parsed.url).toBe(request.url)
  })
})

describe('generateJsonlContent', () => {
  it('should generate JSONL for single word', () => {
    const content = generateJsonlContent(['happy'], 'English')

    const lines = content.split('\n').filter(l => l.trim())
    expect(lines).toHaveLength(1)
    expect(() => JSON.parse(lines[0])).not.toThrow()
  })

  it('should generate JSONL for multiple words', () => {
    const words = ['happy', 'sad', 'angry', 'calm']
    const content = generateJsonlContent(words, 'English')

    const lines = content.split('\n').filter(l => l.trim())
    expect(lines).toHaveLength(4)

    lines.forEach((line, idx) => {
      const parsed = JSON.parse(line)
      expect(parsed.custom_id).toBe(words[idx])
    })
  })

  it('should handle large batch (10000 words)', () => {
    const words = Array.from({ length: 10000 }, (_, i) => `word${i}`)
    const content = generateJsonlContent(words, 'English')

    const lines = content.split('\n').filter(l => l.trim())
    expect(lines).toHaveLength(10000)
  })

  it('should not include trailing newlines', () => {
    const content = generateJsonlContent(['word1', 'word2'], 'English')

    expect(content).not.toEndWith('\n')
    expect(content).not.toMatch(/\n\n/)
  })

  it('should handle Unicode words correctly', () => {
    const words = ['café', '日本語', 'العربية']
    const content = generateJsonlContent(words, 'English')

    const lines = content.split('\n').filter(l => l.trim())
    expect(lines).toHaveLength(3)

    lines.forEach((line, idx) => {
      const parsed = JSON.parse(line)
      expect(parsed.custom_id).toBe(words[idx])
    })
  })
})
```

---

## 3. Tags Normalization Tests

**File to test:** `src/lib/tags/utils.ts`

```typescript
// tests/unit/lib/tags/utils.test.ts

import { describe, it, expect } from 'vitest'
import { normalizeName, handleSingleQueryError } from '@/lib/tags/utils'

describe('normalizeName', () => {
  it('should convert to lowercase', () => {
    expect(normalizeName('Happy')).toBe('happy')
    expect(normalizeName('ANGRY')).toBe('angry')
    expect(normalizeName('CamelCase')).toBe('camelcase')
  })

  it('should trim whitespace', () => {
    expect(normalizeName('  happy  ')).toBe('happy')
    expect(normalizeName('\t word \n')).toBe('word')
  })

  it('should replace spaces with underscores', () => {
    expect(normalizeName('happy mood')).toBe('happy_mood')
    expect(normalizeName('very happy mood')).toBe('very_happy_mood')
  })

  it('should handle multiple consecutive spaces', () => {
    expect(normalizeName('happy    mood')).toBe('happy_mood')
    expect(normalizeName('a   b   c')).toBe('a_b_c')
  })

  it('should handle mixed transformations', () => {
    expect(normalizeName('  Happy MOOD  ')).toBe('happy_mood')
    expect(normalizeName('\t  Very ANGRY Mood  \n')).toBe('very_angry_mood')
  })

  it('should preserve underscores', () => {
    expect(normalizeName('happy_mood')).toBe('happy_mood')
    expect(normalizeName('already_normal')).toBe('already_normal')
  })

  it('should handle Unicode characters', () => {
    expect(normalizeName('café')).toBe('café')
    expect(normalizeName('Ñoño')).toBe('ñoño')
    expect(normalizeName('日本語 タグ')).toBe('日本語_タグ')
  })

  it('should handle special characters', () => {
    expect(normalizeName('tag-with-dashes')).toBe('tag-with-dashes')
    expect(normalizeName('tag.with.dots')).toBe('tag.with.dots')
  })

  it('should handle edge cases', () => {
    expect(normalizeName('')).toBe('')
    expect(normalizeName(' ')).toBe('')
    expect(normalizeName('_')).toBe('_')
  })
})

describe('handleSingleQueryError', () => {
  it('should return null for "not found" error (PGRST116)', () => {
    const error = { code: 'PGRST116', message: 'No rows found' }

    const result = handleSingleQueryError(error, 'Test context')

    expect(result).toBeNull()
  })

  it('should throw for other errors', () => {
    const error = { code: 'PGRST001', message: 'Unauthorized' }

    expect(() => {
      handleSingleQueryError(error, 'Test context')
    }).toThrow()
  })

  it('should include context in error message', () => {
    const error = { code: 'PGRST001', message: 'Connection failed' }

    expect(() => {
      handleSingleQueryError(error, 'Database query')
    }).toThrow(/Database query/)

    expect(() => {
      handleSingleQueryError(error, 'Database query')
    }).toThrow(/Connection failed/)
  })

  it('should handle errors without code property', () => {
    const error = { message: 'Unknown error' }

    expect(() => {
      handleSingleQueryError(error, 'Test')
    }).toThrow()
  })

  it('should handle errors with null/undefined code', () => {
    const error1 = { code: null, message: 'Error' }
    const error2 = { code: undefined, message: 'Error' }

    expect(() => {
      handleSingleQueryError(error1 as any, 'Test')
    }).toThrow()

    expect(() => {
      handleSingleQueryError(error2 as any, 'Test')
    }).toThrow()
  })
})
```

---

## 4. Mock Setup Templates

```typescript
// tests/mocks/supabase.mock.ts

import { vi } from 'vitest'

export function createMockSupabaseClient() {
  return {
    from: vi.fn((table: string) => ({
      insert: vi.fn().mockReturnThis(),
      select: vi.fn().mockReturnThis(),
      update: vi.fn().mockReturnThis(),
      delete: vi.fn().mockReturnThis(),
      eq: vi.fn().mockReturnThis(),
      single: vi.fn().mockResolvedValue({ data: {}, error: null }),
      range: vi.fn().mockResolvedValue({ data: [], error: null }),
    })),
    auth: {
      getSession: vi.fn().mockResolvedValue({ data: { session: null }, error: null }),
      signInWithPassword: vi.fn(),
      signUp: vi.fn(),
      signOut: vi.fn(),
    },
  }
}

export function createMockOpenAIClient() {
  return {
    responses: {
      create: vi.fn().mockResolvedValue({
        output_text: JSON.stringify({ primary: [], secondary: [] }),
      }),
    },
    batches: {
      create: vi.fn().mockResolvedValue({ id: 'batch-123' }),
      retrieve: vi.fn().mockResolvedValue({ status: 'completed' }),
    },
  }
}

// Usage in tests:
// vi.mock('@/lib/supabase/client', () => ({
//   createClient: () => createMockSupabaseClient(),
// }))
```

---

## 5. Running Tests

```bash
# Run all tests
npm test

# Run specific test file
npm test parse-batch-results.test.ts

# Run with coverage
npm test -- --coverage

# Run in watch mode
npm test -- --watch

# Run UI mode for debugging
npm run test:ui
```

---

## Integration Test Example

```typescript
// tests/integration/words-workflow.test.ts

import { describe, it, expect, beforeEach } from 'vitest'
import { parseBatchFile } from '@/lib/words/parse-batch-results'
import { generateJsonlContent } from '@/lib/ai/batch-request-builder'

describe('Words Workflow - End-to-End', () => {
  it('should generate JSONL, then parse results', () => {
    // Step 1: Generate JSONL for batch submission
    const words = ['happy', 'sad', 'angry']
    const jsonl = generateJsonlContent(words, 'English')

    expect(jsonl).toBeTruthy()
    expect(jsonl.split('\n')).toHaveLength(3)

    // Step 2: Simulate batch response
    const mockResponse = [
      {
        custom_id: 'happy',
        response: {
          body: {
            usage: { total_tokens: 150 },
            output: [null, { content: [{ text: JSON.stringify({ primary: [] }) }] }],
          },
        },
      },
    ]
      .map(obj => JSON.stringify(obj))
      .join('\n')

    // Step 3: Parse results
    const results = parseBatchFile(mockResponse)

    expect(results).toHaveLength(1)
    expect(results[0]).not.toHaveProperty('error')
  })
})
```

---

These templates provide concrete patterns for:
1. Testing error cases and edge cases
2. Mocking external dependencies (Supabase, OpenAI)
3. Testing data transformations
4. Integration testing workflows

Use these as starting points for comprehensive test coverage.
