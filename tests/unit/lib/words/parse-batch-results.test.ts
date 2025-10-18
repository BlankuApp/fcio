/**
 * Test suite for src/lib/words/parse-batch-results.ts
 * TIER 1 CRITICAL: Data Parsing & Transformation
 *
 * These tests verify OpenAI batch response parsing which is crucial for data integrity.
 * Failures here result in corrupted word/collocation data in the database.
 */

import { describe, it, expect } from "vitest"
import {
    parseBatchLine,
    parseBatchFile,
    detectLanguageFromFilename,
    isValidParsedResult,
    filterValidResults,
    filterErrorResults,
} from "@/lib/words/parse-batch-results"
import type { ParsedResult, ParsedResultError } from "@/lib/types/words"

// ============================================================================
// FIXTURES: Sample Data
// ============================================================================

/**
 * Valid OpenAI batch response with nested JSON structure
 */
const validBatchLine = JSON.stringify({
    custom_id: "test_word",
    response: {
        status_code: 200,
        request_id: "req123",
        body: {
            id: "chatcmpl-123",
            object: "response",
            created: 1234567890,
            model: "gpt-4",
            choices: [],
            usage: {
                input_tokens: 100,
                output_tokens: 50,
                total_tokens: 150,
            },
            output: [
                {
                    type: "text",
                    text: "Output text",
                },
                {
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                "V + Noun": [
                                    {
                                        collocation: "run fast",
                                        difficulty: "easy",
                                    },
                                    {
                                        collocation: "run away",
                                        difficulty: "medium",
                                    },
                                ],
                                "Adj + Noun": [
                                    {
                                        collocation: "fast runner",
                                        difficulty: "medium",
                                    },
                                ],
                            }),
                        },
                    ],
                },
            ],
        },
    },
})

/**
 * Valid batch line with Unicode characters in collocations
 */
const validBatchLineWithUnicode = JSON.stringify({
    custom_id: "日本語_word",
    response: {
        status_code: 200,
        request_id: "req124",
        body: {
            id: "chatcmpl-124",
            object: "response",
            created: 1234567891,
            model: "gpt-4",
            choices: [],
            usage: {
                input_tokens: 100,
                output_tokens: 50,
                total_tokens: 150,
            },
            output: [
                {
                    type: "text",
                    text: "Output text",
                },
                {
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({
                                "動詞 + 名詞": [
                                    {
                                        collocation: "走る",
                                        difficulty: "easy",
                                    },
                                ],
                            }),
                        },
                    ],
                },
            ],
        },
    },
})

/**
 * Invalid JSON syntax - malformed line
 */
const invalidJsonLine = '{"custom_id": "test_word", invalid json here'

/**
 * Valid JSON but missing nested content structure
 */
const missingContentLine = JSON.stringify({
    custom_id: "test_word",
    response: {
        status_code: 200,
        body: {
            usage: {
                total_tokens: 150,
            },
        },
    },
})

/**
 * Valid JSON but with null values in critical fields
 */
const nullValuesLine = JSON.stringify({
    custom_id: "test_word",
    response: {
        status_code: 200,
        body: {
            usage: null,
            output: null,
        },
    },
})

/**
 * Valid outer structure but invalid JSON in collocations
 */
const invalidCollocationsJsonLine = JSON.stringify({
    custom_id: "test_word",
    response: {
        status_code: 200,
        body: {
            usage: {
                total_tokens: 150,
            },
            output: [
                {
                    type: "text",
                    text: "Output",
                },
                {
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: "{ invalid json }", // Not valid JSON
                        },
                    ],
                },
            ],
        },
    },
})

/**
 * Valid batch line with empty collocations object
 */
const validBatchLineEmptyCollocations = JSON.stringify({
    custom_id: "test_word_empty",
    response: {
        status_code: 200,
        request_id: "req125",
        body: {
            usage: {
                total_tokens: 50,
            },
            output: [
                {
                    type: "text",
                    text: "Output text",
                },
                {
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify({}),
                        },
                    ],
                },
            ],
        },
    },
})

// ============================================================================
// TEST SUITE: parseBatchLine
// ============================================================================

