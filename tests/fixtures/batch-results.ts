/**
 * Test fixtures for batch processing
 */

import type { ParsedResult, CollocationsPattern } from "@/lib/types/words"

export const MOCK_COLLOCATIONS: CollocationsPattern = {
    "Verb Phrase": [
        { collocation: "make progress", difficulty: "elementary" },
        { collocation: "take time", difficulty: "elementary" },
    ],
    "Noun Phrase": [
        { collocation: "strong foundation", difficulty: "intermediate" },
    ],
    "Adverbial Phrase": [
        { collocation: "in the long run", difficulty: "upper-intermediate" },
    ],
}

export const VALID_BATCH_JSONL_LINE = JSON.stringify({
    custom_id: "run",
    response: {
        body: {
            usage: {
                total_tokens: 150,
            },
            output: [
                {
                    type: "text",
                },
                {
                    type: "text",
                    content: [
                        {
                            type: "text",
                            text: JSON.stringify(MOCK_COLLOCATIONS),
                        },
                    ],
                },
            ],
        },
    },
})

export const VALID_PARSED_RESULT: ParsedResult = {
    word: "run",
    tokens: 150,
    output: JSON.stringify(MOCK_COLLOCATIONS),
    collocations: MOCK_COLLOCATIONS,
}

export const INVALID_JSON_LINE = "{ invalid json }"

export const INVALID_NESTED_STRUCTURE_LINE = JSON.stringify({
    custom_id: "word",
    response: {
        body: {
            // Missing usage, output
        },
    },
})

export const EMPTY_COLLOCATIONS: CollocationsPattern = {}

export const COMPLEX_COLLOCATIONS: CollocationsPattern = {
    "Verb Phrase": [
        { collocation: "take advantage of", difficulty: "elementary" },
        { collocation: "come across", difficulty: "elementary" },
        { collocation: "put up with", difficulty: "intermediate" },
    ],
    "Noun Phrase": [
        { collocation: "point of view", difficulty: "elementary" },
        { collocation: "line of work", difficulty: "intermediate" },
        { collocation: "course of action", difficulty: "upper-intermediate" },
    ],
    "Adjective Phrase": [
        { collocation: "worth noting", difficulty: "intermediate" },
    ],
}

export const UNICODE_WORD = "café"
export const SPECIAL_CHARS_WORD = "run@#$%"
export const VERY_LONG_WORD = "a".repeat(1000)

export const BATCH_FILE_CONTENT_VALID = [
    VALID_BATCH_JSONL_LINE,
    JSON.stringify({
        custom_id: "walk",
        response: {
            body: {
                usage: { total_tokens: 120 },
                output: [
                    { type: "text" },
                    {
                        type: "text",
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    "Verb Phrase": [
                                        { collocation: "walk around", difficulty: "elementary" },
                                    ],
                                }),
                            },
                        ],
                    },
                ],
            },
        },
    }),
].join("\n")

export const BATCH_FILE_WITH_ERRORS = [
    VALID_BATCH_JSONL_LINE,
    "{ bad json }",
    JSON.stringify({
        custom_id: "jump",
        response: {
            body: {
                usage: { total_tokens: 100 },
                output: [
                    { type: "text" },
                    {
                        type: "text",
                        content: [
                            {
                                type: "text",
                                text: JSON.stringify({
                                    "Verb Phrase": [
                                        { collocation: "jump up", difficulty: "elementary" },
                                    ],
                                }),
                            },
                        ],
                    },
                ],
            },
        },
    }),
].join("\n")
