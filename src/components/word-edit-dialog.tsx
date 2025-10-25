"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Badge } from "@/components/ui/badge"
import { Edit2, Plus, Trash2, X, Check } from "lucide-react"
import { LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants/languages"
import { useEffect, useState } from "react"
import { listTags } from "@/lib/tags/client-utils"
import {
    Tags,
    TagsTrigger,
    TagsValue,
    TagsContent,
    TagsInput,
    TagsList,
    TagsEmpty,
    TagsGroup,
    TagsItem,
} from "@/components/ui/shadcn-io/tags"
import type { Word, Collocation } from "@/lib/types/words"
import type { Tag } from "@/lib/types/tags"

interface WordEditDialogProps {
    isOpen: boolean
    isEditing: boolean
    isSaving: boolean
    isDeleting: boolean
    selectedWord: Word | null
    editedWord: Word | null
    onClose: () => void
    onEnterEditMode: () => void
    onExitEditMode: () => void
    onUpdateLemma: (lemma: string) => void
    onUpdateLanguage: (lang: string) => void
    onAddCollocation: () => void
    onRemoveCollocation: (pattern: string, index: number) => void
    onUpdateCollocation: (pattern: string, index: number, field: "collocation" | "difficulty", value: string) => void
    onSave: () => void
    onDelete: () => void
    wordTags?: string[] // IDs of tags associated with this word
    onTagsChange?: (tagIds: string[]) => void // Callback when tags are modified
}

export function WordEditDialog({
    isOpen,
    isEditing,
    isSaving,
    isDeleting,
    selectedWord,
    editedWord,
    onClose,
    onEnterEditMode,
    onExitEditMode,
    onUpdateLemma,
    onUpdateLanguage,
    onAddCollocation,
    onRemoveCollocation,
    onUpdateCollocation,
    onSave,
    onDelete,
    wordTags = [],
    onTagsChange,
}: WordEditDialogProps) {
    const [availableTags, setAvailableTags] = useState<Tag[]>([])
    const [selectedTags, setSelectedTags] = useState<Set<string>>(new Set(wordTags))
    const [isLoadingTags, setIsLoadingTags] = useState(false)

    // Load available tags on component mount
    useEffect(() => {
        let mounted = true
        const loadTags = async () => {
            setIsLoadingTags(true)
            try {
                const tags = await listTags({ limit: 100 })
                if (mounted) {
                    setAvailableTags(tags)
                    setIsLoadingTags(false)
                }
            } catch (error) {
                if (mounted) {
                    console.error("Error loading tags:", error)
                    setIsLoadingTags(false)
                }
            }
        }
        loadTags()
        return () => {
            mounted = false
        }
    }, [])

    // Update selected tags when wordTags prop changes
    useEffect(() => {
        setSelectedTags(new Set(wordTags))
    }, [wordTags])

    const toggleTagSelection = (tagId: string) => {
        const newTags = new Set(selectedTags)
        if (newTags.has(tagId)) {
            newTags.delete(tagId)
        } else {
            newTags.add(tagId)
        }
        setSelectedTags(newTags)
        onTagsChange?.(Array.from(newTags))
    }

    if (!selectedWord || !editedWord) return null

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
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
                                onChange={(e) => onUpdateLemma(e.target.value)}
                                disabled={!isEditing}
                                className="mt-1"
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium">Language</label>
                            <Select
                                value={editedWord.lang}
                                onValueChange={onUpdateLanguage}
                                disabled={!isEditing}
                            >
                                <SelectTrigger>
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
                                    onClick={onAddCollocation}
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
                                                    onChange={(e) =>
                                                        onUpdateCollocation(
                                                            pattern,
                                                            index,
                                                            "collocation",
                                                            e.target.value
                                                        )
                                                    }
                                                    disabled={!isEditing}
                                                    placeholder="Collocation"
                                                    className="flex-1"
                                                />
                                                <Select
                                                    value={col.difficulty}
                                                    onValueChange={(val) =>
                                                        onUpdateCollocation(
                                                            pattern,
                                                            index,
                                                            "difficulty",
                                                            val
                                                        )
                                                    }
                                                    disabled={!isEditing}
                                                >
                                                    <SelectTrigger className="w-32">
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        {PROFICIENCY_LEVELS.map((level) => (
                                                            <SelectItem
                                                                key={level.value}
                                                                value={level.value}
                                                            >
                                                                {level.label}
                                                            </SelectItem>
                                                        ))}
                                                    </SelectContent>
                                                </Select>
                                                {isEditing && (
                                                    <Button
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() =>
                                                            onRemoveCollocation(pattern, index)
                                                        }
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

                    <Separator />

                    {/* Tags */}
                    <div>
                        <label className="text-sm font-medium mb-2 block">Tags</label>
                        {isLoadingTags ? (
                            <div className="p-3 border rounded-md bg-muted/50">
                                <span className="text-sm text-muted-foreground">Loading tags...</span>
                            </div>
                        ) : availableTags.length === 0 ? (
                            <div className="p-3 border rounded-md bg-muted/50">
                                <span className="text-sm text-muted-foreground">No tags available</span>
                            </div>
                        ) : (
                            <Tags>
                                <TagsTrigger disabled={!isEditing}>
                                    {Array.from(selectedTags).map((tagId) => {
                                        const tag = availableTags.find(t => t.id === tagId)
                                        if (!tag) return null
                                        return (
                                            <TagsValue
                                                key={tag.id}
                                                onRemove={isEditing ? () => toggleTagSelection(tag.id) : undefined}
                                            >
                                                {tag.name}
                                            </TagsValue>
                                        )
                                    })}
                                </TagsTrigger>
                                <TagsContent>
                                    <TagsInput placeholder="Search tags..." />
                                    <TagsList>
                                        <TagsEmpty>No tags found.</TagsEmpty>
                                        <TagsGroup>
                                            {availableTags.map((tag) => (
                                                <TagsItem
                                                    key={tag.id}
                                                    value={tag.name}
                                                    onSelect={() => toggleTagSelection(tag.id)}
                                                >
                                                    <span>{tag.name}</span>
                                                    {selectedTags.has(tag.id) && (
                                                        <Check className="h-4 w-4" />
                                                    )}
                                                </TagsItem>
                                            ))}
                                        </TagsGroup>
                                    </TagsList>
                                </TagsContent>
                            </Tags>
                        )}
                        {selectedTags.size > 0 && (
                            <p className="text-xs text-muted-foreground mt-2">
                                {selectedTags.size} tag(s) selected
                            </p>
                        )}
                    </div>
                </div>

                <DialogFooter className="flex gap-2">
                    {!isEditing ? (
                        <>
                            <Button variant="outline" onClick={onClose}>
                                Close
                            </Button>
                            <Button variant="default" onClick={onEnterEditMode}>
                                <Edit2 className="h-4 w-4 mr-2" />
                                Edit
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={onDelete}
                                disabled={isDeleting}
                            >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Delete
                            </Button>
                        </>
                    ) : (
                        <>
                            <Button variant="outline" onClick={onExitEditMode}>
                                Cancel
                            </Button>
                            <Button
                                variant="default"
                                onClick={onSave}
                                disabled={isSaving}
                            >
                                {isSaving ? "Saving..." : "Save Changes"}
                            </Button>
                        </>
                    )}
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}
