/**
 * Server-side utilities for words table operations
 * Use this file in Server Components, API routes, and server actions
 */

import { createClient } from "@/lib/supabase/server"
import {
    Word,
    CreateWordInput,
    UpdateWordInput,
    ListWordsOptions,
} from "@/lib/types/words"

/**
 * Create a new word entry
 */
export async function createWord(input: CreateWordInput): Promise<Word> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .insert([
            {
                lemma: input.lemma,
                lang: input.lang,
                collocations: input.collocations,
            },
        ])
        .select()
        .single()

    if (error) throw new Error(`Failed to create word: ${error.message}`)
    return data as Word
}

/**
 * Get a word by ID
 */
export async function getWordById(id: string): Promise<Word | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("id", id)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch word: ${error.message}`)
    }

    return (data as Word) || null
}

/**
 * Get a word by lemma and language
 */
export async function getWordByLemmaAndLang(
    lemma: string,
    lang: string
): Promise<Word | null> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("lemma", lemma)
        .eq("lang", lang)
        .single()

    if (error && error.code !== "PGRST116") {
        throw new Error(`Failed to fetch word: ${error.message}`)
    }

    return (data as Word) || null
}

/**
 * List words with optional filtering
 */
export async function listWords(options?: ListWordsOptions): Promise<Word[]> {
    const supabase = await createClient()
    const limit = options?.limit || 50
    const offset = options?.offset || 0

    let query = supabase.from("words").select("*")

    if (options?.lang) {
        query = query.eq("lang", options.lang)
    }

    const { data, error } = await query.range(offset, offset + limit - 1)

    if (error) throw new Error(`Failed to list words: ${error.message}`)
    return (data as Word[]) || []
}

/**
 * Get all words for a specific language
 */
export async function getWordsByLanguage(lang: string): Promise<Word[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("lang", lang)

    if (error) throw new Error(`Failed to fetch words for language: ${error.message}`)
    return (data as Word[]) || []
}

/**
 * Update a word's collocations
 */
export async function updateWord(
    id: string,
    input: UpdateWordInput
): Promise<Word> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .update({
            collocations: input.collocations,
            updated_at: new Date().toISOString(),
        })
        .eq("id", id)
        .select()
        .single()

    if (error) throw new Error(`Failed to update word: ${error.message}`)
    return data as Word
}

/**
 * Delete a word by ID
 */
export async function deleteWord(id: string): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase.from("words").delete().eq("id", id)

    if (error) throw new Error(`Failed to delete word: ${error.message}`)
}

/**
 * Delete a word by lemma and language
 */
export async function deleteWordByLemmaAndLang(
    lemma: string,
    lang: string
): Promise<void> {
    const supabase = await createClient()

    const { error } = await supabase
        .from("words")
        .delete()
        .eq("lemma", lemma)
        .eq("lang", lang)

    if (error)
        throw new Error(`Failed to delete word: ${error.message}`)
}

/**
 * Bulk create words (for batch processing results)
 */
export async function bulkCreateWords(inputs: CreateWordInput[]): Promise<Word[]> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .insert(
            inputs.map((input) => ({
                lemma: input.lemma,
                lang: input.lang,
                collocations: input.collocations,
            }))
        )
        .select()

    if (error) throw new Error(`Failed to bulk create words: ${error.message}`)
    return (data as Word[]) || []
}

/**
 * Upsert a word (insert or update if exists by lemma + lang)
 */
export async function upsertWord(input: CreateWordInput): Promise<Word> {
    const supabase = await createClient()

    const { data, error } = await supabase
        .from("words")
        .upsert(
            {
                lemma: input.lemma,
                lang: input.lang,
                collocations: input.collocations,
                updated_at: new Date().toISOString(),
            },
            {
                onConflict: "lemma,lang",
            }
        )
        .select()
        .single()

    if (error) throw new Error(`Failed to upsert word: ${error.message}`)
    return data as Word
}

/**
 * Search words by lemma pattern (case-insensitive)
 */
export async function searchWords(
    pattern: string,
    lang?: string,
    limit?: number
): Promise<Word[]> {
    const supabase = await createClient()

    let query = supabase
        .from("words")
        .select("*")
        .ilike("lemma", `%${pattern}%`)

    if (lang) {
        query = query.eq("lang", lang)
    }

    const { data, error } = await query.limit(limit || 20)

    if (error) throw new Error(`Failed to search words: ${error.message}`)
    return (data as Word[]) || []
}

/**
 * Get distinct languages in the words table
 */
export async function getAvailableLanguages(): Promise<string[]> {
    const supabase = await createClient()

    // Get all words and extract unique languages
    const { data, error } = await supabase
        .from("words")
        .select("lang")

    if (error)
        throw new Error(`Failed to fetch available languages: ${error.message}`)

    if (data) {
        return Array.from(new Set(data.map((row: { lang: string }) => row.lang)))
    }

    return []
}

/**
 * Count words by language
 */
export async function countWordsByLanguage(lang: string): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from("words")
        .select("*", { count: "exact", head: true })
        .eq("lang", lang)

    if (error) throw new Error(`Failed to count words: ${error.message}`)
    return count || 0
}

/**
 * Get total word count
 */
export async function getTotalWordCount(): Promise<number> {
    const supabase = await createClient()

    const { count, error } = await supabase
        .from("words")
        .select("*", { count: "exact", head: true })

    if (error) throw new Error(`Failed to count words: ${error.message}`)
    return count || 0
}
