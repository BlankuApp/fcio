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
        query = query.ilike('name', `%${q}%`).or(`normalized_name.ilike.%${q}%`)
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
