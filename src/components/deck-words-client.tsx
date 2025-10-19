"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Badge } from "@/components/ui/badge"
import { DataTable } from "@/components/ui/data-table"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { getWordsByLanguage } from "@/lib/words/client-utils"
import { getTagsForWord, listTags } from "@/lib/tags/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import type { Word } from "@/lib/types/words"
import type { Tag } from "@/lib/types/tags"

interface DeckWordsClientProps {
    languageCode: string
    initialWords?: Word[]
}

interface WordWithTags extends Word {
    tags?: Tag[]
}

// Define columns for the DataTable
const createColumns = (): ColumnDef<WordWithTags>[] => [
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
        }
        loadAllTags()
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [languageCode])

    const loadWords = async () => {
        try {
            setLoading(true)
            setError(null)
            const data = await getWordsByLanguage(languageCode)
            await loadTagsForWords(data)
        } catch (err) {
            const errorMessage = err instanceof Error ? err.message : "Failed to load words"
            setError(errorMessage)
            console.error("Error loading words:", err)
            setWords([])
        } finally {
            setLoading(false)
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
                        columns={createColumns()}
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
