"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getDeckById } from "@/lib/decks/client-utils"
import { getLanguageByCode, getLanguageDisplayName, PROFICIENCY_LEVELS, type Language } from "@/lib/constants/languages"
import { DeckWordsClient } from "@/components/deck-words-client"
import type { Deck } from "@/lib/types/deck"

export default function DeckPage() {
    const params = useParams()
    const router = useRouter()
    const deckId = params.deck_id as string

    const [deck, setDeck] = useState<Deck | null>(null)
    const [isLoading, setIsLoading] = useState(true)
    const [error, setError] = useState<string | null>(null)

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
    const ansLangsArray: string[] = Array.isArray(deck.ans_langs)
        ? deck.ans_langs
        : typeof deck.ans_langs === 'string'
            ? JSON.parse(deck.ans_langs)
            : []

    const ansLanguages = ansLangsArray
        .map((code: string) => getLanguageByCode(code))
        .filter(Boolean)

    const difficultyLevel = PROFICIENCY_LEVELS.find(
        (level) => level.value === deck.diff_level
    )

    return (
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
                        <Button variant="default">
                            Start Practice
                        </Button>
                        <Button variant="outline">
                            Edit Deck
                        </Button>
                        <Button variant="destructive">
                            Delete Deck
                        </Button>
                    </div>
                </CardContent>
            </Card>

            {/* Words Table */}
            <DeckWordsClient languageCode={deck.que_lang} deckId={deck.id} />
        </div>
    )
}
