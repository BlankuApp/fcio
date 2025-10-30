import { useEffect, useRef, useState } from "react"
import { flushSync } from "react-dom"
import { getDeckById } from "@/lib/decks/client-utils"
import type { DeckWord } from "@/lib/types/deck-words"

interface UseQuestionTranslationReturn {
  question: string | null
  isLoading: boolean
  error: Error | null
}

/**
 * Hook for Agent 2: Translate answer to question in student's language(s)
 * This is the second step in the 3-agent review question generation pipeline
 * It depends on the answer sentence from Agent 1
 */
export function useQuestionTranslation(
  card: DeckWord | undefined,
  answerSentence: string | null,
  cardIndex: number
): UseQuestionTranslationReturn {
  const [question, setQuestion] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!card || !answerSentence) {
      setQuestion(null)
      setIsLoading(false)
      return
    }

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const translateQuestion = async () => {
      try {
        setIsLoading(true)
        setError(null)
        setQuestion("") // Reset to empty string for streaming

        const currentDeck = await getDeckById(card.deck_id)
        if (!currentDeck) {
          throw new Error("Deck not found")
        }

        // Translate Answer to Question (streaming)
        const questionResponse = await fetch("/api/review/generate-question-translation", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            answerSentence: answerSentence,
            deck: currentDeck,
          }),
          signal: abortController.signal,
        })

        if (!questionResponse.ok) {
          throw new Error("Failed to translate question")
        }

        // Handle streaming response
        const reader = questionResponse.body?.getReader()
        const decoder = new TextDecoder()

        if (!reader) {
          throw new Error("No response body")
        }

        let accumulatedText = ""
        let lastUpdateTime = Date.now()
        const UPDATE_INTERVAL = 50 // ms - update UI at most every 50ms for smooth streaming

        while (true) {
          const { done, value } = await reader.read()

          if (done) {
            break
          }

          const chunk = decoder.decode(value, { stream: true })
          accumulatedText += chunk

          // Throttle updates for smoother visual streaming
          const now = Date.now()
          const shouldUpdate = now - lastUpdateTime >= UPDATE_INTERVAL

          // Update state with accumulated text if not aborted
          if (!abortController.signal.aborted && shouldUpdate) {
            flushSync(() => {
              setQuestion(accumulatedText)
            })
            lastUpdateTime = now
          }
        }

        // Final update with complete text
        if (!abortController.signal.aborted) {
          flushSync(() => {
            setQuestion(accumulatedText)
            setIsLoading(false)
          })
        }
      } catch (err) {
        // Don't log abort errors as they're expected when effect re-runs
        if (err instanceof Error && err.name === "AbortError") {
          return
        }

        console.error("Error translating question:", err)

        if (!abortController.signal.aborted) {
          setError(err instanceof Error ? err : new Error("Unknown error"))
          setIsLoading(false)
        }
      }
    }

    translateQuestion()

    // Cleanup: abort request if effect re-runs or component unmounts
    return () => {
      abortController.abort()
    }
  }, [card, answerSentence, cardIndex])

  return {
    question,
    isLoading,
    error,
  }
}
