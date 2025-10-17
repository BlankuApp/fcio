/**
 * Utility to build OpenAI batch API requests for collocation generation
 */

import { BATCH_CONFIG, COLLOCATION_SCHEMA } from "./batch-config"
import { COLLOCATION_PROMPT_TEMPLATE } from "@/lib/constants/collocation-prompt"

interface BatchRequest {
    custom_id: string
    method: string
    url: string
    body: Record<string, unknown>
}

/**
 * Builds a single batch request for collocation generation
 */
export function buildBatchRequest(word: string, languageName: string): BatchRequest {
    const prompt = {
        input: [
            {
                role: "user",
                content: [
                    {
                        type: "input_text",
                        text: COLLOCATION_PROMPT_TEMPLATE(word, languageName),
                    },
                ],
            },
        ],
    }

    return {
        custom_id: word,
        method: "POST",
        url: BATCH_CONFIG.API_URL,
        body: {
            model: BATCH_CONFIG.MODEL,
            ...prompt,
            text: {
                format: {
                    type: BATCH_CONFIG.TEXT_FORMAT.type,
                    name: BATCH_CONFIG.TEXT_FORMAT.name,
                    strict: BATCH_CONFIG.TEXT_FORMAT.strict,
                    schema: COLLOCATION_SCHEMA,
                },
                verbosity: "high",
            },
            reasoning: BATCH_CONFIG.REASONING,
            tools: BATCH_CONFIG.TOOLS,
            store: BATCH_CONFIG.STORE,
            include: BATCH_CONFIG.INCLUDE,
        },
    }
}

/**
 * Converts a batch request to JSONL format
 */
export function requestToJsonl(request: BatchRequest): string {
    return JSON.stringify(request)
}

/**
 * Generates JSONL content from a list of words
 */
export function generateJsonlContent(words: string[], languageName: string): string {
    return words
        .map((word) => {
            const request = buildBatchRequest(word, languageName)
            return requestToJsonl(request)
        })
        .join("\n")
}
