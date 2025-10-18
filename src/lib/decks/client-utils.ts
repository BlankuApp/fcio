/**
 * Client-side utilities for decks table operations
 * Use this file in "use client" components
 */

import { createClient } from "@/lib/supabase/client"
import type { Deck, CreateDeckInput, UpdateDeckInput, ListDecksOptions } from "@/lib/types/deck"

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
 * CLIENT-SIDE: Create a new deck
 */
export async function createDeck(userId: string, input: CreateDeckInput): Promise<Deck> {
    const supabase = createClient()

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
            },
        ])
        .select()
        .single()

    if (error) throw new Error(`Failed to create deck: ${error.message}`)
    return data as Deck
}

/**
 * CLIENT-SIDE: Get a deck by ID
 */
export async function getDeckById(id: string): Promise<Deck | null> {
    const supabase = createClient()

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
 * CLIENT-SIDE: List all decks for the current user
 */
export async function listUserDecks(userId: string, options?: ListDecksOptions): Promise<Deck[]> {
    const supabase = createClient()

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
 * CLIENT-SIDE: Update a deck
 */
export async function updateDeck(id: string, updates: UpdateDeckInput): Promise<Deck> {
    const supabase = createClient()

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

    const { data, error } = await supabase
        .from("decks")
        .update(processedUpdates)
        .eq("id", id)
        .select()
        .single()

    if (error) throw new Error(`Failed to update deck: ${error.message}`)
    return data as Deck
}

/**
 * CLIENT-SIDE: Delete a deck
 */
export async function deleteDeck(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from("decks")
        .delete()
        .eq("id", id)

    if (error) throw new Error(`Failed to delete deck: ${error.message}`)
}

/**
 * CLIENT-SIDE: Delete multiple decks
 */
export async function deleteDecks(ids: string[]): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from("decks")
        .delete()
        .in("id", ids)

    if (error) throw new Error(`Failed to delete decks: ${error.message}`)
}

/**
 * CLIENT-SIDE: Count decks for the current user
 */
export async function countUserDecks(userId: string): Promise<number> {
    const supabase = createClient()

    const { count, error } = await supabase
        .from("decks")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId)

    if (error) throw new Error(`Failed to count decks: ${error.message}`)
    return count || 0
}
