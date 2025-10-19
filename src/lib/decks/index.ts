/**
 * Convenience exports for deck utilities
 * Re-exports server-side functions with "Server" suffix for clarity
 * Import from this file for convenience: createDeckServer, getDeckByIdServer, etc.
 */

// Re-export types
export type {
    Deck,
    DifficultyLevel,
    CreateDeckInput,
    UpdateDeckInput,
    ListDecksOptions,
} from "@/lib/types/deck"

// Re-export server utilities with "Server" suffix
export {
    generateDeckId,
    createDeck as createDeckServer,
    getDeckById as getDeckByIdServer,
    getDeckByIdForUser as getDeckByIdForUserServer,
    listUserDecks as listUserDecksServer,
    updateDeck as updateDeckServer,
    deleteDeck as deleteDeckServer,
    deleteDecks as deleteDecksServer,
    countUserDecks as countUserDecksServer,
} from "@/lib/decks/server-utils"
