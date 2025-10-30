import { useEffect, useRef, useState } from "react"
import { getWordById, getRandomCollocationByWordId } from "@/lib/words/client-utils"
import { getDeckById } from "@/lib/decks/client-utils"
import type { DeckWord } from "@/lib/types/deck-words"

interface UseAnswerGenerationReturn {
  answerSentence: string | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for Agent 1: Generate answer sentence in target language
 * This is the first step in the 3-agent review question generation pipeline
 */
export function useAnswerGeneration(
  card: DeckWord | undefined,
  cardIndex: number
): UseAnswerGenerationReturn {
  const [answerSentence, setAnswerSentence] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!card) {
      setAnswerSentence(null)
      setIsLoading(false)
      return
    }

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const generateAnswer = async () => {
      try {
        setIsLoading(true)
        setError(null)

        // Fetch base data
        const wordData = await getWordById(card.word_id)
        if (!wordData) {
          throw new Error("Word not found")
        }

        const currentDeck = await getDeckById(card.deck_id)
        if (!currentDeck) {
          throw new Error("Deck not found")
        }

        const collocation = await getRandomCollocationByWordId(
          card.word_id,
          currentDeck.diff_level
        )

        // Generate Answer Sentence
        const answerResponse = await fetch("/api/review/generate-answer", {
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

        if (!answerResponse.ok) {
          throw new Error("Failed to generate answer sentence")
        }

        const answerData = await answerResponse.json()

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setAnswerSentence(answerData.answer)
          setIsLoading(false)
        }
      } catch (err) {
        // Don't log abort errors as they're expected when effect re-runs
        if (err instanceof Error && err.name === "AbortError") {
          return
        }

        console.error("Error generating answer sentence:", err)

        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Unknown error"))
          setIsLoading(false)
        }
      }
    }

    generateAnswer()

    // Cleanup: abort request if effect re-runs or component unmounts
    return () => {
      abortController.abort()
    }
  }, [card, cardIndex])

  return {
    answerSentence,
    isLoading,
    error,
  }
}
