/**
 * TypeScript types for the deck_words table
 * Stores words in decks with spaced repetition learning metrics
 */

/**
 * Represents a deck_words record from the database
 * Tracks a word's learning state within a specific deck
 */
export interface DeckWord {
    id: string                           // UUID primary key
    deck_id: string                      // Links to decks.id
    word_id: string                      // Links to words.id
    state: number                        // Learning state (1=new, 2=learning, 3=review, 4=relearning)
    stability: number                    // Stability metric for FSRS algorithm (0.0-1.0+)
    difficulty: number                   // Difficulty metric for FSRS algorithm (1.0-10.0)
    due: string                          // ISO timestamp - when card is due for review
    last_review: string | null           // ISO timestamp - last time reviewed (nullable)
    step: number                         // Current learning step in algorithm
    created_at: string                   // ISO timestamp
    updated_at: string                   // ISO timestamp
}

/**
 * Input data for adding a word to a deck
 */
export interface AddWordToDeckInput {
    word_id: string                      // UUID of word to add
    state?: number                       // Optional: initial state (default 1)
    stability?: number                   // Optional: initial stability (default 0.0)
    difficulty?: number                  // Optional: initial difficulty (default 0.0)
}

/**
 * Input data for updating a deck word's learning metrics
 */
export interface UpdateDeckWordInput {
    state?: number                       // Update learning state
    stability?: number                   // Update stability
    difficulty?: number                  // Update difficulty
    due?: string                         // Update due date
    last_review?: string | null          // Update last review timestamp
    step?: number                        // Update learning step
}

/**
 * Input for batch updating multiple deck words
 */
export interface BatchUpdateDeckWordsInput {
    deckWordIds: string[]                // IDs of deck_words to update
    updates: UpdateDeckWordInput         // Updates to apply to all
}

/**
 * Options for listing deck words with filtering and pagination
 */
export interface ListDeckWordsOptions {
    limit?: number                       // Pagination limit
    offset?: number                      // Pagination offset
    state?: number                       // Filter by state
    orderBy?: "due" | "created_at" | "last_review"  // Sort order
    ascending?: boolean                  // Sort ascending or descending
}

/**
 * Response for getting words due for review
 */
export interface DueCardsResponse {
    cards: DeckWord[]                    // Cards due for review
    totalDue: number                     // Total count of due cards
    nextReview: string | null            // ISO timestamp of next card due
}
