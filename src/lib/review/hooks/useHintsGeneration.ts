import { useEffect, useRef, useState } from "react"
import { getWordById } from "@/lib/words/client-utils"
import { getDeckById } from "@/lib/decks/client-utils"
import type { DeckWord } from "@/lib/types/deck-words"

interface UseHintsGenerationReturn {
  hints: string[] | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for Agent 3: Generate hints for other words in the sentence
 * This is the third step in the 3-agent review question generation pipeline
 * It depends on the answer sentence from Agent 1
 */
export function useHintsGeneration(
  card: DeckWord | undefined,
  answerSentence: string | null,
  cardIndex: number
): UseHintsGenerationReturn {
  const [hints, setHints] = useState<string[] | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!card || !answerSentence) {
      setHints(null)
      setIsLoading(false)
      return
    }

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const generateHints = async () => {
      try {
        setIsLoading(true)
        setError(null)

        const wordData = await getWordById(card.word_id)
        if (!wordData) {
          throw new Error("Word not found")
        }

        const currentDeck = await getDeckById(card.deck_id)
        if (!currentDeck) {
          throw new Error("Deck not found")
        }

        // Generate Hints
        const hintsResponse = await fetch("/api/review/generate-hints", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answerSentence: answerSentence,
            deck: currentDeck,
            word: wordData,
          }),
          signal: abortController.signal,
        })

        if (!hintsResponse.ok) {
          throw new Error("Failed to generate hints")
        }

        const hintsData = await hintsResponse.json()

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          const processedHints = Array.isArray(hintsData.hints) && hintsData.hints.length > 0
            ? hintsData.hints
            : ["Try to provide an accurate translation with context."]

          setHints(processedHints)
          setIsLoading(false)
        }
      } catch (err) {
        // Don't log abort errors as they're expected when effect re-runs
        if (err instanceof Error && err.name === "AbortError") {
          return
        }

        console.error("Error generating hints:", err)

        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Unknown error"))
          setIsLoading(false)
        }
      }
    }

    generateHints()

    // Cleanup: abort request if effect re-runs or component unmounts
    return () => {
      abortController.abort()
    }
  }, [card, answerSentence, cardIndex])

  return {
    hints,
    isLoading,
    error,
  }
}
