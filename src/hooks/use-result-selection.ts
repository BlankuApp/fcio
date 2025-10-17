/**
 * Hook for managing result selection state with common operations
 */

import { useState } from "react"
import type { ParsedResultType } from "@/lib/types/words"
import { isValidParsedResult } from "@/lib/words/parse-batch-results"

export function useResultSelection() {
    const [selectedResults, setSelectedResults] = useState<Set<number>>(
        new Set()
    )

    /**
     * Toggle selection of a single result
     */
    const toggleResult = (index: number, checked: boolean) => {
        const newSelected = new Set(selectedResults)
        if (checked) {
            newSelected.add(index)
        } else {
            newSelected.delete(index)
        }
        setSelectedResults(newSelected)
    }

    /**
     * Select all valid results (non-error results)
     */
    const selectAll = (results: ParsedResultType[]) => {
        const allValidIndices = new Set<number>()
        results.forEach((result, index) => {
            if (isValidParsedResult(result)) {
                allValidIndices.add(index)
            }
        })
        setSelectedResults(allValidIndices)
    }

    /**
     * Deselect all results
     */
    const deselectAll = () => {
        setSelectedResults(new Set())
    }

    /**
     * Invert the current selection
     */
    const invertSelection = (results: ParsedResultType[]) => {
        const inverted = new Set<number>()
        results.forEach((result, index) => {
            if (isValidParsedResult(result)) {
                if (!selectedResults.has(index)) {
                    inverted.add(index)
                }
            }
        })
        setSelectedResults(inverted)
    }

    /**
     * Select only new words (words without existingWord property)
     */
    const selectOnlyNewWords = (results: ParsedResultType[]) => {
        const onlyNew = new Set<number>()
        results.forEach((result, index) => {
            if (isValidParsedResult(result) && !result.existingWord) {
                onlyNew.add(index)
            }
        })
        setSelectedResults(onlyNew)
    }

    /**
     * Select only existing words (words with existingWord property)
     */
    const selectOnlyExisting = (results: ParsedResultType[]) => {
        const onlyExisting = new Set<number>()
        results.forEach((result, index) => {
            if (isValidParsedResult(result) && result.existingWord) {
                onlyExisting.add(index)
            }
        })
        setSelectedResults(onlyExisting)
    }

    /**
     * Clear all selections and reset state
     */
    const reset = () => {
        setSelectedResults(new Set())
    }

    return {
        selectedResults,
        setSelectedResults,
        toggleResult,
        selectAll,
        deselectAll,
        invertSelection,
        selectOnlyNewWords,
        selectOnlyExisting,
        reset,
    }
}
