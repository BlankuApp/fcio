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
  loadingStep: 'answer' | 'question' | 'hints' | null  // Track which agent is currently processing
}

/**
 * Hook that orchestrates 3 separate AI agents to generate review questions:
 * 1. Agent 1: Generate answer sentence in target language
 * 2. Agent 2: Translate answer to question in student's language(s)
 * 3. Agent 3: Generate hints for other words in the sentence
 */
export function useReviewQuestionThreeAgent(
  card: DeckWord | undefined,
  cardIndex: number
): UseReviewQuestionReturn {
  const [questionData, setQuestionData] = useState<ReviewQuestion | null>(null)
  const [isLoadingQuestion, setIsLoadingQuestion] = useState(true)
  const [loadingStep, setLoadingStep] = useState<'answer' | 'question' | 'hints' | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  useEffect(() => {
    if (!card) return

    // Cancel any previous requests
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
    }

    const abortController = new AbortController()
    abortControllerRef.current = abortController

    const fetchQuestionDataThreeAgent = async (): Promise<ReviewQuestion | null> => {
      try {
        // Fetch base data
        const wordData = await getWordById(card.word_id)
        if (!wordData) return null

        const currentDeck = await getDeckById(card.deck_id)
        if (!currentDeck) return null

        const collocation = await getRandomCollocationByWordId(
          card.word_id,
          currentDeck.diff_level
        )

        // AGENT 1: Generate Answer Sentence
        setLoadingStep('answer')
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
        const answerSentence = answerData.answer

        // AGENT 2: Translate Answer to Question
        setLoadingStep('question')
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

        const questionData = await questionResponse.json()

        // AGENT 3: Generate Hints
        setLoadingStep('hints')
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

        // Combine all results
        return {
          lemma: questionData.question,    // The translated question (from Agent 2)
          answer: answerSentence,          // The answer sentence (from Agent 1)
          hint: Array.isArray(hintsData.hints) && hintsData.hints.length > 0
            ? hintsData.hints
            : ["Try to provide an accurate translation with context."],
          difficulty: currentDeck.diff_level,
        }
      } catch (err) {
        // Don't log abort errors as they're expected when effect re-runs
        if (err instanceof Error && err.name === "AbortError") {
          return null
        }
        console.error("Error generating question with 3-agent flow:", err)

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
        const data = await fetchQuestionDataThreeAgent()

        // Only update state if this request wasn't aborted
        if (!abortController.signal.aborted) {
          setQuestionData(data)
          setIsLoadingQuestion(false)
          setLoadingStep(null)
        }
      } catch (err) {
        // Don't log abort errors
        if (!(err instanceof Error && err.name === "AbortError")) {
          console.error("Failed to load question data:", err)
        }
        if (!abortController.signal.aborted) {
          setIsLoadingQuestion(false)
          setLoadingStep(null)
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
    loadingStep,
  }
}
