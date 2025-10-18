export interface Tag {
    id: string
    name: string
    normalized_name: string
    created_by?: string | null
    created_at?: string
    updated_at?: string
}

export interface CreateTagInput {
    name: string
    created_by?: string | null
}

export interface UpdateTagInput {
    name?: string
}

export interface ListTagsOptions {
    limit?: number
    offset?: number
    q?: string
}
