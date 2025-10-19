"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Toggle } from "@/components/ui/toggle"
import { getWordsByLanguage } from "@/lib/words/client-utils"
import { getTagsForWord, listTags } from "@/lib/tags/client-utils"
import {
    addWordToDeck,
    removeWordFromDeck,
    wordExistsInDeck,
} from "@/lib/decks/deck-words-client"
import { LANGUAGES } from "@/lib/constants/languages"
import { Plus, Check } from "lucide-react"
import type { Word } from "@/lib/types/words"
import type { Tag } from "@/lib/types/tags"

interface DeckWordsClientProps {
    languageCode: string
    deckId: string
    initialWords?: Word[]
}

interface WordWithTags extends Word {
    tags?: Tag[]
    inDeck?: boolean
    isLoading?: boolean
}

// Define columns for the DataTable
const createColumns = (deckId: string, onToggle: (wordId: string, inDeck: boolean) => void): ColumnDef<WordWithTags>[] => [
    {
        id: "addToDeck",
        header: "Add to deck",
        size: 40,
        minSize: 40,
        maxSize: 40,
        enableResizing: false,
        cell: ({ row }) => (
            <div className="flex justify-center w-10">
                <Toggle
                    pressed={row.original.inDeck}
                    onPressedChange={() =>
                        onToggle(row.original.id, !row.original.inDeck)
                    }
                    disabled={row.original.isLoading}
                    className="data-[state=on]:bg-primary data-[state=on]:text-primary-foreground h-8 w-8 p-0"
                    aria-label="Toggle word in deck"
                >
                    {row.original.isLoading ? (
                        <div className="w-4 h-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                    ) : row.original.inDeck ? (
                        <Check className="w-4 h-4" />
                    ) : (
                        <Plus className="w-4 h-4" />
                    )}
                </Toggle>
            </div>
        ),
        enableSorting: false,
        enableColumnFilter: false,
    },
    {
        accessorKey: "lemma",
        header: "Word",
        cell: ({ row }) => (
            <div className="font-medium">{row.getValue("lemma")}</div>
        ),
    },
    {
        id: "collocationCount",
        header: "Collocations",
        cell: ({ row }) => {
            const collocations = row.original.collocations || {}
            const totalCount = Object.values(collocations).reduce(
                (sum, items) => sum + (Array.isArray(items) ? items.length : 0),
                0
            )
            return (
                <Badge variant="secondary">
                    {totalCount} collocation{totalCount !== 1 ? "s" : ""}
                </Badge>
            )
        },
    },
    {
        id: "tags",
        header: "Tags",
        cell: ({ row }) => {
            const tags = row.original.tags || []
            if (tags.length === 0) {
                return (
                    <span className="text-sm text-muted-foreground">
                        No tags
                    </span>
                )
            }
            return (
                <div className="flex flex-wrap gap-1">
                    {tags.map((tag: Tag) => (
                        <Badge key={tag.id} variant="secondary">
                            {tag.name}
                        </Badge>
                    ))}
                </div>
            )
        },
        enableSorting: false,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        filterFn: (row: any, id: string, value: string) => {
            if (!value) return true
            const tags = row.original.tags || []
            return tags.some((tag: Tag) => tag.id === value)
        },
    },
]

