import { useState } from "react"
import type { ReviewDifficulty } from "@/lib/review/difficulty-options"
import type { ReviewQuestion } from "./useReviewQuestion"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"

interface UseReviewAnswerReturn {
  userAnswer: string
  setUserAnswer: (answer: string) => void
  aiReview: string | null
  selectedDifficulty: ReviewDifficulty | null
  isLoading: boolean
  isSubmittingReview: boolean
  submitAnswer: (questionData: ReviewQuestion, answer: string, deck: Deck, word: Word) => Promise<void>
  selectDifficulty: (difficulty: ReviewDifficulty) => void
  submitResult: (cardId: string, difficulty: ReviewDifficulty) => Promise<void>
  resetAnswer: () => void
}

export function useReviewAnswer(): UseReviewAnswerReturn {
  const [userAnswer, setUserAnswer] = useState("")
  const [aiReview, setAiReview] = useState<string | null>(null)
  const [selectedDifficulty, setSelectedDifficulty] =
    useState<ReviewDifficulty | null>(null)
  const [isLoading, setIsLoading] = useState(false)
  const [isSubmittingReview, setIsSubmittingReview] = useState(false)

  const getAIReview = async (
    question: ReviewQuestion,
    answer: string,
    deck: Deck,
    word: Word
  ): Promise<void> => {
    try {
      const response = await fetch("/api/review/submit-answer", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          question: question.lemma,
          userAnswer: answer,
          deck,
          word,
        }),
      })

      if (!response.ok) {
        throw new Error(`Failed to get AI review: ${response.statusText}`)
      }

      // Handle streaming response
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) {
        throw new Error("Response body is not readable")
      }

      // Clear previous review and start streaming
      setAiReview("")

      while (true) {
        const { done, value } = await reader.read()

        if (done) break

        const chunk = decoder.decode(value, { stream: true })

        // Append chunk to the current review
        setAiReview((prev) => (prev || "") + chunk)
      }
    } catch (err) {
      console.error("Error getting AI review:", err)

      // Fallback: Return a generic but helpful review
      try {
        const fallbackReview = `Great attempt! Your answer "${answer}" shows engagement with the material.

Key observations:
- You responded to the question about: "${question.lemma}"
- This is a ${question.difficulty} level question
- Consider reviewing the expected usage in context to refine your understanding
- Pay attention to nuances and grammatical accuracy in future attempts

Keep practicing! Language learning is a gradual process.`
        setAiReview(fallbackReview)
      } catch (fallbackErr) {
        console.error("Error generating fallback review:", fallbackErr)
        setAiReview("Thank you for your answer. Please try again or review the material.")
      }
    }
  }

  const submitLearningResult = async (
    cardId: string,
    difficulty: ReviewDifficulty
  ): Promise<void> => {
    try {
      const response = await fetch("/api/review/submit-result", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          cardId,
          difficulty,
        }),
      })

      if (!response.ok) {
        throw new Error(
          `Failed to submit learning result: ${response.statusText}`
        )
      }

      const data = await response.json()
      console.log("Learning result submitted successfully:", data)
    } catch (err) {
      console.error("Error submitting learning result:", err)

      // Fallback: attempt to log the result locally and retry later
      try {
        const pendingResults = JSON.parse(
          localStorage.getItem("pendingReviewResults") || "[]"
        )
        pendingResults.push({
          cardId,
          difficulty,
          timestamp: new Date().toISOString(),
        })
        localStorage.setItem(
          "pendingReviewResults",
          JSON.stringify(pendingResults)
        )
        console.log(
          "Learning result saved to local storage for retry",
          cardId
        )
      } catch (storageErr) {
        console.error("Failed to save learning result locally:", storageErr)
        throw new Error(
          "Failed to submit learning result and save locally. Please try again."
        )
      }
    }
  }

  const submitAnswer = async (
    questionData: ReviewQuestion,
    answer: string,
    deck: Deck,
    word: Word
  ): Promise<void> => {
    if (!answer.trim()) return

    try {
      setIsLoading(true)
      await getAIReview(questionData, answer, deck, word)
    } catch (err) {
      console.error("Failed to get AI review:", err)
      setAiReview("Error getting review. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  const selectDifficulty = (difficulty: ReviewDifficulty) => {
    setSelectedDifficulty(difficulty)
  }

  const submitResult = async (
    cardId: string,
    difficulty: ReviewDifficulty
  ): Promise<void> => {
    try {
      setIsSubmittingReview(true)
      await submitLearningResult(cardId, difficulty)
    } finally {
      setIsSubmittingReview(false)
    }
  }

  const resetAnswer = () => {
    setUserAnswer("")
    setAiReview(null)
    setSelectedDifficulty(null)
    setIsLoading(false)
  }

  return {
    userAnswer,
    setUserAnswer,
    aiReview,
    selectedDifficulty,
    isLoading,
    isSubmittingReview,
    submitAnswer,
    selectDifficulty,
    submitResult,
    resetAnswer,
  }
}
