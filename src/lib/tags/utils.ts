/**
 * Shared utility functions for tags module
 */

/**
 * Normalize a tag name for consistent comparison and storage
 * Converts to lowercase, trims whitespace, and replaces spaces with underscores
 */
export function normalizeName(name: string): string {
    return name.trim().toLowerCase().replace(/\s+/g, '_')
}

/**
 * Handle single() query results with consistent error handling
 * Returns null for "not found" errors (PGRST116), throws for other errors
 */
export function handleSingleQueryError(error: { code?: string; message: string }, context: string): null {
    if (error.code === 'PGRST116') return null
    throw new Error(`${context}: ${error.message}`)
}
