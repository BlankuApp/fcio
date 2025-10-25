/**
 * Server-side utilities for decks table operations
 * Use this file in Server Components and API routes
 */

import { createClient } from "@/lib/supabase/server"
import type { Deck, CreateDeckInput, UpdateDeckInput, ListDecksOptions } from "@/lib/types/deck"
import { getDefaultAIPrompts } from "@/lib/constants/ai-prompts"

/**
 * Generate a YouTube-like ID (11 character alphanumeric string)
 */
export function generateDeckId(): string {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-_"
    let id = ""
    for (let i = 0; i < 11; i++) {
        id += chars.charAt(Math.floor(Math.random() * chars.length))
    }
    return id
}

/**
 * SERVER-SIDE: Create a new deck
 */
export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
    const supabase = await createClient()

    // Validate name length (max 50 chars)
    if (input.name.length > 50) {
        throw new Error("Deck name must be 50 characters or less")
    }

    // Validate answer languages is an array
    let ansLangs: string[] = []
    if (Array.isArray(input.ans_langs)) {
        ansLangs = input.ans_langs
    } else if (typeof input.ans_langs === 'string') {
        try {
            const parsed = JSON.parse(input.ans_langs)
            ansLangs = Array.isArray(parsed) ? parsed : [input.ans_langs]
        } catch {
            ansLangs = [input.ans_langs]
        }
    }

    const { data, error } = await supabase
        .from("decks")
        .insert([
            {
                id: generateDeckId(),
                user_id: userId,
                name: input.name,
                que_lang: input.que_lang,
                ans_langs: ansLangs,
                diff_level: input.diff_level,
                ai_prompts: input.ai_prompts || getDefaultAIPrompts(),
            },
        ])
        .select()
        .single()

    if (error) throw new Error(`Failed to create deck: ${error.message}`)
    return data as Deck
}

/**
 * SERVER-SIDE: Get a deck by ID
 */
export async function getDeckById(id: string): Promise<Deck | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("decks")
        .select("*")
        .eq("id", id)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch deck: ${error.message}`)
    }

    return (data as Deck) || null
}

/**
 * SERVER-SIDE: Get a deck by ID and verify it belongs to the user
 */
export async function getDeckByIdForUser(id: string, userId: string): Promise<Deck | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("decks")
        .select("*")
        .eq("id", id)
        .eq("user_id", userId)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch deck: ${error.message}`)
    }

    return (data as Deck) || null
}

/**
 * SERVER-SIDE: List all decks for a specific user
 */
export async function listUserDecks(userId: string, options?: ListDecksOptions): Promise<Deck[]> {
    const supabase = await createClient()

    let query = supabase.from("decks").select("*").eq("user_id", userId)

    // Filter by question language if provided
    if (options?.que_lang) {
        query = query.eq("que_lang", options.que_lang)
    }

    // Filter by difficulty level if provided
    if (options?.diff_level) {
        query = query.eq("diff_level", options.diff_level)
    }

    // Apply pagination
    if (options?.limit) {
        query = query.limit(options.limit)
    }
    if (options?.offset) {
        query = query.range(options.offset, (options.offset + (options.limit || 10)) - 1)
    }

    const { data, error } = await query.order("created_at", { ascending: false })

    if (error) throw new Error(`Failed to list decks: ${error.message}`)
    return (data as Deck[]) || []
}

/**
 * SERVER-SIDE: Update a deck
 */
export async function updateDeck(id: string, userId: string, updates: UpdateDeckInput): Promise<Deck> {
    const supabase = await createClient()

    // Verify the deck belongs to the user
    const existing = await getDeckByIdForUser(id, userId)
    if (!existing) {
        throw new Error(`Deck not found or does not belong to user`)
    }

    // Validate name length if provided
    if (updates.name !== undefined && updates.name.length > 50) {
        throw new Error("Deck name must be 50 characters or less")
    }

    // Process ans_langs if provided
    const processedUpdates: Record<string, unknown> = { ...updates }

    if (updates.ans_langs !== undefined) {
        let ansLangs: string[] = []
        if (Array.isArray(updates.ans_langs)) {
            ansLangs = updates.ans_langs
        } else if (typeof updates.ans_langs === 'string') {
            try {
                const parsed = JSON.parse(updates.ans_langs)
                ansLangs = Array.isArray(parsed) ? parsed : [updates.ans_langs]
            } catch {
                ansLangs = [updates.ans_langs]
            }
        }
        processedUpdates.ans_langs = ansLangs
    }

    // Include ai_prompts if provided
    if (updates.ai_prompts !== undefined) {
        processedUpdates.ai_prompts = updates.ai_prompts
    }

    const { data, error } = await supabase
        .from("decks")
        .update(processedUpdates)
        .eq("id", id)
        .eq("user_id", userId)
        .select()
        .single()

    if (error) throw new Error(`Failed to update deck: ${error.message}`)
    return data as Deck
}

/**
 * SERVER-SIDE: Delete a deck
 */
export async function deleteDeck(id: string, userId: string): Promise<void> {
    const supabase = await createClient()

    // Verify the deck belongs to the user
    const existing = await getDeckByIdForUser(id, userId)
    if (!existing) {
        throw new Error(`Deck not found or does not belong to user`)
    }

    const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", id)
        .eq("user_id", userId)

    if (error) throw new Error(`Failed to delete deck: ${error.message}`)
}

/**
 * SERVER-SIDE: Delete multiple decks
 */
export async function deleteDecks(ids: string[], userId: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("decks")
        .delete()
        .in("id", ids)
        .eq("user_id", userId)

    if (error) throw new Error(`Failed to delete decks: ${error.message}`)
}

/**
 * SERVER-SIDE: Count decks for a specific user
 */
export async function countUserDecks(userId: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from("decks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

    if (error) throw new Error(`Failed to count decks: ${error.message}`)
    return count || 0
}
