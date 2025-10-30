import { useEffect, useRef, useState } from "react"
import { getWordById, getRandomCollocationByWordId } from "@/lib/words/client-utils"
import { getDeckById } from "@/lib/decks/client-utils"
import type { DeckWord } from "@/lib/types/deck-words"

export interface ReviewQuestion {
  lemma: string
  answer: string
  hint: string[]
  difficulty: string
}

interface UseReviewQuestionReturn {
  questionData: ReviewQuestion | null
  isLoadingQuestion: boolean
}

export function useReviewQuestion(
  card: DeckWord | undefined,
  cardIndex: number
): UseReviewQuestionReturn {
  const [questionData, setQuestionData] = useState<ReviewQuestion | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!card) return

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchQuestionData = async (): Promise<ReviewQuestion | null> => {
      try {
        const wordData = await getWordById(card.word_id)
        if (!wordData) return null

        const currentDeck = await getDeckById(card.deck_id)
        if (!currentDeck) return null

        const collocation = await getRandomCollocationByWordId(
          card.word_id,
          currentDeck.diff_level
        )

        const response = await fetch("/api/review/generate-question", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            collocation: collocation || undefined,
            deck: currentDeck,
            word: wordData,
          }),
          signal: abortController.signal,
        })

        if (!response.ok) {
          throw new Error("Failed to generate question")
        }

        const data = await response.json()
        return {
          lemma: data.question,
          answer: data.answer,
          hint:
            Array.isArray(data.hints) && data.hints.length > 0
              ? data.hints
              : ["Try to provide an accurate translation with context."],
          difficulty: currentDeck.diff_level,
        }
      } catch (err) {
        // Don't log abort errors as they're expected when effect re-runs
        if (err instanceof Error && err.name === "AbortError") {
          return null
        }
        console.error("Error generating question:", err)

        // Fallback to basic question if OpenAI fails
        try {
          const wordData = await getWordById(card.word_id)
          const currentDeck = await getDeckById(card.deck_id)
          const collocation = await getRandomCollocationByWordId(
            card.word_id,
            currentDeck?.diff_level || "beginner"
          )

          return {
            lemma: `Translate: ${wordData?.lemma}${collocation ? ` (${collocation})` : ""}`,
            answer: wordData?.lemma || "",
            hint: ["Try to provide an accurate translation with context."],
            difficulty: currentDeck?.diff_level || "beginner",
          }
        } catch (fallbackErr) {
          console.error("Error generating fallback question:", fallbackErr)
          return null
        }
      }
    }

    const loadQuestionData = async () => {
      try {
        setIsLoadingQuestion(true)
        const data = await fetchQuestionData()

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setQuestionData(data)
          setIsLoadingQuestion(false)
        }
      } catch (err) {
        // Don't log abort errors
        if (!(err instanceof Error && err.name === "AbortError")) {
          console.error("Failed to load question data:", err)
        }
        if (!abortController.signal.aborted) {
          setIsLoadingQuestion(false)
        }
      }
    }

    loadQuestionData()

    // Cleanup: abort request if effect re-runs or component unmounts
    return () => {
      abortController.abort()
    }
  }, [card, cardIndex])

  return {
    questionData,
    isLoadingQuestion,
  }
}