export function DeckWordsClient({
    languageCode,
    deckId,
    initialWords = [],
}: DeckWordsClientProps) {
    const [words, setWords] = useState<WordWithTags[]>(initialWords)
    const [loading, setLoading] = useState(initialWords.length === 0)
    const [error, setError] = useState<string | null>(null)
    const [allTags, setAllTags] = useState<Tag[]>([])

    // Load words on mount if not provided
    useEffect(() => {
        if (initialWords.length === 0) {
            loadWords()
        } else {
            loadTagsForWords(initialWords)
            checkWordsInDeck(initialWords)
        }
        loadAllTags()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [languageCode, deckId])

    const loadWords = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getWordsByLanguage(languageCode)
            await loadTagsForWords(data)
            await checkWordsInDeck(data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load words"
            setError(errorMessage)
            console.error("Error loading words:", err)
            setWords([])
        } finally {
            setLoading(false)
        }
    }

    const checkWordsInDeck = async (wordsData: Word[]) => {
        try {
            const wordsWithStatus = await Promise.all(
                wordsData.map(async (word) => {
                    try {
                        const inDeck = await wordExistsInDeck(deckId, word.id)
                        return { ...word, inDeck, isLoading: false }
                    } catch (error) {
                        console.error(
                            `Error checking if word ${word.id} is in deck:`,
                            error
                        )
                        return { ...word, inDeck: false, isLoading: false }
                    }
                })
            )
            setWords((prev) =>
                prev.map((word) => {
                    const updated = wordsWithStatus.find((w) => w.id === word.id)
                    return updated ? { ...word, ...updated } : word
                })
            )
        } catch (error) {
            console.error("Error checking words in deck:", error)
        }
    }

    const loadTagsForWords = async (wordsData: Word[]) => {
        try {
            const wordsWithTags = await Promise.all(
                wordsData.map(async (word) => {
                    try {
                        const tags = await getTagsForWord(word.id)
                        return { ...word, tags }
                    } catch (error) {
                        console.error(
                            `Error loading tags for word ${word.id}:`,
                            error
                        )
                        return { ...word, tags: [] }
                    }
                })
            )
            setWords(wordsWithTags)
        } catch (error) {
            console.error("Error loading tags for words:", error)
            setWords(wordsData.map((word) => ({ ...word, tags: [] })))
        }
    }

    const loadAllTags = async () => {
        try {
            const tags = await listTags({ limit: 1000 })
            setAllTags(tags)
        } catch (error) {
            console.error("Error loading tags:", error)
            setAllTags([])
        }
    }

    const handleToggleWord = async (wordId: string, shouldAdd: boolean) => {
        try {
            // Update UI immediately for optimistic update
            setWords((prev) =>
                prev.map((word) =>
                    word.id === wordId ? { ...word, isLoading: true } : word
                )
            )

            if (shouldAdd) {
                await addWordToDeck(deckId, { word_id: wordId })
            } else {
                await removeWordFromDeck(deckId, wordId)
            }

            // Update the word's status
            setWords((prev) =>
                prev.map((word) =>
                    word.id === wordId
                        ? { ...word, inDeck: shouldAdd, isLoading: false }
                        : word
                )
            )
        } catch (error) {
            const errorMessage =
                error instanceof Error
                    ? error.message
                    : "Failed to update word"
            console.error("Error toggling word:", error)
            setError(errorMessage)

            // Revert UI on error
            setWords((prev) =>
                prev.map((word) =>
                    word.id === wordId
                        ? { ...word, inDeck: !shouldAdd, isLoading: false }
                        : word
                )
            )
        }
    }

    const language = LANGUAGES.find((l) => l.code === languageCode)

    const tagFilterOptions = allTags.map((tag) => ({
        label: tag.name,
        value: tag.id,
    }))

    return (
        <Card>
            <CardHeader>
                <div className="space-y-2">
                    <CardTitle>
                        Words for {language?.name || languageCode}
                    </CardTitle>
                    <CardDescription>
                        {words.length} word{words.length !== 1 ? "s" : ""} available for this language
                    </CardDescription>
                </div>
            </CardHeader>
            <CardContent>
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading words...</p>
                    </div>
                ) : error ? (
                    <div className="text-center py-12">
                        <p className="text-destructive">{error}</p>
                    </div>
                ) : words.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            No words found for this language
                        </p>
                    </div>
                ) : (
                    <DataTable
                        columns={createColumns(deckId, handleToggleWord)}
                        data={words}
                        searchPlaceholder="Search by word..."
                        searchKey="lemma"
                        filterBy={
                            tagFilterOptions.length > 0
                                ? [
                                    {
                                        key: "tags",
                                        label: "Filter by Tag",
                                        options: tagFilterOptions,
                                    },
                                ]
                                : undefined
                        }
                    />
                )}
            </CardContent>
        </Card>
    )
}
