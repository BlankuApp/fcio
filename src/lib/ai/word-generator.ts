/**
 * AI Word Generator Service
 * This is a dummy implementation that simulates AI-generated word details
 * In production, this would call an actual AI API (OpenAI, Anthropic, etc.)
 */

export interface GeneratedWordData {
    lemma: string
    lang: string
    difficulty_level: string
    collocations: Array<{
        word: string
        example: string
    }>
}

/**
 * Simulates AI generation of word details
 * @param word - The input word to generate details for
 * @returns Promise with generated word data
 */
export async function generateWordDetails(word: string): Promise<GeneratedWordData> {
    // Simulate API delay
    await new Promise((resolve) => setTimeout(resolve, 1500))

    // Dummy responses based on word patterns
    const dummyResponses: Record<string, GeneratedWordData> = {
        decision: {
            lemma: "decision",
            lang: "en",
            difficulty_level: "intermediate",
            collocations: [
                {
                    word: "make a decision",
                    example: "I need to make a decision about my career path.",
                },
                {
                    word: "reach a decision",
                    example: "After hours of discussion, we finally reached a decision.",
                },
                {
                    word: "tough decision",
                    example: "It was a tough decision to leave my hometown.",
                },
            ],
        },
        beautiful: {
            lemma: "beautiful",
            lang: "en",
            difficulty_level: "elementary",
            collocations: [
                {
                    word: "beautiful scenery",
                    example: "The mountain had beautiful scenery that took our breath away.",
                },
                {
                    word: "beautiful weather",
                    example: "We had beautiful weather for the entire vacation.",
                },
                {
                    word: "stunningly beautiful",
                    example: "The sunset was stunningly beautiful.",
                },
            ],
        },
        考える: {
            lemma: "考える",
            lang: "ja",
            difficulty_level: "intermediate",
            collocations: [
                {
                    word: "よく考える",
                    example: "よく考えてから決めてください。",
                },
                {
                    word: "考えを変える",
                    example: "彼は考えを変えることにした。",
                },
                {
                    word: "深く考える",
                    example: "この問題について深く考える必要がある。",
                },
            ],
        },
    }

    // Check if we have a predefined response
    const lowerWord = word.toLowerCase().trim()
    if (dummyResponses[lowerWord]) {
        return dummyResponses[lowerWord]
    }

    // Generate a generic response for unknown words
    // Detect language based on character set
    const lang = detectLanguage(word)
    const difficulty = generateDifficultyLevel(word)

    return {
        lemma: word.trim(),
        lang,
        difficulty_level: difficulty,
        collocations: generateDummyCollocations(word, lang),
    }
}

/**
 * Detects the language of a word based on character patterns
 */
function detectLanguage(word: string): string {
    // Japanese characters (Hiragana, Katakana, Kanji)
    if (/[\u3040-\u309F\u30A0-\u30FF\u4E00-\u9FAF]/.test(word)) {
        return "ja"
    }
    // Arabic script
    if (/[\u0600-\u06FF]/.test(word)) {
        return "ar"
    }
    // Persian (extends Arabic script)
    if (/[\u0600-\u06FF\uFB50-\uFDFF\uFE70-\uFEFF]/.test(word)) {
        return "fa"
    }
    // Chinese characters
    if (/[\u4E00-\u9FFF]/.test(word)) {
        return "zh"
    }
    // Korean (Hangul)
    if (/[\uAC00-\uD7AF\u1100-\u11FF\u3130-\u318F]/.test(word)) {
        return "ko"
    }
    // Hindi (Devanagari)
    if (/[\u0900-\u097F]/.test(word)) {
        return "hi"
    }
    // Myanmar (Burmese)
    if (/[\u1000-\u109F]/.test(word)) {
        return "my"
    }
    
    // Default to English for Latin script
    return "en"
}

/**
 * Generates a difficulty level based on word length and complexity
 */
function generateDifficultyLevel(word: string): string {
    const length = word.length
    
    if (length <= 4) return "beginner"
    if (length <= 6) return "elementary"
    if (length <= 8) return "intermediate"
    if (length <= 10) return "upper_intermediate"
    if (length <= 12) return "advanced"
    return "proficient"
}

/**
 * Generates dummy collocations for a word
 */
function generateDummyCollocations(
    word: string,
    lang: string
): Array<{ word: string; example: string }> {
    const templates: Record<string, Array<{ word: string; example: string }>> = {
        en: [
            {
                word: `${word} something`,
                example: `I ${word} something important yesterday.`,
            },
            {
                word: `very ${word}`,
                example: `This is very ${word} for our project.`,
            },
            {
                word: `${word} quickly`,
                example: `We need to ${word} quickly before it's too late.`,
            },
        ],
        ja: [
            {
                word: `${word}する`,
                example: `毎日${word}することが大切です。`,
            },
            {
                word: `${word}が必要`,
                example: `この仕事には${word}が必要です。`,
            },
        ],
        default: [
            {
                word: `[common phrase with ${word}]`,
                example: `This is an example sentence using ${word}.`,
            },
            {
                word: `[another phrase with ${word}]`,
                example: `Here's another way to use ${word} in context.`,
            },
        ],
    }

    const langTemplates = templates[lang] || templates.default
    return langTemplates.slice(0, 3)
}
