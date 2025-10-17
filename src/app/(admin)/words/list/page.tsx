"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit2 } from "lucide-react"
import { listWords, updateWord, deleteWord } from "@/lib/words/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import { WordEditDialog } from "@/components/word-edit-dialog"
import { useWordEditor } from "@/hooks/use-word-editor"
import type { Word } from "@/lib/types/words"

export default function WordsListPage() {
    const [words, setWords] = useState<Word[]>([])
    const [filteredWords, setFilteredWords] = useState<Word[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLanguage, setFilterLanguage] = useState<string>("all")

    // Use custom hook for word editor state management
    const [editorState, editorActions] = useWordEditor()

    // Load words on mount
    useEffect(() => {
        loadWords()
    }, [])

    // Filter words when search or filter changes
    useEffect(() => {
        let result = words

        if (searchQuery) {
            result = result.filter(w =>
                w.lemma.toLowerCase().includes(searchQuery.toLowerCase())
            )
        }

        if (filterLanguage && filterLanguage !== "all") {
            result = result.filter(w => w.lang === filterLanguage)
        }

        setFilteredWords(result)
    }, [words, searchQuery, filterLanguage])

    const loadWords = async () => {
        try {
            setLoading(true)
            const data = await listWords()
            setWords(data)
        } catch (error) {
            console.error("Error loading words:", error)
            alert("Failed to load words")
        } finally {
            setLoading(false)
        }
    }

    const handleOpenWord = (word: Word) => {
        editorActions.openWord(word)
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
            setWords(words.map(w => w.id === editorState.editedWord!.id ? editorState.editedWord! : w))
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
        if (!editorState.selectedWord || !window.confirm(`Are you sure you want to delete "${editorState.selectedWord.lemma}"?`)) return

        try {
            editorActions.setDeleting(true)
            await deleteWord(editorState.selectedWord.id)
            setWords(words.filter(w => w.id !== editorState.selectedWord!.id))
            editorActions.closeDialog()
            alert("Word deleted successfully")
        } catch (error) {
            console.error("Error deleting word:", error)
            alert("Failed to delete word")
        } finally {
            editorActions.setDeleting(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-3 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <Search className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Words Library</h1>
                    <p className="text-muted-foreground">
                        Search, filter, and manage your words
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                {/* Search and Filter */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div>
                        <label className="text-sm font-medium">Search</label>
                        <Input
                            placeholder="Search by word..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="mt-1"
                        />
                    </div>
                    <div>
                        <label className="text-sm font-medium">Filter by Language</label>
                        <Select value={filterLanguage} onValueChange={setFilterLanguage}>
                            <SelectTrigger className="mt-1">
                                <SelectValue placeholder="All languages" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All languages</SelectItem>
                                {LANGUAGES.map((lang) => (
                                    <SelectItem key={lang.code} value={lang.code}>
                                        {lang.name}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <Separator />

                {/* Results Count */}
                <div className="flex justify-between items-center">
                    <p className="text-sm text-muted-foreground">
                        {loading ? "Loading..." : `Showing ${filteredWords.length} of ${words.length} words`}
                    </p>
                </div>

                {/* Words List */}
                {loading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Loading words...</p>
                    </div>
                ) : filteredWords.length === 0 ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">No words found</p>
                    </div>
                ) : (
                    <div className="flex flex-wrap gap-4">
                        {filteredWords.map((word) => (
                            <Card key={word.id} className="hover:bg-muted/50 transition-colors">
                                <CardContent className="px-4 py-0">
                                    <div className="flex items-center justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                <h3 className="font-semibold text-lg truncate">{word.lemma}</h3>
                                                <Badge variant="outline">{word.lang.toUpperCase()}</Badge>
                                            </div>
                                        </div>
                                        <Button
                                            variant="outline"
                                            size="sm"
                                            onClick={() => handleOpenWord(word)}
                                        >
                                            <Edit2 className="h-4 w-4" />
                                        </Button>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
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
