"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Search, Edit2, Trash2, Plus, X } from "lucide-react"
import { listWords, updateWord, deleteWord } from "@/lib/words/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import type { Word } from "@/lib/types/words"

interface Collocation {
    collocation: string
    difficulty: string
}

export default function WordsListPage() {
    const [words, setWords] = useState<Word[]>([])
    const [filteredWords, setFilteredWords] = useState<Word[]>([])
    const [loading, setLoading] = useState(true)
    const [searchQuery, setSearchQuery] = useState("")
    const [filterLanguage, setFilterLanguage] = useState<string>("all")
    const [selectedWord, setSelectedWord] = useState<Word | null>(null)
    const [isDialogOpen, setIsDialogOpen] = useState(false)
    const [isEditing, setIsEditing] = useState(false)
    const [editedWord, setEditedWord] = useState<Word | null>(null)
    const [isSaving, setIsSaving] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)

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
        setSelectedWord(word)
        setEditedWord(JSON.parse(JSON.stringify(word)))
        setIsEditing(false)
        setIsDialogOpen(true)
    }

    const handleSaveWord = async () => {
        if (!editedWord) return

        try {
            setIsSaving(true)
            await updateWord(editedWord.id, {
                lemma: editedWord.lemma,
                lang: editedWord.lang,
                collocations: editedWord.collocations,
            })
            setWords(words.map(w => w.id === editedWord.id ? editedWord : w))
            setIsEditing(false)
            alert("Word updated successfully")
        } catch (error) {
            console.error("Error saving word:", error)
            alert("Failed to save word")
        } finally {
            setIsSaving(false)
        }
    }

    const handleDeleteWord = async () => {
        if (!selectedWord || !window.confirm(`Are you sure you want to delete "${selectedWord.lemma}"?`)) return

        try {
            setIsDeleting(true)
            await deleteWord(selectedWord.id)
            setWords(words.filter(w => w.id !== selectedWord.id))
            setIsDialogOpen(false)
            alert("Word deleted successfully")
        } catch (error) {
            console.error("Error deleting word:", error)
            alert("Failed to delete word")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleAddCollocation = () => {
        if (!editedWord) return

        const newPattern = "object"
        if (!editedWord.collocations[newPattern]) {
            editedWord.collocations[newPattern] = []
        }
        editedWord.collocations[newPattern].push({
            collocation: "",
            difficulty: "elementary"
        })
        setEditedWord({ ...editedWord })
    }

    const handleRemoveCollocation = (pattern: string, index: number) => {
        if (!editedWord) return

        editedWord.collocations[pattern].splice(index, 1)
        if (editedWord.collocations[pattern].length === 0) {
            delete editedWord.collocations[pattern]
        }
        setEditedWord({ ...editedWord })
    }

    const handleUpdateCollocation = (pattern: string, index: number, field: string, value: string) => {
        if (!editedWord) return

        if (field === "collocation") {
            editedWord.collocations[pattern][index].collocation = value
        } else if (field === "difficulty") {
            editedWord.collocations[pattern][index].difficulty = value
        }
        setEditedWord({ ...editedWord })
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
                    <div className="flex flex-direction gap-4 wrap">
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
                                        <Dialog open={isDialogOpen && selectedWord?.id === word.id} onOpenChange={setIsDialogOpen}>
                                            <DialogTrigger asChild>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    onClick={() => handleOpenWord(word)}
                                                >
                                                    <Edit2 className="h-4 w-4" />
                                                </Button>
                                            </DialogTrigger>
                                            {selectedWord?.id === word.id && editedWord && (
                                                <DialogContent className="max-h-[90vh] overflow-y-auto">
                                                    <DialogHeader>
                                                        <DialogTitle>
                                                            {isEditing ? `Edit: ${editedWord.lemma}` : `View: ${selectedWord.lemma}`}
                                                        </DialogTitle>
                                                    </DialogHeader>

                                                    <div className="space-y-4">
                                                        {/* Basic Info */}
                                                        <div className="grid gap-4">
                                                            <div>
                                                                <label className="text-sm font-medium">Lemma</label>
                                                                <Input
                                                                    value={editedWord.lemma}
                                                                    onChange={(e) => setEditedWord({ ...editedWord, lemma: e.target.value })}
                                                                    disabled={!isEditing}
                                                                    className="mt-1"
                                                                />
                                                            </div>
                                                            <div>
                                                                <label className="text-sm font-medium">Language</label>
                                                                <Select value={editedWord.lang} onValueChange={(lang) => setEditedWord({ ...editedWord, lang })}>
                                                                    <SelectTrigger disabled={!isEditing}>
                                                                        <SelectValue />
                                                                    </SelectTrigger>
                                                                    <SelectContent>
                                                                        {LANGUAGES.map((l) => (
                                                                            <SelectItem key={l.code} value={l.code}>
                                                                                {l.name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </SelectContent>
                                                                </Select>
                                                            </div>
                                                        </div>

                                                        <Separator />

                                                        {/* Collocations */}
                                                        <div>
                                                            <div className="flex items-center justify-between mb-3">
                                                                <label className="text-sm font-medium">Collocations</label>
                                                                {isEditing && (
                                                                    <Button
                                                                        variant="outline"
                                                                        size="sm"
                                                                        onClick={handleAddCollocation}
                                                                    >
                                                                        <Plus className="h-4 w-4 mr-1" />
                                                                        Add
                                                                    </Button>
                                                                )}
                                                            </div>

                                                            <div className="space-y-4">
                                                                {Object.entries(editedWord.collocations).map(([pattern, collocations]) => (
                                                                    <div key={pattern} className="border rounded-lg p-3">
                                                                        <h4 className="font-semibold text-sm mb-2 text-muted-foreground uppercase">
                                                                            {pattern}
                                                                        </h4>
                                                                        <div className="space-y-2">
                                                                            {(collocations as Collocation[]).map((col, index) => (
                                                                                <div key={index} className="flex gap-2 items-start">
                                                                                    <Input
                                                                                        value={col.collocation}
                                                                                        onChange={(e) => handleUpdateCollocation(pattern, index, "collocation", e.target.value)}
                                                                                        disabled={!isEditing}
                                                                                        placeholder="Collocation"
                                                                                        className="flex-1"
                                                                                    />
                                                                                    <Select value={col.difficulty} onValueChange={(val) => handleUpdateCollocation(pattern, index, "difficulty", val)}>
                                                                                        <SelectTrigger disabled={!isEditing} className="w-32">
                                                                                            <SelectValue />
                                                                                        </SelectTrigger>
                                                                                        <SelectContent>
                                                                                            <SelectItem value="beginner">Beginner</SelectItem>
                                                                                            <SelectItem value="elementary">Elementary</SelectItem>
                                                                                            <SelectItem value="intermediate">Intermediate</SelectItem>
                                                                                            <SelectItem value="upper-intermediate">Upper Intermediate</SelectItem>
                                                                                            <SelectItem value="advanced">Advanced</SelectItem>
                                                                                            <SelectItem value="proficient">Proficient</SelectItem>
                                                                                        </SelectContent>
                                                                                    </Select>
                                                                                    {isEditing && (
                                                                                        <Button
                                                                                            variant="ghost"
                                                                                            size="sm"
                                                                                            onClick={() => handleRemoveCollocation(pattern, index)}
                                                                                        >
                                                                                            <X className="h-4 w-4" />
                                                                                        </Button>
                                                                                    )}
                                                                                </div>
                                                                            ))}
                                                                        </div>
                                                                    </div>
                                                                ))}
                                                            </div>
                                                        </div>
                                                    </div>

                                                    <DialogFooter className="flex gap-2">
                                                        {!isEditing ? (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => setIsDialogOpen(false)}
                                                                >
                                                                    Close
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    onClick={() => setIsEditing(true)}
                                                                >
                                                                    <Edit2 className="h-4 w-4 mr-2" />
                                                                    Edit
                                                                </Button>
                                                                <Button
                                                                    variant="destructive"
                                                                    onClick={handleDeleteWord}
                                                                    disabled={isDeleting}
                                                                >
                                                                    <Trash2 className="h-4 w-4 mr-2" />
                                                                    Delete
                                                                </Button>
                                                            </>
                                                        ) : (
                                                            <>
                                                                <Button
                                                                    variant="outline"
                                                                    onClick={() => {
                                                                        setIsEditing(false)
                                                                        setEditedWord(selectedWord)
                                                                    }}
                                                                >
                                                                    Cancel
                                                                </Button>
                                                                <Button
                                                                    variant="default"
                                                                    onClick={handleSaveWord}
                                                                    disabled={isSaving}
                                                                >
                                                                    {isSaving ? "Saving..." : "Save Changes"}
                                                                </Button>
                                                            </>
                                                        )}
                                                    </DialogFooter>
                                                </DialogContent>
                                            )}
                                        </Dialog>
                                    </div>
                                </CardContent>
                            </Card>
                        ))}
                    </div>
                )}
            </div>
        </div>
    )
}
