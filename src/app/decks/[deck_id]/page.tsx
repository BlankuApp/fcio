"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { toast } from "sonner"
import { ArrowLeft, Loader2, Edit2, Save, X } from "lucide-react"
import { getDeckById, deleteDeck, updateDeck } from "@/lib/decks/client-utils"
import { getLanguageByCode, getLanguageDisplayName, PROFICIENCY_LEVELS, type Language } from "@/lib/constants/languages"
import { DeckWordsClient } from "@/components/deck-words-client"
import { Textarea } from "@/components/ui/textarea"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import type { Deck } from "@/lib/types/deck"
import { PageHeader } from "@/components/page-header"

export default function DeckPage() {
    const params = useParams()
    const router = useRouter()
    const deckId = params.deck_id as string

    const [deck, setDeck] = useState<Deck | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)
    const [isDeleting, setIsDeleting] = useState(false)
    const [isEditingQuestionPrompt, setIsEditingQuestionPrompt] = useState(false)
    const [isEditingReviewPrompt, setIsEditingReviewPrompt] = useState(false)
    const [editedQuestionPrompt, setEditedQuestionPrompt] = useState("")
    const [editedReviewPrompt, setEditedReviewPrompt] = useState("")
    const [isSavingPrompt, setIsSavingPrompt] = useState(false)
    const [isQuestionPromptOpen, setIsQuestionPromptOpen] = useState(false)
    const [isReviewPromptOpen, setIsReviewPromptOpen] = useState(false)
    const [showDeleteDialog, setShowDeleteDialog] = useState(false)

    useEffect(() => {
        const loadDeck = async () => {
            try {
                setIsLoading(true)
                setError(null)
                const deckData = await getDeckById(deckId)
                if (!deckData) {
                    setError("Deck not found")
                    setDeck(null)
                } else {
                    setDeck(deckData)
                }
            } catch (err) {
                setError(err instanceof Error ? err.message : "Failed to load deck")
                setDeck(null)
            } finally {
                setIsLoading(false)
            }
        }

        loadDeck()
    }, [deckId])

    const handleDeleteDeck = async () => {
        if (!deck) return

        try {
            setIsDeleting(true)
            setShowDeleteDialog(false)
            await deleteDeck(deck.id)
            toast.success("Deck deleted successfully")
            router.push("/decks")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to delete deck")
        } finally {
            setIsDeleting(false)
        }
    }

    const handleEditQuestionPrompt = () => {
        setEditedQuestionPrompt(deck?.ai_prompts.question || "")
        setIsEditingQuestionPrompt(true)
    }

    const handleEditReviewPrompt = () => {
        setEditedReviewPrompt(deck?.ai_prompts.review || "")
        setIsEditingReviewPrompt(true)
    }

    const handleCancelQuestionEdit = () => {
        setIsEditingQuestionPrompt(false)
        setEditedQuestionPrompt("")
    }

    const handleCancelReviewEdit = () => {
        setIsEditingReviewPrompt(false)
        setEditedReviewPrompt("")
    }

    const handleSaveQuestionPrompt = async () => {
        if (!deck) return

        try {
            setIsSavingPrompt(true)
            const updatedDeck = await updateDeck(deck.id, {
                ai_prompts: {
                    ...deck.ai_prompts,
                    question: editedQuestionPrompt
                }
            })
            setDeck(updatedDeck)
            setIsEditingQuestionPrompt(false)
            toast.success("Question prompt updated successfully")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update question prompt")
        } finally {
            setIsSavingPrompt(false)
        }
    }

    const handleSaveReviewPrompt = async () => {
        if (!deck) return

        try {
            setIsSavingPrompt(true)
            const updatedDeck = await updateDeck(deck.id, {
                ai_prompts: {
                    ...deck.ai_prompts,
                    review: editedReviewPrompt
                }
            })
            setDeck(updatedDeck)
            setIsEditingReviewPrompt(false)
            toast.success("Review prompt updated successfully")
        } catch (err) {
            toast.error(err instanceof Error ? err.message : "Failed to update review prompt")
        } finally {
            setIsSavingPrompt(false)
        }
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (error || !deck) {
        return (
            <div className="flex flex-col gap-4 p-6">
                <Button variant="outline" onClick={() => router.back()} className="w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Go Back
                </Button>
                <Card className="border-destructive/50 bg-destructive/5">
                    <CardContent className="pt-6">
                        <p className="text-destructive">{error || "Deck not found"}</p>
                    </CardContent>
                </Card>
            </div>
        )
    }

    const queLanguage = getLanguageByCode(deck.que_lang)

    // Ensure ans_langs is an array (handle cases where it might be a string or null)
    let ansLangsArray: string[] = [];
    if (Array.isArray(deck.ans_langs)) {
        ansLangsArray = deck.ans_langs;
    } else if (typeof deck.ans_langs === 'string') {
        try {
            ansLangsArray = JSON.parse(deck.ans_langs);
        } catch {
            // Optionally log the error for debugging
            // console.error("Failed to parse ans_langs JSON:", e);
            ansLangsArray = [];
        }
    }

    const ansLanguages = ansLangsArray
        .map((code: string) => getLanguageByCode(code))
        .filter(Boolean)

    const difficultyLevel = PROFICIENCY_LEVELS.find(
        (level) => level.value === deck.diff_level
    )

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "Decks", href: "/decks" },
                    { label: deck.name }
                ]}
            />
            <div className="flex flex-col gap-6 p-6">
                <Button variant="outline" onClick={() => router.back()} className="w-fit">
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Back
                </Button>

            <Card>
                <CardHeader>
                    <div className="flex items-start justify-between">
                        <div className="space-y-2">
                            <CardTitle className="text-3xl">{deck.name}</CardTitle>
                            <CardDescription>ID: {deck.id}</CardDescription>
                        </div>
                        <div className="text-right space-y-2">
                            <p className="text-sm text-muted-foreground">
                                Created {new Date(deck.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-6">
                    {/* Question Language */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                            Question Language
                        </h3>
                        <p className="text-lg">
                            {queLanguage ? getLanguageDisplayName(queLanguage) : deck.que_lang}
                        </p>
                    </div>

                    {/* Answer Languages */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-3">
                            Answer Languages
                        </h3>
                        <div className="flex flex-wrap gap-2">
                            {ansLanguages.length > 0 ? (
                                ansLanguages.map((lang: Language | undefined) => (
                                    <Badge key={lang?.code} variant="secondary">
                                        {lang ? getLanguageDisplayName(lang) : "Unknown"}
                                    </Badge>
                                ))
                            ) : (
                                <p className="text-muted-foreground">No answer languages selected</p>
                            )}
                        </div>
                    </div>

                    {/* Difficulty Level */}
                    <div>
                        <h3 className="font-semibold text-sm text-muted-foreground mb-2">
                            Difficulty Level
                        </h3>
                        <div className="flex items-center gap-2">
                            <Badge variant="outline">{difficultyLevel?.label}</Badge>
                            <p className="text-sm text-muted-foreground">
                                {difficultyLevel?.description}
                            </p>
                        </div>
                    </div>

                    {/* AI Prompts */}
                    <div className="pt-4 border-t space-y-4">
                        {/* Question Prompt */}
                        <Collapsible open={isQuestionPromptOpen} onOpenChange={setIsQuestionPromptOpen}>
                            <div className="flex items-center justify-between mb-3">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm text-muted-foreground hover:text-foreground">
                                        AI Question Generation Prompt
                                        <span className="ml-2 text-xs">
                                            {isQuestionPromptOpen ? "▼" : "▶"}
                                        </span>
                                    </Button>
                                </CollapsibleTrigger>
                                {!isEditingQuestionPrompt && isQuestionPromptOpen && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEditQuestionPrompt}
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                            <CollapsibleContent>
                                {isEditingQuestionPrompt ? (
                                    <div className="space-y-3">
                                        <Textarea
                                            value={editedQuestionPrompt}
                                            onChange={(e) => setEditedQuestionPrompt(e.target.value)}
                                            className="min-h-[300px] font-mono text-sm"
                                            placeholder="Enter AI prompt for generating flashcard questions..."
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveQuestionPrompt}
                                                disabled={isSavingPrompt}
                                                size="sm"
                                            >
                                                {isSavingPrompt ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelQuestionEdit}
                                                disabled={isSavingPrompt}
                                                size="sm"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 p-4 rounded-md">
                                        <pre className="whitespace-pre-wrap text-sm font-mono">
                                            {deck.ai_prompts.question}
                                        </pre>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>

                        {/* Review Prompt */}
                        <Collapsible open={isReviewPromptOpen} onOpenChange={setIsReviewPromptOpen}>
                            <div className="flex items-center justify-between mb-3">
                                <CollapsibleTrigger asChild>
                                    <Button variant="ghost" size="sm" className="p-0 h-auto font-semibold text-sm text-muted-foreground hover:text-foreground">
                                        AI Review Feedback Prompt
                                        <span className="ml-2 text-xs">
                                            {isReviewPromptOpen ? "▼" : "▶"}
                                        </span>
                                    </Button>
                                </CollapsibleTrigger>
                                {!isEditingReviewPrompt && isReviewPromptOpen && (
                                    <Button
                                        variant="outline"
                                        size="sm"
                                        onClick={handleEditReviewPrompt}
                                    >
                                        <Edit2 className="w-4 h-4 mr-2" />
                                        Edit
                                    </Button>
                                )}
                            </div>
                            <CollapsibleContent>
                                {isEditingReviewPrompt ? (
                                    <div className="space-y-3">
                                        <Textarea
                                            value={editedReviewPrompt}
                                            onChange={(e) => setEditedReviewPrompt(e.target.value)}
                                            className="min-h-[300px] font-mono text-sm"
                                            placeholder="Enter AI prompt for reviewing student answers..."
                                        />
                                        <div className="flex gap-2">
                                            <Button
                                                onClick={handleSaveReviewPrompt}
                                                disabled={isSavingPrompt}
                                                size="sm"
                                            >
                                                {isSavingPrompt ? (
                                                    <>
                                                        <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                                        Saving...
                                                    </>
                                                ) : (
                                                    <>
                                                        <Save className="w-4 h-4 mr-2" />
                                                        Save
                                                    </>
                                                )}
                                            </Button>
                                            <Button
                                                variant="outline"
                                                onClick={handleCancelReviewEdit}
                                                disabled={isSavingPrompt}
                                                size="sm"
                                            >
                                                <X className="w-4 h-4 mr-2" />
                                                Cancel
                                            </Button>
                                        </div>
                                    </div>
                                ) : (
                                    <div className="bg-muted/50 p-4 rounded-md">
                                        <pre className="whitespace-pre-wrap text-sm font-mono">
                                            {deck.ai_prompts.review}
                                        </pre>
                                    </div>
                                )}
                            </CollapsibleContent>
                        </Collapsible>
                    </div>

                    {/* Metadata */}
                    <div className="pt-4 border-t">
                        <div className="grid grid-cols-2 gap-4 text-sm">
                            <div>
                                <p className="text-muted-foreground">Created</p>
                                <p>{new Date(deck.created_at).toLocaleString()}</p>
                            </div>
                            <div>
                                <p className="text-muted-foreground">Last Updated</p>
                                <p>{new Date(deck.updated_at).toLocaleString()}</p>
                            </div>
                        </div>
                    </div>

                    {/* Action Buttons */}
                    <div className="flex gap-3 pt-4">
                        <Button
                            variant="default"
                            onClick={() => router.push(`/decks/${deck.id}/review`)}
                        >
                            Start Practice
                        </Button>
                        <Button variant="outline">
                            Edit Deck
                        </Button>
                        <Button
                            variant="destructive"
                            onClick={() => setShowDeleteDialog(true)}
                            disabled={isDeleting}
                        >
                            {isDeleting ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Deleting...
                                </>
                            ) : (
                                "Delete Deck"
                            )}
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Words Table */}
            <DeckWordsClient languageCode={deck.que_lang} deckId={deck.id} />

            {/* Delete Confirmation Dialog */}
            <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Delete Deck</AlertDialogTitle>
                        <AlertDialogDescription>
                            Are you sure you want to delete &quot;{deck.name}&quot;? This action cannot be undone.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteDeck}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            Delete
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
        </>
    )
}
