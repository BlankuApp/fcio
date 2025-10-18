/**
 * TypeScript types for the decks table
 */

import type { ProficiencyLevel } from "@/lib/constants/languages"

/**
 * Represents a deck record from the database
 * Deck ID follows YouTube ID format (11 character alphanumeric string)
 */
export interface Deck {
    id: string                         // YouTube-like ID (11 chars)
    user_id: string                    // Links to auth.users.id
    que_lang: string                   // Question language code (e.g., "en", "es", "ja")
    ans_langs: string[]                // Array of answer language codes (e.g., ["es", "ja"])
    diff_level: ProficiencyLevel["value"] // One of the 6 proficiency levels
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
    que_lang: string             // Question language code
    ans_langs: string[]          // Array of answer language codes
    diff_level: DifficultyLevel  // Difficulty level
}

/**
 * Input data for updating an existing deck
 */
export interface UpdateDeckInput {
    que_lang?: string            // Optional: update question language
    ans_langs?: string[]         // Optional: update answer languages
    diff_level?: DifficultyLevel // Optional: update difficulty level
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
