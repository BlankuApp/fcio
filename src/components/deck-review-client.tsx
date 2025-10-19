"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { cn } from "@/lib/utils"
import { getDueCards } from "@/lib/decks/deck-words-client"
import { listDeckWords } from "@/lib/decks/deck-words-client"
import type { DeckWord } from "@/lib/types/deck-words"

interface ReviewQuestion {
    lemma: string
    hint: string
    difficulty: string
}

type ReviewDifficulty = "again" | "hard" | "good" | "easy"

interface ReviewState {
    currentCardIndex: number
    userAnswer: string
    aiReview: string | null
    selectedDifficulty: ReviewDifficulty | null
    isLoading: boolean
    isSubmittingReview: boolean
}

interface DeckReviewClientProps {
    deckId: string
    queLanguage: string
}

export function DeckReviewClient({ deckId, queLanguage }: DeckReviewClientProps) {
    const [cards, setCards] = useState<DeckWord[]>([])
    const [isLoadingCards, setIsLoadingCards] = useState(true)
    const [loadError, setLoadError] = useState<string | null>(null)

    const [reviewState, setReviewState] = useState<ReviewState>({
        currentCardIndex: 0,
        userAnswer: "",
        aiReview: null,
        selectedDifficulty: null,
        isLoading: false,
        isSubmittingReview: false,
    })

    // Load due cards on mount
    useEffect(() => {
        const loadCards = async () => {
            try {
                setIsLoadingCards(true)
                setLoadError(null)

                // First try to get due cards
                const dueCardsData = await getDueCards(deckId)

                if (dueCardsData.cards.length === 0) {
                    // If no due cards, get all cards
                    const allCards = await listDeckWords(deckId, { limit: 50 })
                    setCards(allCards)
                } else {
                    setCards(dueCardsData.cards)
                }
            } catch (err) {
                setLoadError(err instanceof Error ? err.message : "Failed to load cards")
                setCards([])
            } finally {
                setIsLoadingCards(false)
            }
        }

        loadCards()
    }, [deckId])

    // Dummy function to fetch question data
    const fetchQuestionData = async (cardIndex: number): Promise<ReviewQuestion | null> => {
        // TODO: Replace with actual API call to fetch question from word_id
        // For now, return dummy data
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve({
                    lemma: `Question ${cardIndex + 1}`,
                    hint: "This is a hint for the current question. Use this to help you answer.",
                    difficulty: "intermediate",
                })
            }, 500)
        })
    }

    // Dummy function to get AI review
    const getAIReview = async (question: ReviewQuestion, answer: string): Promise<string> => {
        // TODO: Replace with actual AI API call
        // For now, return dummy review
        return new Promise((resolve) => {
            setTimeout(() => {
                resolve(`Great attempt! Your answer "${answer}" shows good understanding. 
                
The expected answer relates to: "${question.lemma}"

Key points:
- Your response demonstrates understanding of the concept
- Consider the nuances of the language in your next attempt
- This is a ${question.difficulty} level question`)
            }, 1500)
        })
    }

    // Dummy function to submit learning result
    const submitLearningResult = async (
        cardId: string,
        difficulty: ReviewDifficulty
    ): Promise<void> => {
        // TODO: Replace with actual API call to update spaced repetition metrics
        // For now, just simulate the request
        return new Promise((resolve) => {
            setTimeout(() => {
                console.log(`Submitted review for card ${cardId} with difficulty: ${difficulty}`)
                resolve()
            }, 500)
        })
    }

    const handleSubmitAnswer = async () => {
        if (!reviewState.userAnswer.trim()) {
            return
        }

        try {
            setReviewState((prev) => ({ ...prev, isLoading: true }))

            const currentCard = cards[reviewState.currentCardIndex]
            if (!currentCard) return

            // Fetch question data
            const questionData = await fetchQuestionData(reviewState.currentCardIndex)
            if (!questionData) {
                setReviewState((prev) => ({ ...prev, isLoading: false }))
                return
            }

            // Get AI review
            const review = await getAIReview(questionData, reviewState.userAnswer)

            setReviewState((prev) => ({
                ...prev,
                aiReview: review,
                isLoading: false,
            }))
        } catch (err) {
            console.error("Failed to get AI review:", err)
            setReviewState((prev) => ({
                ...prev,
                aiReview: "Error getting review. Please try again.",
                isLoading: false,
            }))
        }
    }

    const handleSelectDifficulty = (difficulty: ReviewDifficulty) => {
        setReviewState((prev) => ({
            ...prev,
            selectedDifficulty: difficulty,
        }))
    }

    const handleSubmitResult = async () => {
        if (!reviewState.selectedDifficulty) return

        try {
            setReviewState((prev) => ({ ...prev, isSubmittingReview: true }))

            const currentCard = cards[reviewState.currentCardIndex]
            if (!currentCard) return

            // Submit the result
            await submitLearningResult(currentCard.id, reviewState.selectedDifficulty)

            // Move to next card or finish
            const nextIndex = reviewState.currentCardIndex + 1
            if (nextIndex < cards.length) {
                setReviewState({
                    currentCardIndex: nextIndex,
                    userAnswer: "",
                    aiReview: null,
                    selectedDifficulty: null,
                    isLoading: false,
                    isSubmittingReview: false,
                })
            } else {
                // All cards reviewed
                setReviewState({
                    currentCardIndex: nextIndex,
                    userAnswer: "",
                    aiReview: null,
                    selectedDifficulty: null,
                    isLoading: false,
                    isSubmittingReview: false,
                })
            }
        } catch (err) {
            console.error("Failed to submit result:", err)
            setReviewState((prev) => ({ ...prev, isSubmittingReview: false }))
        }
    }

    if (isLoadingCards) {
        return (
            <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (loadError || cards.length === 0) {
        return (
            <Card className="border-destructive/50 bg-destructive/5">
                <CardContent className="pt-6">
                    <p className="text-destructive">
                        {loadError || "No cards available for review"}
                    </p>
                </CardContent>
            </Card>
        )
    }

    const isReviewComplete = reviewState.currentCardIndex >= cards.length

    if (isReviewComplete) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Review Complete!</CardTitle>
                    <CardDescription>
                        You have reviewed all {cards.length} cards
                    </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <p className="text-center text-lg font-semibold">
                        Great job! Come back tomorrow for more reviews.
                    </p>
                </CardContent>
            </Card>
        )
    }

    const progressPercent = ((reviewState.currentCardIndex + 1) / cards.length) * 100

    return (
        <div className="space-y-6">
            {/* Progress */}
            <div className="space-y-2">
                <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">
                        Card {reviewState.currentCardIndex + 1} of {cards.length}
                    </span>
                    <span className="text-muted-foreground">{Math.round(progressPercent)}%</span>
                </div>
                <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                        className="h-full bg-primary transition-all duration-500"
                        style={{ width: `${progressPercent}%` }}
                    />
                </div>
            </div>

            {/* Question Card */}
            <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-transparent">
                <CardHeader className="space-y-3">
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-primary/10">
                            <span className="text-lg">❓</span>
                        </div>
                        <CardTitle className="text-2xl">Question</CardTitle>
                    </div>
                </CardHeader>
                <CardContent>
                    <div className="space-y-4">
                        <div className="bg-background p-6 rounded-xl border border-primary/10">
                            <p className="text-xl font-bold text-center leading-relaxed">
                                {`Question ${reviewState.currentCardIndex + 1}`}
                            </p>
                            <p className="text-sm text-muted-foreground text-center mt-3">
                                Language: <span className="font-semibold text-foreground">{queLanguage}</span>
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Hint Accordion */}
            <Accordion type="single" collapsible className="w-full">
                <AccordionItem value="hint" className="border border-amber-200 dark:border-amber-800 rounded-lg overflow-hidden">
                    <AccordionTrigger className="px-6 py-4 hover:no-underline bg-amber-50 dark:bg-amber-950/30 hover:bg-amber-100 dark:hover:bg-amber-900/40 transition-colors">
                        <span className="flex items-center gap-3 font-semibold text-amber-900 dark:text-amber-200">
                            <span className="text-lg">💡</span>
                            <span>Show Hint</span>
                        </span>
                    </AccordionTrigger>
                    <AccordionContent className="px-6 pt-6 pb-6 bg-amber-50/50 dark:bg-amber-950/20">
                        <div className="space-y-3">
                            <div className="flex gap-3">
                                <div className="mt-1 text-amber-600 dark:text-amber-400">💭</div>
                                <p className="text-sm leading-relaxed text-foreground">
                                    This is a hint for the current question. Use this to help you answer better.
                                </p>
                            </div>
                        </div>
                    </AccordionContent>
                </AccordionItem>
            </Accordion>

            {/* Answer Input */}
            <Card className="border-primary/20">
                <CardHeader>
                    <div className="flex items-center gap-2">
                        <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                            <span className="text-lg">✏️</span>
                        </div>
                        <div>
                            <CardTitle>Your Answer</CardTitle>
                            <CardDescription>
                                Type your response below
                            </CardDescription>
                        </div>
                    </div>
                </CardHeader>
                <CardContent className="space-y-4">
                    <Textarea
                        placeholder="Share your answer here..."
                        value={reviewState.userAnswer}
                        onChange={(e) =>
                            setReviewState((prev) => ({
                                ...prev,
                                userAnswer: e.target.value,
                            }))
                        }
                        disabled={reviewState.isLoading || reviewState.aiReview !== null}
                        className="min-h-[120px] resize-none border-primary/20 focus:border-primary/50"
                    />
                    {reviewState.aiReview === null && (
                        <Button
                            onClick={handleSubmitAnswer}
                            disabled={
                                !reviewState.userAnswer.trim() ||
                                reviewState.isLoading
                            }
                            className="w-full"
                        >
                            {reviewState.isLoading ? (
                                <>
                                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                    Reviewing...
                                </>
                            ) : (
                                "Submit Answer"
                            )}
                        </Button>
                    )}
                </CardContent>
            </Card>

            {/* AI Review Result */}
            {reviewState.aiReview && (
                <Card className="border-2 border-emerald-200 dark:border-emerald-800 bg-gradient-to-br from-emerald-50/50 to-green-50/50 dark:from-emerald-950/20 dark:to-green-950/20">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-emerald-100 dark:bg-emerald-900/30">
                                <span className="text-lg">🤖</span>
                            </div>
                            <div>
                                <CardTitle className="text-lg">AI Review</CardTitle>
                                <CardDescription className="text-emerald-700 dark:text-emerald-400">
                                    Here&apos;s your personalized feedback
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="space-y-4 text-sm leading-relaxed">
                            {reviewState.aiReview.split("\n").map((line, idx) => {
                                if (line.trim() === "") return null
                                return (
                                    <p key={idx} className="whitespace-pre-wrap text-foreground">
                                        {line}
                                    </p>
                                )
                            })}
                        </div>
                    </CardContent>
                </Card>
            )}

            {/* Spaced Repetition Options */}
            {reviewState.aiReview && (
                <Card className="border-primary/20">
                    <CardHeader className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-purple-100 dark:bg-purple-900/30">
                                <span className="text-lg">📊</span>
                            </div>
                            <div>
                                <CardTitle className="text-lg">How well did you know this?</CardTitle>
                                <CardDescription>
                                    Select based on how easy it was to recall the answer
                                </CardDescription>
                            </div>
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 mb-6">
                            {[
                                {
                                    value: "again" as ReviewDifficulty,
                                    label: "Again",
                                    description: "I don't remember",
                                    icon: "❌",
                                    color: "bg-red-50 border-red-200 dark:bg-red-950 dark:border-red-800 hover:bg-red-100 dark:hover:bg-red-900 text-red-700 dark:text-red-200",
                                },
                                {
                                    value: "hard" as ReviewDifficulty,
                                    label: "Hard",
                                    description: "Difficult to recall",
                                    icon: "😓",
                                    color: "bg-orange-50 border-orange-200 dark:bg-orange-950 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900 text-orange-700 dark:text-orange-200",
                                },
                                {
                                    value: "good" as ReviewDifficulty,
                                    label: "Good",
                                    description: "Correct, but slow",
                                    icon: "👍",
                                    color: "bg-blue-50 border-blue-200 dark:bg-blue-950 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900 text-blue-700 dark:text-blue-200",
                                },
                                {
                                    value: "easy" as ReviewDifficulty,
                                    label: "Easy",
                                    description: "Correct & fast",
                                    icon: "⭐",
                                    color: "bg-green-50 border-green-200 dark:bg-green-950 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900 text-green-700 dark:text-green-200",
                                },
                            ].map((option) => (
                                <button
                                    key={option.value}
                                    onClick={() => handleSelectDifficulty(option.value)}
                                    className={cn(
                                        "p-4 rounded-xl border-2 transition-all text-center space-y-2 flex flex-col items-center justify-center font-medium",
                                        option.color,
                                        reviewState.selectedDifficulty === option.value &&
                                        "ring-2 ring-offset-2 ring-primary dark:ring-offset-slate-950 shadow-md"
                                    )}
                                    disabled={reviewState.isSubmittingReview}
                                >
                                    <div className="text-2xl">{option.icon}</div>
                                    <div className="font-semibold text-sm">{option.label}</div>
                                    <div className="text-xs opacity-70 leading-tight">
                                        {option.description}
                                    </div>
                                </button>
                            ))}
                        </div>

                        {/* Submit Result Button */}
                        <Button
                            onClick={handleSubmitResult}
                            disabled={
                                !reviewState.selectedDifficulty ||
                                reviewState.isSubmittingReview
                            }
                            className="w-full mt-6 py-6 text-base font-semibold"
                            size="lg"
                        >
                            {reviewState.isSubmittingReview ? (
                                <>
                                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                "✓ Submit & Next Card"
                            )}
                        </Button>
                    </CardContent>
                </Card>
            )}
        </div>
    )
}
