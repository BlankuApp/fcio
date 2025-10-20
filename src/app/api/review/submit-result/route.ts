import { NextRequest } from "next/server"
import { getCurrentUser } from "@/lib/auth/server-utils"
import { getDeckWordById, updateDeckWord } from "@/lib/decks/deck-words-server"
import { scheduleCard } from "@/lib/review/fsrs-algorithm"
import type { ReviewDifficulty } from "@/lib/review/difficulty-options"

export interface SubmitReviewRequest {
  cardId: string
  difficulty: ReviewDifficulty
}

export interface SubmitReviewResponse {
  success: boolean
  cardId: string
  newState: number
  newStability: number
  newDifficulty: number
  nextDueDate: string
  scheduledDays: number
  message: string
}

export async function POST(request: NextRequest) {
  try {
    // Verify user is authenticated
    const user = await getCurrentUser()
    if (!user) {
      return Response.json(
        { error: "Unauthorized: User not authenticated" },
        { status: 401 }
      )
    }

    // Parse request body
    const body: SubmitReviewRequest = await request.json()
    const { cardId, difficulty } = body

    // Validate input
    if (!cardId || !difficulty) {
      return Response.json(
        { error: "Missing required fields: cardId and difficulty" },
        { status: 400 }
      )
    }

    // Validate difficulty value
    const validDifficulties = ["again", "hard", "good", "easy"]
    if (!validDifficulties.includes(difficulty)) {
      return Response.json(
        { error: `Invalid difficulty: ${difficulty}` },
        { status: 400 }
      )
    }

    // Get the current card state
    const currentCard = await getDeckWordById(cardId)
    if (!currentCard) {
      return Response.json(
        { error: `Card not found: ${cardId}` },
        { status: 404 }
      )
    }

    // TODO: Verify that the card belongs to the current user's deck
    // For now, we'll trust the cardId

    // Calculate new metrics using FSRS algorithm
    const scheduling = scheduleCard(
      {
        state: currentCard.state,
        stability: currentCard.stability,
        difficulty: currentCard.difficulty,
        step: currentCard.step,
        due: currentCard.due,
        lastReview: currentCard.last_review,
      },
      difficulty
    )

    // Update the card in the database
    const updatedCard = await updateDeckWord(cardId, {
      state: scheduling.newState.state,
      stability: scheduling.newState.stability,
      difficulty: scheduling.newState.difficulty,
      step: scheduling.newState.step,
      due: scheduling.newState.due,
      last_review: scheduling.newState.lastReview,
    })

    console.log(`Review submitted for card ${cardId} with difficulty: ${difficulty}`)

    return Response.json({
      success: true,
      cardId,
      newState: scheduling.newState.state,
      newStability: scheduling.newState.stability,
      newDifficulty: scheduling.newState.difficulty,
      nextDueDate: scheduling.newState.due,
      scheduledDays: scheduling.scheduledDays,
      message: `Card updated successfully. Next review in ${scheduling.scheduledDays} days.`,
    } as SubmitReviewResponse)
  } catch (error) {
    console.error("Error submitting review:", error)
    return Response.json(
      { error: "Failed to submit review result" },
      { status: 500 }
    )
  }
}
