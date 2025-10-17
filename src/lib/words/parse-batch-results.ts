/**
 * Utilities for parsing OpenAI batch results from JSONL format
 */

import type { ParsedResult, ParsedResultError, ParsedResultType, CollocationsPattern } from "@/lib/types/words"

/**
 * Parse a single line from an OpenAI batch JSONL file
 */
export function parseBatchLine(
    line: string,
    lineNumber: number
): ParsedResult | ParsedResultError {
    try {
        const rawData = JSON.parse(line)
        const content = JSON.parse(
            rawData.response.body.output[1].content[0].text
        ) as CollocationsPattern

        const result: ParsedResult = {
            word: rawData.custom_id,
            tokens: rawData.response.body.usage.total_tokens,
            output: rawData.response.body.output[1].content[0].text,
            collocations: content,
        }
        return result
    } catch (err) {
        const error: ParsedResultError = {
            error: `Line ${lineNumber}: Invalid JSON - ${err instanceof Error ? err.message : "Unknown error"}`,
            raw: line,
        }
        return error
    }
}

/**
 * Parse all lines from a batch JSONL file content
 */
export function parseBatchFile(fileContent: string): ParsedResultType[] {
    const lines = fileContent.split("\n").filter((line) => line.trim())
    return lines.map((line, index) => parseBatchLine(line, index + 1))
}

/**
 * Detect language code from filename pattern (batch_words_XX.jsonl)
 */
export function detectLanguageFromFilename(filename: string): string | null {
    const match = filename.match(/batch_words_([a-z]{2})/)
    return match ? match[1] : null
}

/**
 * Validate that a ParsedResult has the expected structure
 */
export function isValidParsedResult(
    result: ParsedResultType
): result is ParsedResult {
    return !("error" in result)
}

/**
 * Extract only valid results from a mixed array
 */
export function filterValidResults(
    results: ParsedResultType[]
): ParsedResult[] {
    return results.filter(isValidParsedResult)
}

/**
 * Extract only error results from a mixed array
 */
export function filterErrorResults(
    results: ParsedResultType[]
): ParsedResultError[] {
    return results.filter((r): r is ParsedResultError => "error" in r)
}
