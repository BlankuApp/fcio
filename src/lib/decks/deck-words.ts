/**
 * Convenience exports for deck_words utilities
 * Follows the pattern: client functions exported as-is,
 * server functions exported with "Server" suffix for clarity
 */

// Type exports
export type {
    DeckWord,
    AddWordToDeckInput,
    UpdateDeckWordInput,
    BatchUpdateDeckWordsInput,
    ListDeckWordsOptions,
    DueCardsResponse,
} from "@/lib/types/deck-words"

// Client-side exports (use in "use client" components)
export {
    addWordToDeck,
    getDeckWordById,
    getDeckWordByIds,
    listDeckWords,
    getDueCards,
    updateDeckWord,
    batchUpdateDeckWords,
    removeWordFromDeck,
    removeWordsFromDeck,
    countDeckWords,
    wordExistsInDeck,
    addWordsToDeck,
} from "@/lib/decks/deck-words-client"

// Server-side exports with "Server" suffix (use in Server Components/API routes)
export {
    addWordToDeck as addWordToDeckServer,
    getDeckWordById as getDeckWordByIdServer,
    getDeckWordByIds as getDeckWordByIdsServer,
    listDeckWords as listDeckWordsServer,
    getDueCards as getDueCardsServer,
    updateDeckWord as updateDeckWordServer,
    batchUpdateDeckWords as batchUpdateDeckWordsServer,
    removeWordFromDeck as removeWordFromDeckServer,
    removeWordsFromDeck as removeWordsFromDeckServer,
    countDeckWords as countDeckWordsServer,
    wordExistsInDeck as wordExistsInDeckServer,
    addWordsToDeck as addWordsToDeckServer,
    clearDeckWords as clearDeckWordsServer,
    exportDeckWordsData as exportDeckWordsDataServer,
} from "@/lib/decks/deck-words-server"
