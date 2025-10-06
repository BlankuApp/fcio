/**
 * Default AI prompts for user profiles
 * Follows OpenAI chat completion message format
 */

export interface PromptMessage {
    role: 'system' | 'user' | 'assistant'
    content: string
}

export type PromptDefinition = PromptMessage[]

export interface DefaultPrompts {
    flashcard_generation: PromptDefinition
    word_explanation: PromptDefinition
    sentence_creation: PromptDefinition
    translation: PromptDefinition
}

/**
 * Default prompt templates for AI interactions
 */
export const DEFAULT_PROMPTS: DefaultPrompts = {
    flashcard_generation: [
        {
            role: 'system',
            content: 'You are a helpful language learning assistant specialized in creating effective flashcards. Generate flashcards that help users learn vocabulary in context with clear examples and explanations.'
        },
        {
            role: 'user',
            content: 'Generate flashcards for the given word or phrase, including definition, example sentences, and usage notes.'
        }
    ],

    word_explanation: [
        {
            role: 'system',
            content: 'You are an expert language tutor. Explain words and phrases clearly, considering the user\'s native language and target language proficiency level. Provide context, usage examples, and cultural notes when relevant.'
        },
        {
            role: 'user',
            content: 'Explain the meaning and usage of the given word or phrase, tailored to my proficiency level.'
        }
    ],

    sentence_creation: [
        {
            role: 'system',
            content: 'You are a language learning assistant that creates natural, contextually appropriate example sentences. Ensure sentences are level-appropriate and demonstrate proper usage.'
        },
        {
            role: 'user',
            content: 'Create example sentences using the given word or phrase that demonstrate its proper usage in different contexts.'
        }
    ],

    translation: [
        {
            role: 'system',
            content: 'You are a professional translator with deep understanding of both languages and cultures. Provide accurate translations that capture meaning, tone, and cultural context.'
        },
        {
            role: 'user',
            content: 'Translate the given text accurately while preserving meaning and appropriate formality level.'
        }
    ]
}

/**
 * Get default prompts for a new user profile
 */
export function getDefaultPrompts(): DefaultPrompts {
    return JSON.parse(JSON.stringify(DEFAULT_PROMPTS)) // Deep clone to prevent mutations
}
