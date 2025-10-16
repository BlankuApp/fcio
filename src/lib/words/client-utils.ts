/**
 * Client-side utilities for words table operations
 * Use this file in "use client" components
 */

import { createClient } from "@/lib/supabase/client"
import {
    Word,
    CreateWordInput,
    UpdateWordInput,
    ListWordsOptions,
    CollocationsPattern,
} from "@/lib/types/words"

/**
 * Create a new word entry
 */
export async function createWord(input: CreateWordInput): Promise<Word> {
    const supabase = createClient()

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
    const supabase = createClient()

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
    const supabase = createClient()

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
    const supabase = createClient()
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
    const supabase = createClient()

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
    const supabase = createClient()

    const { data, error } = await supabase
        .from("words")
        .update({
            collocations: input.collocations,
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
    const supabase = createClient()

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
    const supabase = createClient()

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
    const supabase = createClient()

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
 * Merges new collocations with existing ones instead of replacing
 */
export async function upsertWord(input: CreateWordInput): Promise<Word> {
    const supabase = createClient()

    // Check if word already exists
    const existingWordsMap = await checkExistingWords([
        { lemma: input.lemma, lang: input.lang }
    ])

    const key = `${input.lemma}|${input.lang}`
    const existingWord = existingWordsMap.get(key)

    const { data, error } = await supabase
        .from("words")
        .upsert(
            {
                lemma: input.lemma,
                lang: input.lang,
                collocations: existingWord
                    ? mergeCollocations(existingWord.collocations, input.collocations)
                    : input.collocations,
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
    const supabase = createClient()

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
    const supabase = createClient()

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
    const supabase = createClient()

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
    const supabase = createClient()

    const { count, error } = await supabase
        .from("words")
        .select("*", { count: "exact", head: true })

    if (error) throw new Error(`Failed to count words: ${error.message}`)
    return count || 0
}

/**
 * Check which words already exist in the database by (lemma, lang) pairs
 * Returns map of "lemma|lang" -> Word for existing words
 */
export async function checkExistingWords(
    words: Array<{ lemma: string; lang: string }>
): Promise<Map<string, Word>> {
    const supabase = createClient()
    const existingMap = new Map<string, Word>()

    if (words.length === 0) return existingMap

    // Get unique languages to query
    const languages = Array.from(new Set(words.map(w => w.lang)))

    // Query all words for the given languages
    const { data, error } = await supabase
        .from("words")
        .select("*")
        .in("lang", languages)

    if (error) {
        throw new Error(`Failed to check existing words: ${error.message}`)
    }

    if (data) {
        data.forEach((word: Word) => {
            const key = `${word.lemma}|${word.lang}`
            existingMap.set(key, word)
        })
    }

    return existingMap
}

/**
 * Merge new collocations with existing ones, avoiding duplicates
 * Returns merged collocations with all unique entries
 */
function mergeCollocations(
    existing: CollocationsPattern,
    newCollocations: CollocationsPattern
): CollocationsPattern {
    const merged: CollocationsPattern = { ...existing }

    // Process each pattern in new collocations
    Object.entries(newCollocations).forEach(([pattern, newItems]) => {
        if (!merged[pattern]) {
            // Pattern doesn't exist, add all new items
            merged[pattern] = newItems as Array<{ collocation: string; difficulty: string }>
        } else {
            // Pattern exists, merge items and remove duplicates
            const existingItems = merged[pattern] as Array<{ collocation: string; difficulty: string }>
            const existingCollocationSet = new Set(
                existingItems.map((item) => item.collocation.toLowerCase())
            )

            // Add only new unique collocations (case-insensitive check)
            const uniqueNewItems = (newItems as Array<{ collocation: string; difficulty: string }>).filter(
                (newItem) => !existingCollocationSet.has(newItem.collocation.toLowerCase())
            )

            // Combine: existing items + unique new items
            merged[pattern] = [...existingItems, ...uniqueNewItems]
        }
    })

    return merged
}

/**
 * Bulk upsert words (insert or update if exists by lemma + lang)
 * Use this for batch processing when duplicates might exist
 * Merges new collocations with existing ones instead of replacing
 */
export async function bulkUpsertWords(inputs: CreateWordInput[]): Promise<Word[]> {
    const supabase = createClient()

    // Get existing words to merge collocations
    const existingWordsMap = await checkExistingWords(
        inputs.map(input => ({ lemma: input.lemma, lang: input.lang }))
    )

    // Prepare upsert data with merged collocations
    const upsertData = inputs.map(input => {
        const key = `${input.lemma}|${input.lang}`
        const existingWord = existingWordsMap.get(key)

        return {
            lemma: input.lemma,
            lang: input.lang,
            collocations: existingWord
                ? mergeCollocations(existingWord.collocations, input.collocations)
                : input.collocations,
        }
    })

    const { data, error } = await supabase
        .from("words")
        .upsert(upsertData, {
            onConflict: "lemma,lang",
        })
        .select()

    if (error) throw new Error(`Failed to bulk upsert words: ${error.message}`)
    return (data as Word[]) || []
}
