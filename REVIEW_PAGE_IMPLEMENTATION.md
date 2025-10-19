# Deck Review Implementation Summary

## Overview
Created a comprehensive review page for deck practice sessions with AI-powered answer review and spaced repetition learning algorithm selection.

## Files Created

### 1. **`src/components/deck-review-client.tsx`**
Main review component with the following features:

#### Key Components:
- **Progress Bar**: Visual progress indicator showing current card progress
- **Question Card**: Displays the current question being reviewed
- **Hint Accordion**: Collapsible accordion showing hints for the question
- **Answer Input**: Text area for user to enter their answer
- **AI Review Section**: Shows AI feedback after answer submission
- **Spaced Repetition Options**: Four difficulty buttons for learning algorithm:
  - **Again** (Red): "I don't remember"
  - **Hard** (Orange): "Difficult to recall"
  - **Good** (Blue): "Correct, but slow"
  - **Easy** (Green): "Correct & fast"
- **Submit & Next Button**: Submits the result and loads the next card

#### State Management:
- Tracks current card index and progress
- Manages user answer input
- Stores AI review response
- Handles difficulty selection
- Manages loading states for API calls

#### Dummy Functions (TODO - Replace Later):
1. `fetchQuestionData()` - Fetches question details
2. `getAIReview()` - Gets AI review of the answer
3. `submitLearningResult()` - Submits the learning result with difficulty

#### Features:
- Loads due cards for review (or all cards if none are due)
- Shows completion screen when all cards are reviewed
- Responsive grid layout for difficulty buttons
- Smooth transitions and animations
- Loading states for better UX
- Error handling and fallback UI

### 2. **`src/app/decks/[deck_id]/review/page.tsx`**
Review page that loads the deck and renders the review component.

#### Features:
- Loads deck information
- Shows deck name and session title
- Exit button to go back
- Passes necessary data to `DeckReviewClient` component

## Route Structure
```
/decks/[deck_id]/          - Deck details page (existing)
/decks/[deck_id]/review    - NEW - Review session page
```

## Integration Points

### Updated Files:
- **`src/app/decks/[deck_id]/page.tsx`**: Added `onClick` handler to "Start Practice" button to navigate to `/decks/{deck_id}/review`

## Styling
- Uses shadcn/ui components for consistency
- Tailwind CSS for responsive design
- Custom color schemes for difficulty levels (red, orange, blue, green)
- Dark mode support
- Smooth transitions and animations

## TODO Items (Marked in Code)

Replace dummy functions with actual implementations:

1. **`fetchQuestionData()`** - Line ~136
   - Currently returns dummy data
   - Should fetch actual question from word_id

2. **`getAIReview()`** - Line ~155
   - Currently returns dummy review text
   - Should call AI API to generate review based on:
     - Question lemma/content
     - User's answer
     - Expected answer
     - Language context

3. **`submitLearningResult()`** - Line ~186
   - Currently just logs to console
   - Should update spaced repetition metrics in `deck_words` table:
     - Update `state`, `stability`, `difficulty`, `due` based on difficulty selection
     - Track `last_review` timestamp
     - Calculate next review date

## API Requirements (When Implementing)

You'll need to create endpoints or functions for:

1. **POST /api/review/answer** - Get AI review
   - Input: `{cardId, question, userAnswer}`
   - Output: `{review: string}`

2. **POST /api/review/submit** - Submit learning result
   - Input: `{cardId, difficulty: "again" | "hard" | "good" | "easy"}`
   - Output: `{nextDueDate: string}`

## Database Queries Needed

When implementing, you'll use:
- `getDueCards()` - Already imported from `deck-words-client`
- `listDeckWords()` - Already imported from `deck-words-client`
- `updateDeckWord()` - To update learning metrics after review

## User Flow

1. User clicks "Start Practice" on deck page
2. Navigated to `/decks/{deck_id}/review`
3. Review page loads deck info and initializes review
4. For each card:
   - Display question
   - User enters answer
   - AI reviews and provides feedback
   - User selects difficulty level
   - Result submitted
   - Move to next card
5. After all cards, show completion screen

## Component Props

```typescript
interface DeckReviewClientProps {
    deckId: string           // ID of the deck to review
    queLanguage: string      // Question language code
}
```

## Spaced Repetition Integration

The four difficulty buttons map to spaced repetition algorithm inputs:
- "Again" - Card failed, reset learning curve
- "Hard" - Card was hard, increase interval slowly
- "Good" - Card learned correctly, normal interval
- "Easy" - Card mastered, increase interval more

These will be used in the FSRS algorithm implementation to update `deck_words` metrics.
