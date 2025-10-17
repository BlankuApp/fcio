/**
 * Configuration for OpenAI Batch API requests
 */

export const BATCH_CONFIG = {
    MODEL: "gpt-5",
    API_URL: "/v1/responses",
    TEXT_FORMAT: {
        type: "json_schema",
        name: "collocation_patterns",
        strict: false,
    },
    REASONING: {
        effort: "minimal",
        summary: null,
    },
    TOOLS: [],
    STORE: false,
    INCLUDE: ["reasoning.encrypted_content", "web_search_call.action.sources"],
} as const

export const COLLOCATION_SCHEMA = {
    type: "object",
    patternProperties: {
        "^(Verb Phrase|Noun Phrase|Adverbial Phrase|Adjective Phrase)$": {
            type: "array",
            items: {
                type: "object",
                properties: {
                    collocation: {
                        type: "string",
                        maxLength: 50,
                    },
                    difficulty: {
                        type: "string",
                        enum: ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced", "fluent"],
                    },
                },
                required: ["collocation", "difficulty"],
                additionalProperties: false,
            },
        },
    },
    additionalProperties: false,
    properties: {},
    required: [],
} as const

export const DIFFICULTY_LEVELS = ["beginner", "elementary", "intermediate", "upper-intermediate", "advanced", "fluent"] as const
