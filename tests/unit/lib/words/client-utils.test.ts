/**
 * Tests for src/lib/words/client-utils.ts
 * TIER 1 CRITICAL: Database CRUD Operations - Words
 */

import { describe, it, expect, beforeEach, vi } from "vitest"
import { createClient } from "@/lib/supabase/client"
import * as wordUtils from "@/lib/words/client-utils"
import type { Word, CreateWordInput, CollocationsPattern } from "@/lib/types/words"

// Mock the Supabase client
vi.mock("@/lib/supabase/client")

// Test fixtures
const mockCollocations: CollocationsPattern = {
    "Verb Phrase": [
        { collocation: "make progress", difficulty: "elementary" },
        { collocation: "take time", difficulty: "elementary" },
    ],
}

const mockWord: Word = {
    id: "word-1",
    lemma: "run",
    lang: "en",
    collocations: mockCollocations,
    created_at: "2024-01-01T00:00:00Z",
    updated_at: "2024-01-01T00:00:00Z",
}

const createMockQueryBuilder = () => ({
    select: vi.fn().mockReturnThis(),
    insert: vi.fn().mockReturnThis(),
    update: vi.fn().mockReturnThis(),
    delete: vi.fn().mockReturnThis(),
    eq: vi.fn().mockReturnThis(),
    ilike: vi.fn().mockReturnThis(),
    contains: vi.fn().mockReturnThis(),
    limit: vi.fn().mockReturnThis(),
    range: vi.fn().mockReturnThis(),
    single: vi.fn().mockReturnThis(),
})

describe("createWord", () => {
    beforeEach(() => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: mockWord,
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)
    })

    it("should create a word with valid input", async () => {
        const input: CreateWordInput = {
            lemma: "run",
            lang: "en",
            collocations: mockCollocations,
        }

        const result = await wordUtils.createWord(input)

        expect(result).toEqual(mockWord)
        expect(createClient).toHaveBeenCalled()
    })

    it("should throw error on database failure", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: null,
            error: { message: "Database error" },
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const input: CreateWordInput = {
            lemma: "run",
            lang: "en",
            collocations: mockCollocations,
        }

        await expect(wordUtils.createWord(input)).rejects.toThrow("Failed to create word")
    })
})

describe("getWordById", () => {
    beforeEach(() => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: mockWord,
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)
    })

    it("should retrieve a word by ID", async () => {
        const result = await wordUtils.getWordById("word-1")
        expect(result).toEqual(mockWord)
    })

    it("should return null for non-existent word", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.getWordById("non-existent")
        expect(result).toBeNull()
    })

    it("should throw on non-404 errors", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: null,
            error: { code: "OTHER_ERROR", message: "Database connection failed" },
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await expect(wordUtils.getWordById("word-1")).rejects.toThrow("Failed to fetch word")
    })
})

describe("getWordByLemmaAndLang", () => {
    it("should retrieve word by lemma and language", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: mockWord,
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.getWordByLemmaAndLang("run", "en")
        expect(result).toEqual(mockWord)
    })

    it("should return null for non-existent word", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.single.mockResolvedValue({
            data: null,
            error: { code: "PGRST116" },
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.getWordByLemmaAndLang("nonexistent", "en")
        expect(result).toBeNull()
    })
})

describe("listWords", () => {
    it("should list words with default pagination", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.range.mockResolvedValue({
            data: [mockWord, mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.listWords()
        expect(result).toHaveLength(2)
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 49)
    })

    it("should apply custom limit", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.range.mockResolvedValue({
            data: [mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await wordUtils.listWords({ limit: 10 })
        expect(mockQueryBuilder.range).toHaveBeenCalledWith(0, 9)
    })

    it("should filter by language", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.range.mockResolvedValue({
            data: [mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await wordUtils.listWords({ lang: "es" })
        expect(mockQueryBuilder.eq).toHaveBeenCalledWith("lang", "es")
    })
})

describe("updateWord", () => {
    it("should update word collocations", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        const updatedWord = { ...mockWord, collocations: { newPhrase: [] } }
        mockQueryBuilder.single.mockResolvedValue({
            data: updatedWord,
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.updateWord("word-1", {
            collocations: { newPhrase: [] },
        })

        expect(result.collocations).toEqual({ newPhrase: [] })
    })

    it("should throw when no fields provided", async () => {
        await expect(wordUtils.updateWord("word-1", {})).rejects.toThrow(
            "No fields to update"
        )
    })
})

describe("deleteWord", () => {
    it("should delete a word by ID", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.eq.mockResolvedValue({
            data: null,
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await expect(wordUtils.deleteWord("word-1")).resolves.toBeUndefined()
    })

    it("should throw on deletion error", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.eq.mockResolvedValue({
            data: null,
            error: { message: "Deletion failed" },
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await expect(wordUtils.deleteWord("word-1")).rejects.toThrow(
            "Failed to delete word"
        )
    })
})

describe("bulkCreateWords", () => {
    it("should create multiple words", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.select.mockResolvedValue({
            data: [mockWord, mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const inputs: CreateWordInput[] = [
            { lemma: "run", lang: "en", collocations: mockCollocations },
            { lemma: "walk", lang: "en", collocations: mockCollocations },
        ]

        const result = await wordUtils.bulkCreateWords(inputs)
        expect(result).toHaveLength(2)
    })
})

describe("searchWords", () => {
    it("should search words by pattern", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.limit.mockResolvedValue({
            data: [mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        const result = await wordUtils.searchWords("run")
        expect(result).toHaveLength(1)
    })

    it("should use ilike for case-insensitive search", async () => {
        const mockQueryBuilder = createMockQueryBuilder()
        mockQueryBuilder.limit.mockResolvedValue({
            data: [mockWord],
            error: null,
        })
        const mockSupabase = {
            from: vi.fn().mockReturnValue(mockQueryBuilder),
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        vi.mocked(createClient).mockReturnValue(mockSupabase as any)

        await wordUtils.searchWords("RUN")
        expect(mockQueryBuilder.ilike).toHaveBeenCalledWith("lemma", "%RUN%")
    })
})
