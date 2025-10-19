# Implementation Guide: Replacing Dummy Functions

This guide shows where to implement the three key dummy functions in the review component.

## File Location
`src/components/deck-review-client.tsx`

---

## 1. fetchQuestionData() - Lines 136-150

### Current Dummy Implementation
```typescript
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
```

### What It Should Do
1. Get the current `DeckWord` from cards array
2. Use `word_id` to fetch the actual `Word` record
3. Extract the lemma and collocations from the word
4. Use collocations as hints

### Implementation Example
```typescript
const fetchQuestionData = async (cardIndex: number): Promise<ReviewQuestion | null> => {
    try {
        const currentCard = cards[cardIndex]
        if (!currentCard) return null

        // Fetch the word data using word_id
        const word = await getWordById(currentCard.word_id) // TODO: create this function
        if (!word) return null

        // Extract a hint from collocations
        const hints = Object.values(word.collocations)
            .flatMap(patterns => patterns.map(p => p.collocation))
        const hint = hints.length > 0 ? hints[0] : "No hints available"

        return {
            lemma: word.lemma,
            hint: hint,
            difficulty: word.lang === "en" ? "intermediate" : "advanced",
        }
    } catch (err) {
        console.error("Failed to fetch question data:", err)
        return null
    }
}
```

### Database Queries Needed
- Create `getWordById(wordId: string)` in `src/lib/words/client-utils.ts`
- Query: `SELECT * FROM words WHERE id = $1`

---

## 2. getAIReview() - Lines 155-175

### Current Dummy Implementation
```typescript
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
```

### What It Should Do
1. Call OpenAI API (or similar AI service)
2. Send the question, expected answer, and user's answer
3. Generate constructive feedback
4. Include learning suggestions

### Implementation Example
```typescript
const getAIReview = async (question: ReviewQuestion, answer: string): Promise<string> => {
    try {
        const response = await fetch("/api/review/answer", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                questionLemma: question.lemma,
                userAnswer: answer,
                difficulty: question.difficulty,
                language: queLanguage, // from props
            }),
        })

        if (!response.ok) throw new Error("Failed to get review")

        const data = await response.json()
        return data.review
    } catch (err) {
        console.error("Failed to get AI review:", err)
        return "Unable to generate review. Please try again."
    }
}
```

### API Endpoint to Create
**POST /api/review/answer**

```typescript
// src/app/api/review/answer/route.ts
import { NextRequest, NextResponse } from "next/server"
import { openai } from "@/lib/ai/openai-client"

export async function POST(request: NextRequest) {
    const { questionLemma, userAnswer, difficulty, language } = await request.json()

    const prompt = `You are a language learning tutor.

User is learning: ${language}
Word/Concept: ${questionLemma}
Difficulty: ${difficulty}

User's Answer: "${userAnswer}"

Provide constructive feedback on their answer. Include:
1. How well they understood the concept
2. Specific improvements they could make
3. Related concepts to remember
4. Encouragement`

    const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{ role: "user", content: prompt }],
    })

    const review = response.choices[0]?.message.content || "No review generated"

    return NextResponse.json({ review })
}
```

---

## 3. submitLearningResult() - Lines 186-200

### Current Dummy Implementation
```typescript
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
```

### What It Should Do
1. Calculate next review date based on FSRS algorithm
2. Update the `deck_words` record with new metrics
3. Track learning progress
4. Fetch next card's details

### Implementation Example
```typescript
const submitLearningResult = async (
    deckWordId: string,
    difficulty: ReviewDifficulty
): Promise<void> => {
    try {
        const response = await fetch("/api/review/submit", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                deckWordId,
                difficulty,
            }),
        })

        if (!response.ok) throw new Error("Failed to submit review")

        const data = await response.json()
        console.log("Learning result submitted:", data)
    } catch (err) {
        console.error("Failed to submit learning result:", err)
        throw err
    }
}
```

### API Endpoint to Create
**POST /api/review/submit**

