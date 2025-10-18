import { describe, it, expect } from 'vitest'
import { buildBatchRequest, requestToJsonl, generateJsonlContent } from '@/lib/ai/batch-request-builder'
import { BATCH_CONFIG, COLLOCATION_SCHEMA } from '@/lib/ai/batch-config'

describe('batch-request-builder', () => {
    describe('buildBatchRequest', () => {
        it('should generate a valid batch request structure', () => {
            const word = 'run'
            const languageName = 'English'
            const request = buildBatchRequest(word, languageName)

            // Check top-level structure
            expect(request).toHaveProperty('custom_id')
            expect(request).toHaveProperty('method')
            expect(request).toHaveProperty('url')
            expect(request).toHaveProperty('body')
        })

        it('should set correct method and URL', () => {
            const request = buildBatchRequest('test', 'English')

            expect(request.method).toBe('POST')
            expect(request.url).toBe(BATCH_CONFIG.API_URL)
        })

        it('should use word as custom_id', () => {
            const word = 'example'
            const request = buildBatchRequest(word, 'English')

            expect(request.custom_id).toBe(word)
        })

        it('should handle special characters in custom_id', () => {
            const specialWords = ['café', 'naïve', '日本語', 'Ñoño', 'مثال']
            specialWords.forEach((word) => {
                const request = buildBatchRequest(word, 'Test Language')
                expect(request.custom_id).toBe(word)
            })
        })

        it('should set correct model in body', () => {
            const request = buildBatchRequest('word', 'English')

            expect(request.body.model).toBe(BATCH_CONFIG.MODEL)
        })

        it('should include prompt with correct structure', () => {
            const word = 'run'
            const languageName = 'English'
            const request = buildBatchRequest(word, languageName)

            expect(request.body).toHaveProperty('input')
            const body = request.body as Record<string, unknown>
            expect(Array.isArray(body.input)).toBe(true)
            const input = body.input as Array<unknown>
            expect(input.length).toBeGreaterThan(0)
        })

        it('should include user role and input_text type in prompt', () => {
            const request = buildBatchRequest('word', 'English')
            const input = request.body.input as Array<{ role: string; content: Array<{ type: string }> }>

            expect(input[0].role).toBe('user')
            expect(input[0].content[0].type).toBe('input_text')
        })

        it('should pass word and language to collocation prompt template', () => {
            const word = 'special_word'
            const languageName = 'French'
            const request = buildBatchRequest(word, languageName)

            const promptText = (request.body.input as Array<{ content: Array<{ text: string }> }>)[0].content[0].text
            expect(promptText).toContain(word)
            expect(promptText).toContain(languageName)
        })

        it('should include text format configuration with schema', () => {
            const request = buildBatchRequest('word', 'English')
            const body = request.body as Record<string, unknown>

            expect(body).toHaveProperty('text')
            const text = body.text as Record<string, unknown>
            expect(text).toHaveProperty('format')
            const format = text.format as Record<string, unknown>
            expect(format.type).toBe(BATCH_CONFIG.TEXT_FORMAT.type)
            expect(format.name).toBe(BATCH_CONFIG.TEXT_FORMAT.name)
            expect(format.schema).toEqual(COLLOCATION_SCHEMA)
        })

        it('should set verbosity to high', () => {
            const request = buildBatchRequest('word', 'English')
            const body = request.body as Record<string, unknown>
            const text = body.text as Record<string, unknown>

            expect(text.verbosity).toBe('high')
        })

        it('should include reasoning configuration', () => {
            const request = buildBatchRequest('word', 'English')

            expect(request.body.reasoning).toEqual(BATCH_CONFIG.REASONING)
        })

        it('should include tools configuration', () => {
            const request = buildBatchRequest('word', 'English')

            expect(request.body.tools).toEqual(BATCH_CONFIG.TOOLS)
        })

        it('should include store flag', () => {
            const request = buildBatchRequest('word', 'English')

            expect(request.body).toHaveProperty('store')
            expect(request.body.store).toBe(BATCH_CONFIG.STORE)
        })

        it('should include include array', () => {
            const request = buildBatchRequest('word', 'English')

            expect(request.body).toHaveProperty('include')
            expect(Array.isArray(request.body.include)).toBe(true)
            expect(request.body.include).toEqual(BATCH_CONFIG.INCLUDE)
        })

        it('should handle language names with special characters', () => {
            const languageNames = ['English', '中文', 'Français', 'العربية', 'Ελληνικά']
            languageNames.forEach((langName) => {
                const request = buildBatchRequest('word', langName)
                expect(request.body).toBeDefined()
                expect(request.body.model).toBe(BATCH_CONFIG.MODEL)
            })
        })

        it('should handle empty string word (edge case)', () => {
            const request = buildBatchRequest('', 'English')
            expect(request.custom_id).toBe('')
        })

        it('should handle very long word names', () => {
            const longWord = 'a'.repeat(500)
            const request = buildBatchRequest(longWord, 'English')
            expect(request.custom_id).toBe(longWord)
        })

        it('should not mutate input parameters', () => {
            const word = 'test'
            const lang = 'English'
            const wordOriginal = word
            const langOriginal = lang

            buildBatchRequest(word, lang)

            expect(word).toBe(wordOriginal)
            expect(lang).toBe(langOriginal)
        })

        it('should handle prompt injection attempts in word parameter', () => {
            const maliciousWord = '") -> print("hacked'
            const request = buildBatchRequest(maliciousWord, 'English')

            // Should treat it as a literal word, not code
            expect(request.custom_id).toBe(maliciousWord)
            // Verify body is still valid JSON-serializable
            expect(() => JSON.stringify(request)).not.toThrow()
        })

        it('should handle prompt injection attempts in language parameter', () => {
            const maliciousLang = '\'; DROP TABLE users; --'
            const request = buildBatchRequest('word', maliciousLang)

            expect(request.body).toBeDefined()
            // Should not execute any code
            expect(() => JSON.stringify(request)).not.toThrow()
        })
    })

    describe('requestToJsonl', () => {
        it('should convert request to valid JSON string', () => {
            const request = buildBatchRequest('word', 'English')
            const jsonl = requestToJsonl(request)

            expect(typeof jsonl).toBe('string')
            // Should be valid JSON
            const parsed = JSON.parse(jsonl)
            expect(parsed).toEqual(request)
        })

        it('should not include trailing newlines', () => {
            const request = buildBatchRequest('word', 'English')
            const jsonl = requestToJsonl(request)

            expect(jsonl.match(/\n$/)).toBeNull()
        })

        it('should produce deterministic output', () => {
            const request = buildBatchRequest('word', 'English')
            const jsonl1 = requestToJsonl(request)
            const jsonl2 = requestToJsonl(request)

            expect(jsonl1).toBe(jsonl2)
        })

        it('should handle requests with special characters in custom_id', () => {
            const request = buildBatchRequest('café', 'English')
            const jsonl = requestToJsonl(request)
            const parsed = JSON.parse(jsonl)

            expect(parsed.custom_id).toBe('café')
        })

        it('should properly escape nested strings', () => {
            const request = buildBatchRequest('word"with"quotes', 'English')
            const jsonl = requestToJsonl(request)

            // Should be valid JSON despite quotes
            const parsed = JSON.parse(jsonl)
            expect(parsed.custom_id).toBe('word"with"quotes')
        })

        it('should not produce extra whitespace', () => {
            const request = buildBatchRequest('word', 'English')
            const jsonl = requestToJsonl(request)

            // Should be single-line JSON
            expect(jsonl.split('\n').length).toBe(1)
        })
    })

    describe('generateJsonlContent', () => {
        it('should generate JSONL from single word', () => {
            const words = ['word']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(1)
        })

        it('should generate JSONL from multiple words', () => {
            const words = ['run', 'walk', 'jump']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(3)
        })

        it('should join lines with newlines', () => {
            const words = ['word1', 'word2']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            expect(jsonl).toContain('\n')
        })

        it('should generate valid JSONL format', () => {
            const words = ['run', 'walk', 'jump']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            lines.forEach((line) => {
                const parsed = JSON.parse(line)
                expect(parsed).toHaveProperty('custom_id')
                expect(parsed).toHaveProperty('method')
                expect(parsed).toHaveProperty('url')
                expect(parsed).toHaveProperty('body')
            })
        })

        it('should preserve word order', () => {
            const words = ['first', 'second', 'third']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            const customIds = lines.map((line) => JSON.parse(line).custom_id)

            expect(customIds).toEqual(words)
        })

        it('should handle empty array', () => {
            const words: string[] = []
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(0)
        })

        it('should handle large bulk operations (100 words)', () => {
            const words = Array.from({ length: 100 }, (_, i) => `word${i}`)
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(100)
        })

        it('should handle large bulk operations (10000 words)', () => {
            const words = Array.from({ length: 10000 }, (_, i) => `word${i}`)
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(10000)
        })

        it('should handle words with special characters in bulk', () => {
            const words = ['café', 'naïve', '日本語', 'Ñoño', 'مثال']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            const customIds = lines.map((line) => JSON.parse(line).custom_id)

            expect(customIds).toEqual(words)
        })

        it('should use correct language for all requests', () => {
            const words = ['word1', 'word2', 'word3']
            const language = 'French'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            lines.forEach((line) => {
                const request = JSON.parse(line)
                const promptText = request.body.input[0].content[0].text

                expect(promptText).toContain(language)
            })
        })

        it('should not include extra newlines between entries', () => {
            const words = ['word1', 'word2']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            // Split on newlines and filter empty lines
            const lines = jsonl.split('\n')
            // Should have exactly 2 entries + potential empty line at end
            expect(lines.length).toBeLessThanOrEqual(3)
            // Should have at least 2 entries
            expect(lines.length).toBeGreaterThanOrEqual(2)
        })

        it('should handle words with newline characters', () => {
            const words = ['word\nwith\nnewline']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            const parsed = JSON.parse(lines[0])

            // Custom ID should preserve the newlines in JSON
            expect(parsed.custom_id).toContain('word')
        })

        it('should generate valid schema for all requests', () => {
            const words = ['run', 'walk']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            lines.forEach((line) => {
                const request = JSON.parse(line)
                expect(request.body.text.format.schema).toEqual(COLLOCATION_SCHEMA)
            })
        })

        it('should maintain body structure consistency', () => {
            const words = ['word1', 'word2']
            const language = 'English'
            const jsonl = generateJsonlContent(words, language)

            const lines = jsonl.split('\n').filter((line) => line.length > 0)
            const bodies = lines.map((line) => JSON.parse(line).body)

            // All bodies should have the same keys
            const keys1 = Object.keys(bodies[0]).sort()
            const keys2 = Object.keys(bodies[1]).sort()

            expect(keys1).toEqual(keys2)
        })
    })

    describe('Integration: end-to-end batch request generation', () => {
        it('should generate complete valid batch file content', () => {
            const words = ['apple', 'book', 'cat']
            const language = 'English'
            const content = generateJsonlContent(words, language)

            // Verify file format
            const lines = content.split('\n').filter((line) => line.length > 0)
            expect(lines.length).toBe(3)

            // Verify each line is valid and has expected structure
            const requests = lines.map((line) => JSON.parse(line))
            requests.forEach((req, index) => {
                expect(req.custom_id).toBe(words[index])
                expect(req.method).toBe('POST')
                expect(req.url).toBe('/v1/responses')
            })
        })

        it('should produce output that matches OpenAI batch API spec', () => {
            const words = ['test']
            const language = 'English'
            const content = generateJsonlContent(words, language)

            const line = content.split('\n')[0]
            const request = JSON.parse(line)

            // OpenAI batch API spec requirements
            expect(request).toHaveProperty('custom_id')
            expect(typeof request.custom_id).toBe('string')
            expect(request.custom_id.length).toBeGreaterThan(0)

            expect(request.method).toBe('POST')
            expect(request.url).toBe('/v1/responses')
            expect(request).toHaveProperty('body')
            expect(request.body.model).toBeDefined()
        })

        it('should handle mixed bulk and single operations consistently', () => {
            const singleWord = buildBatchRequest('single', 'English')
            const bulkWords = generateJsonlContent(['bulk1', 'bulk2'], 'English')

            const singleJsonl = requestToJsonl(singleWord)
            const bulkLines = bulkWords.split('\n').filter((line) => line.length > 0)

            // Both should have same structure
            const singleParsed = JSON.parse(singleJsonl)
            const bulkParsed = bulkLines.map((line) => JSON.parse(line))

            expect(Object.keys(singleParsed).sort()).toEqual(
                Object.keys(bulkParsed[0]).sort()
            )
        })
    })

    describe('Edge cases and error prevention', () => {
        it('should handle unicode normalization safely', () => {
            // Different Unicode representations of é
            const word1 = 'café' // composed form
            const word2 = 'cafe\u0301' // decomposed form

            const request1 = buildBatchRequest(word1, 'English')
            const request2 = buildBatchRequest(word2, 'English')

            // Both should produce valid requests (they may differ but both valid)
            expect(request1.custom_id).toBe(word1)
            expect(request2.custom_id).toBe(word2)
        })

        it('should never produce invalid JSON regardless of input', () => {
            const maliciousInputs = [
                'word"',
                'word\\',
                'word\n',
                'word\r\n',
                'word\t',
                'word\u0000',
                '{"test":1}',
                '"; DROP TABLE--',
            ]

            maliciousInputs.forEach((word) => {
                const request = buildBatchRequest(word, 'English')
                const jsonl = requestToJsonl(request)

                // Should never throw when parsing
                expect(() => JSON.parse(jsonl)).not.toThrow()
            })
        })

        it('should handle batch generation with concurrent calls', () => {
            const promises = Array.from({ length: 5 }, (_, i) =>
                Promise.resolve(buildBatchRequest(`word${i}`, 'English'))
            )

            return Promise.all(promises).then((results) => {
                expect(results.length).toBe(5)
                results.forEach((req) => {
                    expect(req.body).toBeDefined()
                })
            })
        })

        it('should not exceed reasonable size limits for single request', () => {
            const request = buildBatchRequest('word', 'English')
            const jsonl = requestToJsonl(request)

            // Single request should be reasonably sized (less than 100KB)
            expect(jsonl.length).toBeLessThan(100000)
        })

        it('should handle batch with 10000 words within reasonable time', () => {
            const words = Array.from({ length: 10000 }, (_, i) => `word${i}`)
            const language = 'English'

            const startTime = Date.now()
            const jsonl = generateJsonlContent(words, language)
            const endTime = Date.now()

            // Should complete in reasonable time (less than 5 seconds for 10k words)
            expect(endTime - startTime).toBeLessThan(5000)
            expect(jsonl.length).toBeGreaterThan(0)
        })
    })
})
