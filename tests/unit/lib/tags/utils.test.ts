/**
 * Tests for src/lib/tags/utils.ts
 * TIER 1 CRITICAL: Tag Management System
 */

import { describe, it, expect } from "vitest"
import { normalizeName, handleSingleQueryError } from "@/lib/tags/utils"

describe("normalizeName", () => {
    it("should convert to lowercase", () => {
        expect(normalizeName("HELLO")).toBe("hello")
        expect(normalizeName("WoRlD")).toBe("world")
    })

    it("should trim whitespace", () => {
        expect(normalizeName("  hello  ")).toBe("hello")
        expect(normalizeName("\t\ntag\t\n")).toBe("tag")
    })

    it("should replace spaces with underscores", () => {
        expect(normalizeName("hello world")).toBe("hello_world")
        expect(normalizeName("multi word phrase")).toBe("multi_word_phrase")
    })

    it("should handle multiple consecutive spaces", () => {
        expect(normalizeName("hello    world")).toBe("hello_world")
        expect(normalizeName("a   b   c")).toBe("a_b_c")
    })

    it("should handle mixed whitespace (spaces, tabs, newlines)", () => {
        expect(normalizeName("hello \t world")).toBe("hello_world")
        expect(normalizeName("tag\n\nname")).toBe("tag_name")
    })

    it("should handle Unicode characters", () => {
        expect(normalizeName("CAFÉ")).toBe("café")
        expect(normalizeName("NAÏVE")).toBe("naïve")
    })

    it("should combine all normalizations", () => {
        expect(normalizeName("  HELLO WORLD  ")).toBe("hello_world")
        expect(normalizeName("\t Multiple  WORD Tag \n")).toBe("multiple_word_tag")
    })

    it("should handle empty strings", () => {
        expect(normalizeName("")).toBe("")
    })

    it("should handle only whitespace", () => {
        expect(normalizeName("   ")).toBe("")
    })

    it("should preserve numbers", () => {
        expect(normalizeName("TAG123")).toBe("tag123")
        expect(normalizeName("123 TAGS")).toBe("123_tags")
    })

    it("should preserve special characters other than spaces", () => {
        expect(normalizeName("hello-world")).toBe("hello-world")
        expect(normalizeName("tag_name")).toBe("tag_name")
        expect(normalizeName("hello.world")).toBe("hello.world")
    })
})

describe("handleSingleQueryError", () => {
    it("should return null for PGRST116 error (not found)", () => {
        const error = { code: "PGRST116", message: "No rows found" }
        const result = handleSingleQueryError(error, "Test context")

        expect(result).toBeNull()
    })

    it("should throw for non-PGRST116 errors", () => {
        const error = { code: "OTHER_ERROR", message: "Database error" }

        expect(() => {
            handleSingleQueryError(error, "Test context")
        }).toThrow("Test context: Database error")
    })

    it("should throw for errors without code property", () => {
        const error = { message: "Unknown error" }

        expect(() => {
            handleSingleQueryError(error, "Test context")
        }).toThrow("Test context: Unknown error")
    })

    it("should include context message in error", () => {
        const error = { code: "SOME_ERROR", message: "Connection failed" }

        expect(() => {
            handleSingleQueryError(error, "Custom Context")
        }).toThrow("Custom Context: Connection failed")
    })

    it("should handle empty context", () => {
        const error = { code: "SOME_ERROR", message: "Error message" }

        expect(() => {
            handleSingleQueryError(error, "")
        }).toThrow(": Error message")
    })

    it("should handle error messages with special characters", () => {
        const error = { code: "ERROR_CODE", message: 'Duplicate key "tag_name"' }

        expect(() => {
            handleSingleQueryError(error, "Insert")
        }).toThrow('Insert: Duplicate key "tag_name"')
    })
})
