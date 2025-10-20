/**
 * Simplified FSRS (Free Spaced Repetition Scheduler) Algorithm
 * Based on the FSRS algorithm for spaced repetition learning
 *
 * Reference: https://github.com/open-spaced-repetition/fsrs.js
 */

import type { ReviewDifficulty } from "@/lib/review/difficulty-options"

export interface FSRSState {
  state: number // 1=new, 2=learning, 3=review, 4=relearning
  stability: number // Stability metric (0.0+)
  difficulty: number // Difficulty metric (1.0-10.0)
  step: number // Current learning step
  due: string // ISO timestamp - when card is due for review
  lastReview: string | null // ISO timestamp - last review
}

export interface FSRSInput {
  state: number
  stability: number
  difficulty: number
  step: number
  due: string
  lastReview: string | null
}

interface FSRSScheduling {
  newState: FSRSState
  scheduledDays: number // Number of days until next review
}

/**
 * Map user difficulty rating to performance score (0-1)
 * again=0, hard=0.3, good=0.7, easy=1.0
 */
function difficultyToPerformance(difficulty: ReviewDifficulty): number {
  const mapping: Record<ReviewDifficulty, number> = {
    again: 0,
    hard: 0.3,
    good: 0.7,
    easy: 1.0,
  }
  return mapping[difficulty] ?? 0.5
}

/**
 * Calculate interval based on stability
 * Interval = stability * Math.log(desiredRetention)
 * desiredRetention = 0.9 (90% retention target)
 */
function calculateInterval(stability: number): number {
  const desiredRetention = 0.9
  const interval = stability * Math.log(desiredRetention)
  return Math.max(1, Math.round(interval))
}

/**
 * Update stability based on performance and current stability
 */
function updateStability(
  currentStability: number,
  performance: number,
  state: number
): number {
  // Simplified stability update
  // Higher performance increases stability, lower decreases it
  const newStability = currentStability * (0.9 + 0.5 * performance)

  // New cards should have higher stability growth
  if (state === 1) {
    return Math.max(0.5, newStability)
  }

  return Math.max(0.1, newStability)
}

/**
 * Update difficulty based on performance
 * Difficulty: 1.0-10.0 range
 * Higher performance lowers difficulty, lower performance raises it
 */
function updateDifficulty(
  currentDifficulty: number,
  performance: number
): number {
  // Adjustment factor based on performance
  const adjustment = (0.5 - performance) * 2 // Range: -1 to 1
  const newDifficulty = currentDifficulty + adjustment

  // Keep difficulty in valid range
  return Math.max(1.0, Math.min(10.0, newDifficulty))
}

/**
 * Determine next learning state based on performance and current state
 */
function getNextState(
  currentState: number,
  performance: number
): number {
  // State transitions:
  // 1 (new) -> 2 (learning) or 4 (relearning)
  // 2 (learning) -> 3 (review) or 4 (relearning)
  // 3 (review) -> 3 (review) or 4 (relearning)
  // 4 (relearning) -> 2 (learning) or 4 (relearning)

  if (performance < 0.5) {
    // Failed response
    return 4 // relearning state
  }

  if (currentState === 1 || currentState === 4) {
    // Graduated from new or relearning to learning
    return 2
  }

  if (currentState === 2) {
    // From learning to review (if performance is good)
    return performance > 0.7 ? 3 : 2
  }

  // State 3 (review) stays in review unless failed
  return 3
}

/**
 * Determine learning step based on state transitions
 */
function getNextStep(
  currentState: number,
  nextState: number,
  currentStep: number
): number {
  // Reset step when transitioning to learning or relearning
  if (nextState === 2 || nextState === 4) {
    return 0
  }

  // In review state, keep step high
  if (nextState === 3) {
    return Math.max(currentStep, 3)
  }

  return currentStep
}

/**
 * Calculate days based on state and stability
 */
function calculateDaysUntilNextReview(
  state: number,
  stability: number,
  nextState: number
): number {
  if (nextState === 4) {
    // Relearning: review in 1 day
    return 1
  }

  if (nextState === 2) {
    // Learning: review in 1 day
    return 1
  }

  if (nextState === 3) {
    // Review: calculate based on stability
    return calculateInterval(stability)
  }

  return 1
}

/**
 * Main FSRS scheduling function
 * Given current card state and user performance, calculate next review schedule
 */
export function scheduleCard(
  input: FSRSInput,
  difficulty: ReviewDifficulty
): FSRSScheduling {
  const performance = difficultyToPerformance(difficulty)

  // Update metrics
  const newDifficulty = updateDifficulty(input.difficulty, performance)
  const newStability = updateStability(input.stability, performance, input.state)
  const nextState = getNextState(input.state, performance)
  const nextStep = getNextStep(input.state, nextState, input.step)
  const scheduledDays = calculateDaysUntilNextReview(
    input.state,
    newStability,
    nextState
  )

  // Calculate due date (now + scheduledDays)
  const now = new Date()
  const nextDue = new Date(now.getTime() + scheduledDays * 24 * 60 * 60 * 1000)

  return {
    newState: {
      state: nextState,
      stability: newStability,
      difficulty: newDifficulty,
      step: nextStep,
      due: nextDue.toISOString(),
      lastReview: now.toISOString(),
    },
    scheduledDays,
  }
}
