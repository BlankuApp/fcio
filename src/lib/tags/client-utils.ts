import { createClient } from '@/lib/supabase/client'
import { normalizeName, handleSingleQueryError } from '@/lib/tags/utils'
import type { Tag, CreateTagInput, UpdateTagInput, ListTagsOptions } from '@/lib/types/tags'

export async function createTag(input: CreateTagInput): Promise<Tag> {
    const supabase = createClient()

    const normalized_name = normalizeName(input.name)

    const payload: Record<string, unknown> = {
        name: input.name,
        normalized_name,
    }

    // Only include optional fields if they exist
    if (input.created_by !== undefined && input.created_by !== null) {
        payload.created_by = input.created_by
    }

    const { data, error } = await supabase
        .from('tags')
        .insert(payload)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to create tag: ${error.message}`)
    }

    return data as Tag
}

export async function getTagById(id: string): Promise<Tag | null> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('id', id)
        .single()

    if (error) {
        return handleSingleQueryError(error, 'Failed to get tag')
    }

    return data as Tag
}

export async function getTagByName(name: string): Promise<Tag | null> {
    const supabase = createClient()
    const normalized = normalizeName(name)

    const { data, error } = await supabase
        .from('tags')
        .select('*')
        .eq('normalized_name', normalized)
        .single()

    if (error) {
        return handleSingleQueryError(error, 'Failed to get tag by name')
    }

    return data as Tag
}

export async function listTags(opts: ListTagsOptions = {}): Promise<Tag[]> {
    const supabase = createClient()

    const q = opts.q?.trim() ?? ''
    let query = supabase.from('tags').select('*').order('created_at', { ascending: false })

    if (q) {
        // search in name and normalized_name
        query = query.or(`name.ilike.%${q}%,normalized_name.ilike.%${q}%`)
    }

    if (opts.limit) query = query.limit(opts.limit)
    if (opts.offset) query = query.range(opts.offset, (opts.offset ?? 0) + (opts.limit ?? 100) - 1)

    const { data, error } = await query

    if (error) {
        throw new Error(`Failed to list tags: ${error.message}`)
    }

    return (data ?? []) as Tag[]
}

export async function updateTag(id: string, updates: UpdateTagInput): Promise<Tag> {
    const supabase = createClient()

    const payload: Record<string, unknown> = { ...updates }
    if (updates.name) payload.normalized_name = normalizeName(updates.name)

    const { data, error } = await supabase
        .from('tags')
        .update({ ...payload, updated_at: new Date().toISOString() })
        .eq('id', id)
        .select()
        .single()

    if (error) {
        throw new Error(`Failed to update tag: ${error.message}`)
    }

    return data as Tag
}

export async function deleteTag(id: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase.from('tags').delete().eq('id', id)
    if (error) {
        throw new Error(`Failed to delete tag: ${error.message}`)
    }
}

/**
 * Add a tag to a word (creates entry in word_tags table)
 */
export async function addTagToWord(wordId: string, tagId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('word_tags')
        .insert({
            word_id: wordId,
            tag_id: tagId,
        })

    if (error) {
        throw new Error(`Failed to add tag to word: ${error.message}`)
    }
}

/**
 * Remove a tag from a word
 */
export async function removeTagFromWord(wordId: string, tagId: string): Promise<void> {
    const supabase = createClient()

    const { error } = await supabase
        .from('word_tags')
        .delete()
        .eq('word_id', wordId)
        .eq('tag_id', tagId)

    if (error) {
        throw new Error(`Failed to remove tag from word: ${error.message}`)
    }
}

/**
 * Get all tags for a word
 */
export async function getTagsForWord(wordId: string): Promise<Tag[]> {
    const supabase = createClient()

    const { data, error } = await supabase
        .from('word_tags')
        .select('tags(*)')
        .eq('word_id', wordId)

    if (error) {
        throw new Error(`Failed to get tags for word: ${error.message}`)
    }

    type WordTagRecord = { tags: Tag[] }
    return (data as WordTagRecord[] ?? []).flatMap((record) => record.tags)
}

/**
 * Bulk add tags to multiple words
 */
export async function bulkAddTagsToWords(
    wordIds: string[],
    tagIds: string[]
): Promise<void> {
    const supabase = createClient()

    const insertData = wordIds.flatMap((wordId) =>
        tagIds.map((tagId) => ({
            word_id: wordId,
            tag_id: tagId,
        }))
    )

    const { error } = await supabase
        .from('word_tags')
        .insert(insertData)

    if (error) {
        throw new Error(`Failed to bulk add tags to words: ${error.message}`)
    }
}