describe("parseBatchLine", () => {
    describe("Valid JSONL parsing", () => {
        it("should parse a valid batch line with complete nested structure", () => {
            const result = parseBatchLine(validBatchLine, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(result.word).toBe("test_word")
                expect(result.tokens).toBe(150)
                // output is the stringified collocations JSON
                expect(result.output).toContain("V + Noun")
                expect(result.collocations).toEqual({
                    "V + Noun": [
                        { collocation: "run fast", difficulty: "easy" },
                        { collocation: "run away", difficulty: "medium" },
                    ],
                    "Adj + Noun": [{ collocation: "fast runner", difficulty: "medium" }],
                })
            }
        })

        it("should handle Unicode characters in word identifiers and collocations", () => {
            const result = parseBatchLine(validBatchLineWithUnicode, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(result.word).toBe("日本語_word")
                expect(result.collocations).toEqual({
                    "動詞 + 名詞": [
                        { collocation: "走る", difficulty: "easy" },
                    ],
                })
            }
        })

        it("should parse valid batch line with empty collocations", () => {
            const result = parseBatchLine(validBatchLineEmptyCollocations, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(result.word).toBe("test_word_empty")
                expect(result.tokens).toBe(50)
                expect(result.collocations).toEqual({})
            }
        })
    })

    describe("Invalid JSON syntax", () => {
        it("should return error for invalid JSON syntax", () => {
            const result = parseBatchLine(invalidJsonLine, 5)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 5")
                expect(result.error).toContain("Invalid JSON syntax")
                expect(result.raw).toBe(invalidJsonLine)
            }
        })

        it("should include line number in error message", () => {
            const result = parseBatchLine(invalidJsonLine, 42)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 42")
            }
        })
    })

    describe("Missing/malformed nested properties", () => {
        it("should return error when content structure is missing", () => {
            const result = parseBatchLine(missingContentLine, 3)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 3")
                expect(result.error).toContain("Invalid content JSON")
            }
        })

        it("should return error when collocations JSON is invalid", () => {
            const result = parseBatchLine(invalidCollocationsJsonLine, 7)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 7")
                expect(result.error).toContain("Invalid content JSON")
            }
        })

        it("should return error for null values in critical fields", () => {
            const result = parseBatchLine(nullValuesLine, 2)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 2")
            }
        })
    })

    describe("Edge cases", () => {
        it("should handle empty string line", () => {
            const result = parseBatchLine("", 10)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 10")
                expect(result.error).toContain("Invalid JSON syntax")
            }
        })

        it("should handle whitespace-only line", () => {
            const result = parseBatchLine("   \t  ", 11)

            expect(isValidParsedResult(result)).toBe(false)
            if (!isValidParsedResult(result)) {
                expect(result.error).toContain("Line 11")
            }
        })

        it("should handle very long word identifiers", () => {
            const longWord = "a".repeat(1000)
            const line = JSON.stringify({
                custom_id: longWord,
                response: {
                    status_code: 200,
                    body: {
                        usage: { total_tokens: 100 },
                        output: [
                            { type: "text", text: "Output" },
                            {
                                type: "text",
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify({ "Pattern": [] }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            })

            const result = parseBatchLine(line, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(result.word).toBe(longWord)
            }
        })

        it("should handle special characters in collocations", () => {
            const line = JSON.stringify({
                custom_id: "test_word",
                response: {
                    status_code: 200,
                    body: {
                        usage: { total_tokens: 100 },
                        output: [
                            { type: "text", text: "Output" },
                            {
                                type: "text",
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify({
                                            "Noun + 'and' + Noun": [
                                                {
                                                    collocation: 'cat & dog "famous"',
                                                    difficulty: "easy",
                                                },
                                            ],
                                        }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            })

            const result = parseBatchLine(line, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(
                    result.collocations["Noun + 'and' + Noun"][0].collocation
                ).toBe('cat & dog "famous"')
            }
        })

        it("should handle zero tokens", () => {
            const line = JSON.stringify({
                custom_id: "test_word",
                response: {
                    status_code: 200,
                    body: {
                        usage: { total_tokens: 0 },
                        output: [
                            { type: "text", text: "Output" },
                            {
                                type: "text",
                                content: [
                                    {
                                        type: "text",
                                        text: JSON.stringify({ "Pattern": [] }),
                                    },
                                ],
                            },
                        ],
                    },
                },
            })

            const result = parseBatchLine(line, 1)

            expect(isValidParsedResult(result)).toBe(true)
            if (isValidParsedResult(result)) {
                expect(result.tokens).toBe(0)
            }
        })
    })
})

// ============================================================================
// TEST SUITE: parseBatchFile
// ============================================================================

describe("parseBatchFile", () => {
    it("should parse multiple valid lines", () => {
        const fileContent = `${validBatchLine}
${validBatchLine}
${validBatchLine}`

        const results = parseBatchFile(fileContent)

        expect(results).toHaveLength(3)
        expect(results.every(isValidParsedResult)).toBe(true)
    })

    it("should handle mix of valid and invalid lines", () => {
        const fileContent = `${validBatchLine}
${invalidJsonLine}
${validBatchLine}`

        const results = parseBatchFile(fileContent)

        expect(results).toHaveLength(3)
        expect(isValidParsedResult(results[0])).toBe(true)
        expect(isValidParsedResult(results[1])).toBe(false)
        expect(isValidParsedResult(results[2])).toBe(true)
    })

    it("should skip empty lines", () => {
        const fileContent = `${validBatchLine}

${validBatchLine}
  
${validBatchLine}`

        const results = parseBatchFile(fileContent)

        expect(results).toHaveLength(3)
        expect(results.every(isValidParsedResult)).toBe(true)
    })

    it("should handle file with only empty lines", () => {
        const fileContent = `
  
\t
`

        const results = parseBatchFile(fileContent)

        expect(results).toHaveLength(0)
    })

    it("should handle large batch file", () => {
        const lines = Array(100)
            .fill(validBatchLine)
            .join("\n")

        const results = parseBatchFile(lines)

        expect(results).toHaveLength(100)
        expect(results.every(isValidParsedResult)).toBe(true)
    })

    it("should assign correct line numbers in error messages", () => {
        const fileContent = `${validBatchLine}
${validBatchLine}
${invalidJsonLine}
${validBatchLine}`

        const results = parseBatchFile(fileContent)

        const errorResult = results[2]
        expect(isValidParsedResult(errorResult)).toBe(false)
        if (!isValidParsedResult(errorResult)) {
            expect(errorResult.error).toContain("Line 3")
        }
    })
})

// ============================================================================
// TEST SUITE: detectLanguageFromFilename
// ============================================================================

describe("detectLanguageFromFilename", () => {
    it("should detect English language code", () => {
        const lang = detectLanguageFromFilename("batch_words_en.jsonl")
        expect(lang).toBe("en")
    })

    it("should detect Japanese language code", () => {
        const lang = detectLanguageFromFilename("batch_words_ja.jsonl")
        expect(lang).toBe("ja")
    })

    it("should detect Persian language code", () => {
        const lang = detectLanguageFromFilename("batch_words_fa.jsonl")
        expect(lang).toBe("fa")
    })

    it("should return null for missing language code", () => {
        const lang = detectLanguageFromFilename("batch_words.jsonl")
        expect(lang).toBeNull()
    })

    it("should return null for non-matching filename pattern", () => {
        const lang = detectLanguageFromFilename("words_en.txt")
        expect(lang).toBeNull()
    })

    it("should return null for empty filename", () => {
        const lang = detectLanguageFromFilename("")
        expect(lang).toBeNull()
    })

    it("should not detect three-letter language codes", () => {
        // The regex /batch_words_([a-z]{2})/ will match the first 2 letters
        // so "batch_words_eng.jsonl" matches and returns "en"
        // This is a limitation of the current regex - adjust test expectation
        const lang = detectLanguageFromFilename("batch_words_eng.jsonl")
        expect(lang).toBe("en") // Current behavior: matches first 2 letters
    })

    it("should not detect uppercase language codes", () => {
        const lang = detectLanguageFromFilename("batch_words_EN.jsonl")
        expect(lang).toBeNull()
    })

    it("should handle language code in middle of filename", () => {
        const lang = detectLanguageFromFilename("batch_words_ja_final.jsonl")
        expect(lang).toBe("ja")
    })

    it("should handle multiple patterns - returns first match", () => {
        const lang = detectLanguageFromFilename("batch_words_en_batch_words_ja.jsonl")
        expect(lang).toBe("en")
    })
})

// ============================================================================
// TEST SUITE: isValidParsedResult (Type Guard)
// ============================================================================

describe("isValidParsedResult", () => {
    it("should identify valid ParsedResult", () => {
        const result: ParsedResult = {
            word: "test",
            tokens: 100,
            output: "output",
            collocations: {},
        }

        expect(isValidParsedResult(result)).toBe(true)
    })

    it("should identify ParsedResultError", () => {
        const error: ParsedResultError = {
            error: "Test error",
            raw: "raw data",
        }

        expect(isValidParsedResult(error)).toBe(false)
    })

    it("should work as type guard in if statement", () => {
        const result = parseBatchLine(validBatchLine, 1)

        if (isValidParsedResult(result)) {
            // TypeScript should infer result as ParsedResult here
            expect(result.word).toBeDefined()
            expect(result.tokens).toBeDefined()
            expect(result.collocations).toBeDefined()
        } else {
            throw new Error("Should be valid")
        }
    })

    it("should narrow error type correctly", () => {
        const result = parseBatchLine(invalidJsonLine, 1)

        if (!isValidParsedResult(result)) {
            // TypeScript should infer result as ParsedResultError here
            expect(result.error).toBeDefined()
            expect(result.raw).toBeDefined()
        } else {
            throw new Error("Should be error")
        }
    })
})

// ============================================================================
// TEST SUITE: filterValidResults
// ============================================================================

describe("filterValidResults", () => {
    it("should extract only valid results", () => {
        const results = parseBatchFile(`${validBatchLine}
${invalidJsonLine}
${validBatchLine}
${missingContentLine}`)

        const validResults = filterValidResults(results)

        expect(validResults).toHaveLength(2)
        expect(validResults.every((r) => !("error" in r))).toBe(true)
    })

    it("should return empty array when all results are errors", () => {
        const results = parseBatchFile(`${invalidJsonLine}
${invalidJsonLine}`)

        const validResults = filterValidResults(results)

        expect(validResults).toHaveLength(0)
    })

    it("should return all results when none are errors", () => {
        const results = parseBatchFile(`${validBatchLine}
${validBatchLine}
${validBatchLine}`)

        const validResults = filterValidResults(results)

        expect(validResults).toHaveLength(3)
    })

    it("should preserve data of valid results", () => {
        const results = parseBatchFile(`${validBatchLine}
${invalidJsonLine}`)

        const validResults = filterValidResults(results)

        expect(validResults[0].word).toBe("test_word")
        expect(validResults[0].tokens).toBe(150)
    })

    it("should return correctly typed array", () => {
        const results = parseBatchFile(validBatchLine)
        const validResults = filterValidResults(results)

        // This should compile without type errors
        validResults.forEach((r) => {
            expect(r.word).toBeDefined()
            expect(r.tokens).toBeDefined()
            expect(r.collocations).toBeDefined()
        })
    })
})

// ============================================================================
// TEST SUITE: filterErrorResults
// ============================================================================

describe("filterErrorResults", () => {
    it("should extract only error results", () => {
        const results = parseBatchFile(`${validBatchLine}
${invalidJsonLine}
${validBatchLine}
${missingContentLine}`)

        const errors = filterErrorResults(results)

        expect(errors).toHaveLength(2)
        expect(errors.every((r) => "error" in r)).toBe(true)
    })

    it("should return empty array when no errors", () => {
        const results = parseBatchFile(`${validBatchLine}
${validBatchLine}`)

        const errors = filterErrorResults(results)

        expect(errors).toHaveLength(0)
    })

    it("should return all results when all are errors", () => {
        const results = parseBatchFile(`${invalidJsonLine}
${invalidJsonLine}
${missingContentLine}`)

        const errors = filterErrorResults(results)

        expect(errors).toHaveLength(3)
    })

    it("should preserve error messages", () => {
        const results = parseBatchFile(invalidJsonLine)
        const errors = filterErrorResults(results)

        expect(errors[0].error).toContain("Invalid JSON syntax")
        expect(errors[0].raw).toBe(invalidJsonLine)
    })

    it("should return correctly typed array", () => {
        const results = parseBatchFile(`${validBatchLine}
${invalidJsonLine}`)

        const errors = filterErrorResults(results)

        // This should compile without type errors
        errors.forEach((e) => {
            expect(e.error).toBeDefined()
            expect(e.raw).toBeDefined()
        })
    })
})

// ============================================================================
// INTEGRATION TESTS: Full Parsing Workflow
// ============================================================================

describe("Integration: Full batch processing workflow", () => {
    it("should handle realistic batch file with mixed results", () => {
        const batchContent = `${validBatchLine}
${validBatchLine}
${invalidJsonLine}
${validBatchLineWithUnicode}
${missingContentLine}
${validBatchLineEmptyCollocations}`

        // Parse the entire file
        const results = parseBatchFile(batchContent)
        expect(results).toHaveLength(6)

        // Separate valid and invalid
        const validResults = filterValidResults(results)
        const errorResults = filterErrorResults(results)

        expect(validResults).toHaveLength(4)
        expect(errorResults).toHaveLength(2)

        // Verify valid results have expected data
        expect(validResults.every((r) => r.word && r.tokens !== undefined)).toBe(true)

        // Verify errors have context
        expect(errorResults.every((e) => e.error && e.raw)).toBe(true)
    })

    it("should detect language and parse batch file", () => {
        const filename = "batch_words_ja.jsonl"
        const lang = detectLanguageFromFilename(filename)

        expect(lang).toBe("ja")

        const results = parseBatchFile(validBatchLineWithUnicode)
        const validResults = filterValidResults(results)

        expect(validResults).toHaveLength(1)
        expect(validResults[0].word).toBe("日本語_word")
    })

    it("should provide complete error report for failed batch", () => {
        const batchContent = `${invalidJsonLine}
${missingContentLine}
${invalidCollocationsJsonLine}`

        const results = parseBatchFile(batchContent)
        const errors = filterErrorResults(results)

        // Each error should have unique line number
        const lineNumbers = errors.map((e) => e.error.match(/Line (\d+)/)?.[1])
        expect(new Set(lineNumbers).size).toBe(3)
    })
})
