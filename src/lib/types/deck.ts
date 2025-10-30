/**
 * TypeScript types for the decks table
 */

import type { ProficiencyLevel } from "@/lib/constants/languages"

/**
 * AI prompts for deck review and other AI features
 */
export interface AIPrompts {
    review: string                     // AI prompt for review mode
    answerGeneration: string           // AI prompt for generating answer sentences (Agent 1)
    questionTranslation: string        // AI prompt for translating answer to question (Agent 2)
    hintsGeneration: string            // AI prompt for generating hints (Agent 3)
    [key: string]: string              // Allow additional prompt types
}

/**
 * Represents a deck record from the database
 * Deck ID follows YouTube ID format (11 character alphanumeric string)
 */
export interface Deck {
    id: string                         // YouTube-like ID (11 chars)
    user_id: string                    // Links to auth.users.id
    name: string                       // Deck name (max 50 chars)
    que_lang: string                   // Question language code (e.g., "en", "es", "ja")
    ans_langs: string[]                // Array of answer language codes (e.g., ["es", "ja"])
    diff_level: ProficiencyLevel["value"] // One of the 6 proficiency levels
    ai_prompts: AIPrompts              // JSON data containing AI prompts (e.g., {"review": "prompt...", "answerGeneration": "prompt...", "questionTranslation": "prompt...", "hintsGeneration": "prompt..."})
    created_at: string                 // ISO timestamp
    updated_at: string                 // ISO timestamp
}

/**
 * Difficulty levels - uses ProficiencyLevel values from languages constants
 */
export type DifficultyLevel = ProficiencyLevel["value"]

/**
 * Input data for creating a new deck
 */
export interface CreateDeckInput {
    name: string                 // Deck name (max 50 chars)
    que_lang: string             // Question language code
    ans_langs: string[]          // Array of answer language codes
    diff_level: DifficultyLevel  // Difficulty level
    ai_prompts: AIPrompts        // AI prompts for the deck
}

/**
 * Input data for updating an existing deck
 */
export interface UpdateDeckInput {
    name?: string                // Optional: update deck name (max 50 chars)
    que_lang?: string            // Optional: update question language
    ans_langs?: string[]         // Optional: update answer languages
    diff_level?: DifficultyLevel // Optional: update difficulty level
    ai_prompts?: AIPrompts       // Optional: update AI prompts
}

/**
 * Helper type for listing decks with optional filters
 */
export interface ListDecksOptions {
    que_lang?: string       // Filter by question language
    diff_level?: DifficultyLevel // Filter by difficulty level
    limit?: number          // Pagination limit
    offset?: number         // Pagination offset
}
