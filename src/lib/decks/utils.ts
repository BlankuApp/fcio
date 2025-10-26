/**
 * Shared utilities for decks
 * Common functions used by both client and server deck operations
 */

import type { Deck } from "@/lib/types/deck"

/**
 * Normalize deck data to ensure ans_langs is always an array
 * This handles cases where PostgreSQL arrays might not be parsed correctly
 */
export function normalizeDeck(deck: Record<string, unknown>): Deck {
    let ansLangs: string[] = []

    if (Array.isArray(deck.ans_langs)) {
        ansLangs = deck.ans_langs
    } else if (typeof deck.ans_langs === "string") {
        // Try to parse as JSON first (handles stringified arrays like '["fa"]')
        try {
            const parsed = JSON.parse(deck.ans_langs)
            ansLangs = Array.isArray(parsed) ? parsed : [deck.ans_langs]
        } catch {
            // If parsing fails, treat as single language code
            ansLangs = [deck.ans_langs]
        }
    }

    return {
        ...deck,
        ans_langs: ansLangs
    } as Deck
}
