"use client"

import { useEffect, useState } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { ArrowLeft, Loader2 } from "lucide-react"
import { getDeckById } from "@/lib/decks/client-utils"
import { DeckReviewClient } from "@/components/deck-review-client"
import type { Deck } from "@/lib/types/deck"

export default function DeckReviewPage() {
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

    return (
        <div className="flex flex-col gap-6 p-6">
            <div className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold">{deck.name}</h1>
                    <p className="text-muted-foreground mt-1">Review Session</p>
                </div>
                <Button variant="outline" onClick={() => router.back()}>
                    <ArrowLeft className="w-4 h-4 mr-2" />
                    Exit
                </Button>
            </div>

            {/* Review Component */}
            <DeckReviewClient deckId={deck.id} queLanguage={deck.que_lang} />
        </div>
    )
}
