import { useState, useCallback } from "react"
import type { Word } from "@/lib/types/words"

interface EditState {
    selectedWord: Word | null
    editedWord: Word | null
    isDialogOpen: boolean
    isEditing: boolean
    isSaving: boolean
    isDeleting: boolean
    wordTags: string[] // IDs of tags associated with the current word
}

interface EditActions {
    openWord: (word: Word) => void
    closeDialog: () => void
    enterEditMode: () => void
    exitEditMode: () => void
    updateLemma: (lemma: string) => void
    updateLanguage: (lang: string) => void
    addCollocation: () => void
    removeCollocation: (pattern: string, index: number) => void
    updateCollocation: (pattern: string, index: number, field: "collocation" | "difficulty", value: string) => void
    setSaving: (saving: boolean) => void
    setDeleting: (deleting: boolean) => void
    resetEditedWord: () => void
    setWordTags: (tagIds: string[]) => void
}

export function useWordEditor(): [EditState, EditActions] {
    const [selectedWord, setSelectedWord] = useState<Word | null>(null)
    const [editedWord, setEditedWord] = useState<Word | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [wordTags, setWordTagsState] = useState<string[]>([])

    const openWord = useCallback((word: Word) => {
        setSelectedWord(word)
        setEditedWord(structuredClone(word))
        setIsEditing(false)
        setIsDialogOpen(true)
        setWordTagsState([]) // Reset tags when opening a new word
    }, [])

    const closeDialog = useCallback(() => {
        setIsDialogOpen(false)
        setSelectedWord(null)
        setEditedWord(null)
        setIsEditing(false)
    }, [])

    const enterEditMode = useCallback(() => {
        setIsEditing(true)
    }, [])

    const exitEditMode = useCallback(() => {
        setIsEditing(false)
        setEditedWord(selectedWord ? structuredClone(selectedWord) : null)
    }, [selectedWord])

    const updateLemma = useCallback((lemma: string) => {
        setEditedWord(prev => prev ? { ...prev, lemma } : null)
    }, [])

    const updateLanguage = useCallback((lang: string) => {
        setEditedWord(prev => prev ? { ...prev, lang } : null)
    }, [])

    const addCollocation = useCallback(() => {
        setEditedWord(prev => {
            if (!prev) return null
            const pattern = "object"
            return {
                ...prev,
                collocations: {
                    ...prev.collocations,
                    [pattern]: [
                        ...(prev.collocations[pattern] || []),
                        { collocation: "", difficulty: "elementary" }
                    ]
                }
            }
        })
    }, [])

    const removeCollocation = useCallback((pattern: string, index: number) => {
        setEditedWord(prev => {
            if (!prev) return null
            const updatedCollocations = [...prev.collocations[pattern]]
            updatedCollocations.splice(index, 1)

            const newCollocations = { ...prev.collocations }
            if (updatedCollocations.length > 0) {
                newCollocations[pattern] = updatedCollocations
            } else {
                delete newCollocations[pattern]
            }

            return {
                ...prev,
                collocations: newCollocations
            }
        })
    }, [])

    const updateCollocation = useCallback((pattern: string, index: number, field: "collocation" | "difficulty", value: string) => {
        setEditedWord(prev => {
            if (!prev) return null
            const collocations = prev.collocations[pattern]
            if (!collocations) return prev

            return {
                ...prev,
                collocations: {
                    ...prev.collocations,
                    [pattern]: collocations.map((col, i) => {
                        if (i !== index) return col
                        return field === "collocation"
                            ? { ...col, collocation: value }
                            : { ...col, difficulty: value }
                    })
                }
            }
        })
    }, [])

    const setSaving = useCallback((saving: boolean) => {
        setIsSaving(saving)
    }, [])

    const setDeleting = useCallback((deleting: boolean) => {
        setIsDeleting(deleting)
    }, [])

    const resetEditedWord = useCallback(() => {
        if (selectedWord) {
            setEditedWord(structuredClone(selectedWord))
        }
    }, [selectedWord])

    const setWordTags = useCallback((tagIds: string[]) => {
        setWordTagsState(tagIds)
    }, [])

    const state: EditState = {
        selectedWord,
        editedWord,
        isDialogOpen,
        isEditing,
        isSaving,
        isDeleting,
        wordTags
    }

    const actions: EditActions = {
        openWord,
        closeDialog,
        enterEditMode,
        exitEditMode,
        updateLemma,
        updateLanguage,
        addCollocation,
        removeCollocation,
        updateCollocation,
        setSaving,
        setDeleting,
        resetEditedWord,
        setWordTags
    }

    return [state, actions]
}
