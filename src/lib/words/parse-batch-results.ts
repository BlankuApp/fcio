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
    let rawData: Record<string, unknown>
    try {
        rawData = JSON.parse(line) as Record<string, unknown>
    } catch (err) {
        const error: ParsedResultError = {
            error: `Line ${lineNumber}: Invalid JSON syntax - ${err instanceof Error ? err.message : "Unknown error"}`,
            raw: line,
        }
        return error
    }

    let content: CollocationsPattern
    try {
        const nestedText = (rawData?.response as Record<string, unknown>)?.body as Record<string, unknown>
        const outputArray = nestedText?.output as Array<Record<string, unknown>>
        const textContent = outputArray?.[1]?.content as Array<Record<string, unknown>>
        const contentText = textContent?.[0]?.text as string

        content = JSON.parse(contentText) as CollocationsPattern
    } catch (err) {
        const error: ParsedResultError = {
            error: `Line ${lineNumber}: Invalid content JSON - ${err instanceof Error ? err.message : "Unknown error"}`,
            raw: line,
        }
        return error
    }

    try {
        const responseObj = rawData?.response as Record<string, unknown>
        const bodyObj = responseObj?.body as Record<string, unknown>
        const usageObj = bodyObj?.usage as Record<string, unknown>
        const outputArray = bodyObj?.output as Array<Record<string, unknown>>
        const contentArray = outputArray?.[1]?.content as Array<Record<string, unknown>>

        const result: ParsedResult = {
            word: rawData.custom_id as string,
            tokens: usageObj?.total_tokens as number,
            output: contentArray?.[0]?.text as string,
            collocations: content,
        }
        return result
    } catch (err) {
        const error: ParsedResultError = {
            error: `Line ${lineNumber}: Unexpected object shape - ${err instanceof Error ? err.message : "Unknown error"}`,
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