```typescript
// src/app/api/review/submit/route.ts
import { NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"
import { calculateNextReview } from "@/lib/spaced-repetition/fsrs" // TODO: create

export async function POST(request: NextRequest) {
    const supabase = await createClient()
    const { deckWordId, difficulty } = await request.json()

    try {
        // Get current deck_word
        const { data: deckWord, error: fetchError } = await supabase
            .from("deck_words")
            .select("*")
            .eq("id", deckWordId)
            .single()

        if (fetchError) throw fetchError

        // Calculate new metrics based on difficulty
        const metrics = calculateNextReview(
            deckWord,
            difficulty,
            new Date().toISOString()
        )

        // Update deck_word with new metrics
        const { error: updateError } = await supabase
            .from("deck_words")
            .update(metrics)
            .eq("id", deckWordId)

        if (updateError) throw updateError

        return NextResponse.json({
            success: true,
            nextReviewDate: metrics.due,
        })
    } catch (err) {
        console.error("Error submitting review:", err)
        return NextResponse.json(
            { error: "Failed to submit review" },
            { status: 500 }
        )
    }
}
```

### Spaced Repetition Calculation

Create `src/lib/spaced-repetition/fsrs.ts`:

```typescript
import type { DeckWord } from "@/lib/types/deck-words"
import type { UpdateDeckWordInput } from "@/lib/types/deck-words"

export type ReviewDifficulty = "again" | "hard" | "good" | "easy"

export function calculateNextReview(
    deckWord: DeckWord,
    difficulty: ReviewDifficulty,
    reviewedAt: string
): UpdateDeckWordInput {
    let state = deckWord.state
    let stability = deckWord.stability
    let newDifficulty = deckWord.difficulty
    let intervalDays = 1

    switch (difficulty) {
        case "again":
            // Failed - reset learning
            state = 1 // new
            stability = Math.max(0.5, stability * 0.5)
            newDifficulty = Math.min(10, newDifficulty + 1)
            intervalDays = 1

        case "hard":
            // Difficult but not failed
            if (state < 2) state = 2 // learning
            stability = Math.max(1, stability * 0.8)
            newDifficulty = Math.min(10, newDifficulty + 0.5)
            intervalDays = 1

        case "good":
            // Correct and normal pace
            state = 3 // review
            stability = Math.max(2, stability + 1)
            newDifficulty = Math.max(1, newDifficulty - 0.5)
            intervalDays = 3

        case "easy":
            // Mastered
            state = 3 // review
            stability = stability + 2
            newDifficulty = Math.max(1, newDifficulty - 1)
            intervalDays = 7
    }

    const nextDue = new Date(reviewedAt)
    nextDue.setDate(nextDue.getDate() + intervalDays)

    return {
        state,
        stability,
        difficulty: newDifficulty,
        due: nextDue.toISOString(),
        last_review: reviewedAt,
    }
}
```

---

## Summary of Changes Needed

| Component | Location | Priority |
|-----------|----------|----------|
| `fetchQuestionData()` | deck-review-client.tsx | HIGH |
| `getAIReview()` | deck-review-client.tsx | HIGH |
| `submitLearningResult()` | deck-review-client.tsx | HIGH |
| `getWordById()` | words/client-utils.ts | HIGH |
| POST `/api/review/answer` | app/api/review/answer/route.ts | HIGH |
| POST `/api/review/submit` | app/api/review/submit/route.ts | HIGH |
| `calculateNextReview()` | spaced-repetition/fsrs.ts | HIGH |

---

## Testing the Implementation

### 1. Test Question Fetching
```typescript
// In browser console
const questionData = await fetchQuestionData(0)
console.log(questionData) // Should show lemma, hint, difficulty
```

### 2. Test AI Review
```typescript
// In browser console
const review = await getAIReview(
    { lemma: "test", hint: "hint", difficulty: "intermediate" },
    "user answer"
)
console.log(review) // Should show detailed feedback
```

### 3. Test Learning Result Submission
```typescript
// In browser console
await submitLearningResult("card-id", "good")
console.log("Submitted successfully")
```

---

## Database Schema Reference

### deck_words table
```typescript
{
    id: string                    // UUID
    deck_id: string              // Foreign key
    word_id: string              // Foreign key
    state: number                // 1-4 (new/learning/review/relearning)
    stability: number            // 0.0-10.0+ (memory strength)
    difficulty: number           // 1.0-10.0 (card difficulty)
    due: string                  // ISO timestamp (next review date)
    last_review: string | null   // ISO timestamp
    step: number                 // Current learning step
    created_at: string           // ISO timestamp
    updated_at: string           // ISO timestamp
}
```

### words table
```typescript
{
    id: string                   // UUID
    lemma: string               // Word/concept
    lang: string                // Language code
    collocations: {
        [pattern: string]: {
            collocation: string
            difficulty: string
        }[]
    }
    created_at: string
    updated_at: string
}
```

---

**Next Steps**: Start with `fetchQuestionData()`, then `getAIReview()`, then `submitLearningResult()`
