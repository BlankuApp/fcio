/**
 * Server-side utilities for deck_words table operations
 * Use this file in Server Components and API routes
 */

import { createClient } from "@/lib/supabase/server"
import type {
    DeckWord,
    AddWordToDeckInput,
    UpdateDeckWordInput,
    BatchUpdateDeckWordsInput,
    ListDeckWordsOptions,
    DueCardsResponse,
} from "@/lib/types/deck-words"

/**
 * SERVER-SIDE: Add a word to a deck
 */
export async function addWordToDeck(
    deckId: string,
    input: AddWordToDeckInput
): Promise<DeckWord> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .insert([
            {
                deck_id: deckId,
                word_id: input.word_id,
                state: input.state ?? 1,
                stability: input.stability ?? 0.0,
                difficulty: input.difficulty ?? 0.0,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(`Failed to add word to deck: ${error.message}`)
    return data as DeckWord
}

/**
 * SERVER-SIDE: Get a deck word by ID
 */
export async function getDeckWordById(id: string): Promise<DeckWord | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .select("*")
        .eq("id", id)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch deck word: ${error.message}`)
    }

    return (data as DeckWord) || null
}

/**
 * SERVER-SIDE: Get a deck word by deck_id and word_id
 */
export async function getDeckWordByIds(
    deckId: string,
    wordId: string
): Promise<DeckWord | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .select("*")
        .eq("deck_id", deckId)
        .eq("word_id", wordId)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch deck word: ${error.message}`)
    }

    return (data as DeckWord) || null
}

/**
 * SERVER-SIDE: List all words in a deck
 */
export async function listDeckWords(
    deckId: string,
    options?: ListDeckWordsOptions
): Promise<DeckWord[]> {
    const supabase = await createClient()

    let query = supabase.from("deck_words").select("*").eq("deck_id", deckId)

    // Filter by state if provided
    if (options?.state !== undefined) {
        query = query.eq("state", options.state)
    }

    // Apply pagination
    if (options?.limit) {
        query = query.limit(options.limit)
    }
    if (options?.offset) {
        query = query.range(
            options.offset,
            options.offset + (options.limit || 10) - 1
        )
    }

    // Apply sorting
    const orderBy = options?.orderBy ?? "due"
    const ascending = options?.ascending ?? true
    query = query.order(orderBy, { ascending })

    const { data, error } = await query

    if (error) throw new Error(`Failed to list deck words: ${error.message}`)
    return (data as DeckWord[]) || []
}

/**
 * SERVER-SIDE: Get cards due for review in a deck
 */
export async function getDueCards(deckId: string): Promise<DueCardsResponse> {
    const supabase = await createClient()

    const now = new Date().toISOString()

    const { data, error, count } = await supabase
        .from("deck_words")
        .select("*", { count: "exact" })
        .eq("deck_id", deckId)
        .lte("due", now)
        .order("due", { ascending: true })

    if (error) throw new Error(`Failed to fetch due cards: ${error.message}`)

    const cards = (data as DeckWord[]) || []

    // Get next due card timestamp
    let nextReview: string | null = null
    if (cards.length > 0) {
        nextReview = cards[0]?.due || null
    }

    return {
        cards,
        totalDue: count || 0,
        nextReview,
    }
}

/**
 * SERVER-SIDE: Update a deck word
 */
export async function updateDeckWord(
    id: string,
    updates: UpdateDeckWordInput
): Promise<DeckWord> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .update(updates)
        .eq("id", id)
        .select()
        .single()

    if (error) throw new Error(`Failed to update deck word: ${error.message}`)
    return data as DeckWord
}

/**
 * SERVER-SIDE: Batch update multiple deck words
 */
export async function batchUpdateDeckWords(
    input: BatchUpdateDeckWordsInput
): Promise<DeckWord[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .update(input.updates)
        .in("id", input.deckWordIds)
        .select()

    if (error)
        throw new Error(`Failed to batch update deck words: ${error.message}`)
    return (data as DeckWord[]) || []
}

/**
 * SERVER-SIDE: Remove a word from a deck
 */
export async function removeWordFromDeck(deckId: string, wordId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("deck_words")
        .delete()
        .eq("deck_id", deckId)
        .eq("word_id", wordId)

    if (error)
        throw new Error(`Failed to remove word from deck: ${error.message}`)
}

/**
 * SERVER-SIDE: Remove multiple words from a deck
 */
export async function removeWordsFromDeck(
    deckId: string,
    wordIds: string[]
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("deck_words")
        .delete()
        .eq("deck_id", deckId)
        .in("word_id", wordIds)

    if (error)
        throw new Error(`Failed to remove words from deck: ${error.message}`)
}

/**
 * SERVER-SIDE: Count words in a deck
 */
export async function countDeckWords(deckId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from("deck_words")
        .select("*", { count: "exact", head: true })
        .eq("deck_id", deckId)

    if (error) throw new Error(`Failed to count deck words: ${error.message}`)
    return count || 0
}

/**
 * SERVER-SIDE: Check if a word exists in a deck
 */
export async function wordExistsInDeck(deckId: string, wordId: string): Promise<boolean> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from("deck_words")
        .select("*", { count: "exact", head: true })
        .eq("deck_id", deckId)
        .eq("word_id", wordId)

    if (error) throw new Error(`Failed to check word in deck: ${error.message}`)
    return (count || 0) > 0
}

/**
 * SERVER-SIDE: Add multiple words to a deck
 */
export async function addWordsToDeck(
    deckId: string,
    wordIds: string[]
): Promise<DeckWord[]> {
    const supabase = await createClient()

    const inserts = wordIds.map((wordId) => ({
        deck_id: deckId,
        word_id: wordId,
        state: 1,
        stability: 0.0,
        difficulty: 0.0,
    }))

    const { data, error } = await supabase
        .from("deck_words")
        .insert(inserts)
        .select()

    if (error) throw new Error(`Failed to add words to deck: ${error.message}`)
    return (data as DeckWord[]) || []
}

/**
 * SERVER-SIDE: Delete all words from a deck (useful for cleanup when deleting a deck)
 */
export async function clearDeckWords(deckId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("deck_words")
        .delete()
        .eq("deck_id", deckId)

    if (error) throw new Error(`Failed to clear deck words: ${error.message}`)
}

/**
 * SERVER-SIDE: Get all words for a deck with their learning data (for bulk export/analysis)
 */
export async function exportDeckWordsData(deckId: string): Promise<DeckWord[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("deck_words")
        .select("*")
        .eq("deck_id", deckId)
        .order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to export deck words data: ${error.message}`)
    return (data as DeckWord[]) || []
}
