/**
 * Types for the words table and related operations
 */

export interface Collocation {
    collocation: string
    difficulty: string
}

export interface CollocationsPattern {
    [pattern: string]: Collocation[]
}

/**
 * Word record from the database
 */
export interface Word {
    id: string
    lemma: string
    lang: string
    collocations: CollocationsPattern
    created_at?: string
    updated_at?: string
}

/**
 * Input for creating a new word
 */
export interface CreateWordInput {
    lemma: string
    lang: string
    collocations: CollocationsPattern
}

/**
 * Input for updating a word
 */
export interface UpdateWordInput {
    collocations?: CollocationsPattern
}

/**
 * Query options for listing words
 */
export interface ListWordsOptions {
    lang?: string
    limit?: number
    offset?: number
}
