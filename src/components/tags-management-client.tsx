"use client"

import { useState, useCallback } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Separator } from "@/components/ui/separator"
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { AlertDialog } from "@/components/alert-dialog"
import { Plus, Edit2, Trash2, Search, TagIcon } from "lucide-react"
import { useAlert } from "@/hooks/use-alert"
import {
    createTag,
    listTags,
    updateTag,
    deleteTag,
} from "@/lib/tags/client-utils"
import type { Tag } from "@/lib/types/tags"

interface TagsManagementClientProps {
    initialTags: Tag[]
    userId: string
}

type DialogMode = "create" | "edit" | null

export function TagsManagementClient({ initialTags, userId }: TagsManagementClientProps) {
    const [tags, setTags] = useState<Tag[]>(initialTags)
    const [isLoading, setIsLoading] = useState(false)
    const [searchQuery, setSearchQuery] = useState("")
    const [dialogMode, setDialogMode] = useState<DialogMode>(null)
    const [selectedTag, setSelectedTag] = useState<Tag | null>(null)
    const [formData, setFormData] = useState({ name: "" })
    const [isSaving, setIsSaving] = useState(false)
    const { alert, showAlert, closeAlert } = useAlert()

    // Filter tags based on search query
    const filteredTags = tags.filter(
        (tag) =>
            tag.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            tag.normalized_name.includes(searchQuery.toLowerCase())
    )

    // Reload tags
    const handleReloadTags = useCallback(async () => {
        setIsLoading(true)
        try {
            const newTags = await listTags({ q: searchQuery })
            setTags(newTags)
        } catch (error) {
            showAlert(
                `Failed to load tags: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error",
                "Load Error"
            )
        } finally {
            setIsLoading(false)
        }
    }, [searchQuery, showAlert])

    // Open create dialog
    const handleOpenCreateDialog = () => {
        setFormData({ name: "" })
        setSelectedTag(null)
        setDialogMode("create")
    }

    // Open edit dialog
    const handleOpenEditDialog = (tag: Tag) => {
        setSelectedTag(tag)
        setFormData({
            name: tag.name,
        })
        setDialogMode("edit")
    }

    // Close dialog
    const handleCloseDialog = () => {
        setDialogMode(null)
        setSelectedTag(null)
        setFormData({ name: "" })
    }

    // Create tag
    const handleCreateTag = async () => {
        if (!formData.name.trim()) {
            showAlert("Tag name is required", "error", "Validation Error")
            return
        }

        setIsSaving(true)
        try {
            const newTag = await createTag({
                name: formData.name,
                created_by: userId,
            })
            setTags([newTag, ...tags])
            showAlert("Tag created successfully", "success", "Success")
            handleCloseDialog()
        } catch (error) {
            showAlert(
                `Failed to create tag: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error",
                "Create Error"
            )
        } finally {
            setIsSaving(false)
        }
    }

    // Update tag
    const handleUpdateTag = async () => {
        if (!selectedTag) return
        if (!formData.name.trim()) {
            showAlert("Tag name is required", "error", "Validation Error")
            return
        }

        setIsSaving(true)
        try {
            const updatedTag = await updateTag(selectedTag.id, {
                name: formData.name,
            })
            setTags(tags.map((t) => (t.id === selectedTag.id ? updatedTag : t)))
            showAlert("Tag updated successfully", "success", "Success")
            handleCloseDialog()
        } catch (error) {
            showAlert(
                `Failed to update tag: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error",
                "Update Error"
            )
        } finally {
            setIsSaving(false)
        }
    }

    const handleSave = () => {
        if (dialogMode === "create") {
            handleCreateTag()
        } else if (dialogMode === "edit") {
            handleUpdateTag()
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            {/* Header */}
            <div className="flex items-center gap-3 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <TagIcon className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Manage Tags</h1>
                    <p className="text-muted-foreground">
                        Create, edit, and manage tags for categorizing words
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <Separator />

                {/* Search and Create */}
                <div className="flex gap-3 items-center">
                    <div className="flex-1 relative">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            placeholder="Search tags by name or category..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="pl-10"
                        />
                    </div>
                    <Button onClick={handleReloadTags} disabled={isLoading} variant="outline">
                        {isLoading ? "Loading..." : "Reload"}
                    </Button>
                    <Button onClick={handleOpenCreateDialog}>
                        <Plus className="h-4 w-4 mr-2" />
                        New Tag
                    </Button>
                </div>

                {/* Tags List */}
                <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {filteredTags.length === 0 ? (
                        <Card className="col-span-full">
                            <CardContent className="pt-8 text-center text-muted-foreground">
                                {tags.length === 0
                                    ? "No tags yet. Create your first tag to get started."
                                    : "No tags match your search."}
                            </CardContent>
                        </Card>
                    ) : (
                        filteredTags.map((tag) => (
                            <Card key={tag.id} className="hover:shadow-md transition-shadow">
                                <CardHeader className="pb-3">
                                    <div className="flex items-start justify-between gap-2">
                                        <div className="flex-1 min-w-0">
                                            <CardTitle className="truncate text-lg">{tag.name}</CardTitle>
                                            <CardDescription className="text-xs mt-1">
                                                {tag.normalized_name}
                                            </CardDescription>
                                        </div>
                                        <Badge variant="secondary" className="text-xs whitespace-nowrap">
                                            {tag.id.slice(0, 8)}...
                                        </Badge>
                                    </div>
                                </CardHeader>

                                <Separator />
                                <CardContent className="pt-3 flex gap-2">
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => handleOpenEditDialog(tag)}
                                    >
                                        <Edit2 className="h-4 w-4 mr-1" />
                                        Edit
                                    </Button>
                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="flex-1"
                                        onClick={() => {
                                            setSelectedTag(tag)
                                            showAlert(
                                                `Are you sure you want to delete the tag "${tag.name}"? This action cannot be undone.`,
                                                "error",
                                                "Confirm Delete",
                                                async () => {
                                                    setIsSaving(true)
                                                    try {
                                                        await deleteTag(tag.id)
                                                        setTags(tags.filter((t) => t.id !== tag.id))
                                                        showAlert("Tag deleted successfully", "success", "Success")
                                                    } catch (error) {
                                                        showAlert(
                                                            `Failed to delete tag: ${error instanceof Error ? error.message : "Unknown error"}`,
                                                            "error",
                                                            "Delete Error"
                                                        )
                                                    } finally {
                                                        setIsSaving(false)
                                                    }
                                                }
                                            )
                                        }}
                                    >
                                        <Trash2 className="h-4 w-4 mr-1" />
                                        Delete
                                    </Button>
                                </CardContent>
                            </Card>
                        ))
                    )}
                </div>

                <Separator />

                {/* Create/Edit Dialog */}
                <Dialog open={dialogMode !== null} onOpenChange={handleCloseDialog}>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>
                                {dialogMode === "create" ? "Create New Tag" : "Edit Tag"}
                            </DialogTitle>
                        </DialogHeader>

                        <div className="space-y-4 py-4">
                            <div className="space-y-2">
                                <label className="text-sm font-medium">Tag Name *</label>
                                <Input
                                    placeholder="e.g., Phrasal Verbs"
                                    value={formData.name}
                                    onChange={(e) =>
                                        setFormData({ ...formData, name: e.target.value })
                                    }
                                    disabled={isSaving}
                                />
                                {formData.name && (
                                    <p className="text-xs text-muted-foreground">
                                        Category: {formData.name.trim().toLowerCase().replace(/\s+/g, "_")}
                                    </p>
                                )}
                            </div>
                        </div>

                        <DialogFooter className="flex gap-2">
                            <Button
                                variant="outline"
                                onClick={handleCloseDialog}
                                disabled={isSaving}
                            >
                                Cancel
                            </Button>
                            <Button
                                onClick={handleSave}
                                disabled={isSaving || !formData.name.trim()}
                            >
                                {isSaving ? "Saving..." : "Save"}
                            </Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>

                {/* Alert Dialog */}
                <AlertDialog
                    isOpen={alert.isOpen}
                    title={alert.title}
                    message={alert.message}
                    type={alert.type}
                    onConfirm={alert.onConfirm}
                    onClose={closeAlert}
                />
            </div>
        </div>
    )
}
