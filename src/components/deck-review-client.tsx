"use client"

import { useEffect, useState } from "react"
import { Loader2 } from "lucide-react"
import { useReviewCards } from "@/lib/review/hooks/useReviewCards"
import { useReviewQuestionThreeAgent } from "@/lib/review/hooks/useReviewQuestionThreeAgent"
import { useReviewAnswer } from "@/lib/review/hooks/useReviewAnswer"
import { getDeckById } from "@/lib/decks/client-utils"
import { getWordById } from "@/lib/words/client-utils"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"
import { QuestionCard } from "@/components/deck-review/QuestionCard"
import { HintAccordion } from "@/components/deck-review/HintAccordion"
import { AnswerInput } from "@/components/deck-review/AnswerInput"
import { AIReviewCard } from "@/components/deck-review/AIReviewCard"
import { DifficultySelector } from "@/components/deck-review/DifficultySelector"
import { ReviewCompleteCard } from "@/components/deck-review/ReviewCompleteCard"
import { ErrorCard } from "@/components/deck-review/ErrorCard"

interface DeckReviewClientProps {
  deckId: string
  queLanguage: string
}

export function DeckReviewClient({ deckId, queLanguage }: DeckReviewClientProps) {
  const [deck, setDeck] = useState<Deck | null>(null)
  const [currentWord, setCurrentWord] = useState<Word | null>(null)

  const {
    cards,
    isLoadingCards,
    loadError,
    currentCardIndex,
    setCurrentCardIndex,
    isReviewComplete,
  } = useReviewCards(deckId)

  const currentCard = cards[currentCardIndex]
  const { questionData, isLoadingQuestion, loadingStep } = useReviewQuestionThreeAgent(
    currentCard,
    currentCardIndex
  )

  const {
    userAnswer,
    setUserAnswer,
    aiReview,
    selectedDifficulty,
    isLoading: isReviewingAnswer,
    isSubmittingReview,
    submitAnswer,
    selectDifficulty,
    submitResult,
    resetAnswer,
  } = useReviewAnswer()

  // Fetch deck data to get AI prompts
  useEffect(() => {
    const loadDeck = async () => {
      try {
        const deckData = await getDeckById(deckId)
        setDeck(deckData)
      } catch (err) {
        console.error("Failed to load deck:", err)
      }
    }
    loadDeck()
  }, [deckId])

  // Fetch current word data
  useEffect(() => {
    const loadWord = async () => {
      if (!currentCard?.word_id) {
        setCurrentWord(null)
        return
      }
      try {
        const wordData = await getWordById(currentCard.word_id)
        setCurrentWord(wordData)
      } catch (err) {
        console.error("Failed to load word:", err)
        setCurrentWord(null)
      }
    }
    loadWord()
  }, [currentCard?.word_id])

  // Loading cards state
  if (isLoadingCards) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
      </div>
    )
  }

  // Error or no cards state
  if (loadError || cards.length === 0) {
    return <ErrorCard error={loadError} isEmpty={cards.length === 0} />
  }

  // Review complete state
  if (isReviewComplete) {
    return <ReviewCompleteCard cardCount={cards.length} />
  }

  // Handle submit answer
  const handleSubmitAnswer = async () => {
    if (!questionData || !deck || !currentWord) return
    await submitAnswer(questionData, userAnswer, deck, currentWord)
  }

  // Handle submit result and move to next card
  const handleSubmitResult = async () => {
    if (!selectedDifficulty || !currentCard) return

    await submitResult(currentCard.id, selectedDifficulty)

    // Move to next card
    const nextIndex = currentCardIndex + 1
    setCurrentCardIndex(nextIndex)
    resetAnswer()
  }

  // Main review interface
  return (
    <div className="space-y-4">
      <QuestionCard
        question={questionData?.lemma}
        isLoading={isLoadingQuestion}
        loadingStep={loadingStep}
        language={queLanguage}
      />

      <div className="space-y-2">
        <HintAccordion hint={questionData?.hint} />

        <AnswerInput
          value={userAnswer}
          onChange={setUserAnswer}
          onSubmit={handleSubmitAnswer}
          isLoading={isReviewingAnswer}
          isDisabled={isLoadingQuestion}
          hasReview={aiReview !== null}
        />
      </div>

      {aiReview && (
        <div className="space-y-3">
          <AIReviewCard
            review={aiReview}
            answer={questionData?.answer}
            isLoading={isReviewingAnswer}
          />

          <DifficultySelector
            selectedDifficulty={selectedDifficulty}
            onSelectDifficulty={selectDifficulty}
            onSubmit={handleSubmitResult}
            isLoading={isSubmittingReview}
          />
        </div>
      )}
    </div>
  )
}
