"use client"

import { useState, useEffect } from "react"
import { ColumnDef } from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Badge } from "@/components/ui/badge"
import { Search, MoreHorizontal } from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { DataTable } from "@/components/ui/data-table"
import { listWords, updateWord, deleteWord } from "@/lib/words/client-utils"
import { getTagsForWord } from "@/lib/tags/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import { WordEditDialog } from "@/components/word-edit-dialog"
import { useWordEditor } from "@/hooks/use-word-editor"
import type { Word } from "@/lib/types/words"
import type { Tag } from "@/lib/types/tags"

interface WordWithTags extends Word {
    tags?: Tag[]
}

interface WordsListClientProps {
    initialWords?: Word[]
}

// Define columns for the DataTable
const createColumns = (
    onOpenWord: (word: WordWithTags) => void
): ColumnDef<WordWithTags>[] => [
        {
            id: "select",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            header: ({ table }: any) => (
                <Checkbox
                    checked={
                        table.getIsAllPageRowsSelected() ||
                        (table.getIsSomePageRowsSelected() && "indeterminate")
                    }
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onCheckedChange={(value: any) =>
                        table.toggleAllPageRowsSelected(!!value)
                    }
                    aria-label="Select all"
                />
            ),
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <Checkbox
                    checked={row.getIsSelected()}
                    // eslint-disable-next-line @typescript-eslint/no-explicit-any
                    onCheckedChange={(value: any) => row.toggleSelected(!!value)}
                    aria-label="Select row"
                />
            ),
            enableSorting: false,
            enableHiding: false,
        },
        {
            accessorKey: "lemma",
            header: "Word",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => (
                <div className="font-medium">{row.getValue("lemma")}</div>
            ),
        },
        {
            accessorKey: "lang",
            header: "Language",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
                const lang = row.getValue("lang") as string
                const langName =
                    LANGUAGES.find((l) => l.code === lang)?.name || lang
                return <Badge variant="outline">{langName}</Badge>
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            filterFn: (row: any, id: string, value: string) => {
                return value === "" || row.getValue(id) === value
            },
        },
        {
            id: "tags",
            header: "Tags",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
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
            enableColumnFilter: false,
        },
        {
            id: "actions",
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            cell: ({ row }: any) => {
                return (
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button
                                variant="ghost"
                                className="h-8 w-8 p-0"
                            >
                                <span className="sr-only">Open menu</span>
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem
                                onClick={() => onOpenWord(row.original)}
                            >
                                View Details
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                )
            },
            enableSorting: false,
            enableColumnFilter: false,
        },
    ]

export function WordsListClient({
    initialWords = [],
}: WordsListClientProps) {
    const [words, setWords] = useState<WordWithTags[]>(initialWords)
    const [loading, setLoading] = useState(initialWords.length === 0)

    // Use custom hook for word editor state management
    const [editorState, editorActions] = useWordEditor()

    // Load words on mount
    useEffect(() => {
        if (initialWords.length === 0) {
            loadWords()
        } else {
            loadTagsForWords(initialWords)
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    const loadWords = async () => {
        try {
            setLoading(true)
            const data = await listWords()
            await loadTagsForWords(data)
        } catch (error) {
            console.error("Error loading words:", error)
            alert("Failed to load words")
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

    const handleOpenWord = (word: WordWithTags) => {
        // eslint-disable-next-line @typescript-eslint/no-unused-vars
        const { tags, ...wordData } = word
        editorActions.openWord(wordData)
    }

    const handleSaveWord = async () => {
        if (!editorState.editedWord) return

        try {
            editorActions.setSaving(true)
            await updateWord(editorState.editedWord.id, {
                lemma: editorState.editedWord.lemma,
                lang: editorState.editedWord.lang,
                collocations: editorState.editedWord.collocations,
            })
            setWords((prev) =>
                prev.map((w) =>
                    w.id === editorState.editedWord!.id
                        ? { ...editorState.editedWord!, tags: w.tags }
                        : w
                )
            )
            editorActions.exitEditMode()
            alert("Word updated successfully")
        } catch (error) {
            console.error("Error saving word:", error)
            alert("Failed to save word")
        } finally {
            editorActions.setSaving(false)
        }
    }

    const handleDeleteWord = async () => {
        if (
            !editorState.selectedWord ||
            !window.confirm(
                `Are you sure you want to delete "${editorState.selectedWord.lemma}"?`
            )
        )
            return

        try {
            editorActions.setDeleting(true)
            await deleteWord(editorState.selectedWord.id)
            setWords((prev) =>
                prev.filter((w) => w.id !== editorState.selectedWord!.id)
            )
            editorActions.closeDialog()
            alert("Word deleted successfully")
        } catch (error) {
            console.error("Error deleting word:", error)
            alert("Failed to delete word")
        } finally {
            editorActions.setDeleting(false)
        }
    }

    const languageFilterOptions = LANGUAGES.map((lang) => ({
        label: lang.name,
        value: lang.code,
    }))

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-3 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">
                        Words Library
                    </h1>
                    <p className="text-muted-foreground">
                        Search, filter, and manage your words
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">
                            Loading words...
                        </p>
                    </div>
                ) : words.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No words found</p>
                    </div>
                ) : (
                    <DataTable
                        columns={createColumns(handleOpenWord)}
                        data={words}
                        searchPlaceholder="Search by word..."
                        searchKey="lemma"
                        filterBy={[
                            {
                                key: "lang",
                                label: "Filter by Language",
                                options: languageFilterOptions,
                            },
                        ]}
                    />
                )}

                {/* Word Edit Dialog */}
                <WordEditDialog
                    isOpen={editorState.isDialogOpen}
                    isEditing={editorState.isEditing}
                    isSaving={editorState.isSaving}
                    isDeleting={editorState.isDeleting}
                    selectedWord={editorState.selectedWord}
                    editedWord={editorState.editedWord}
                    onClose={editorActions.closeDialog}
                    onEnterEditMode={editorActions.enterEditMode}
                    onExitEditMode={editorActions.exitEditMode}
                    onUpdateLemma={editorActions.updateLemma}
                    onUpdateLanguage={editorActions.updateLanguage}
                    onAddCollocation={editorActions.addCollocation}
                    onRemoveCollocation={editorActions.removeCollocation}
                    onUpdateCollocation={editorActions.updateCollocation}
                    onSave={handleSaveWord}
                    onDelete={handleDeleteWord}
                />
            </div>
        </div>
    )
}
