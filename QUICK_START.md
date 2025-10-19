# 🚀 Quick Start Guide - Deck Review Page

## 📍 What to Do First

### 1. Test the UI (Right Now)
```bash
npm run dev
```

Then:
1. Go to `http://localhost:3030`
2. Navigate to any deck
3. Click "Start Practice"
4. See the review page in action!

### 2. Explore the Code
- **Main Component**: `src/components/deck-review-client.tsx` (380 lines)
- **Review Page**: `src/app/decks/[deck_id]/review/page.tsx`
- **Documentation**: Read `IMPLEMENTATION_GUIDE.md` for next steps

---

## 🎯 What's Working Now

✅ Beautiful responsive UI
✅ Progress tracking
✅ Question/hint/answer flow
✅ Difficulty selection (4 buttons)
✅ Card navigation
✅ Completion screen
✅ Loading states
✅ Dark mode support
✅ Mobile responsive

---

## 🔧 What Needs Implementation

⏳ Connect to actual question data (API)
⏳ Generate AI reviews (OpenAI)
⏳ Update learning metrics (Database)

See `IMPLEMENTATION_GUIDE.md` for detailed steps.

---

## 📂 Key Files

```
NEW FILES:
├── src/components/deck-review-client.tsx       (Main component)
├── src/app/decks/[deck_id]/review/page.tsx    (Review page)

DOCUMENTATION:
├── DELIVERY_SUMMARY.md                         (What was created)
├── REVIEW_PAGE_OVERVIEW.md                     (Features & architecture)
├── IMPLEMENTATION_GUIDE.md                     (TODO: How to implement)
├── UI_MOCKUP.md                                (UI design specs)
└── TESTING_QUICK_START.md                      (Test existing features)

MODIFIED FILES:
└── src/app/decks/[deck_id]/page.tsx            (Added Start Practice link)
```

---

## 🎓 Three Functions to Implement

### Function 1: Get Question Data
**File**: `deck-review-client.tsx` line 136  
**Purpose**: Fetch question from database  
**Status**: Currently returns dummy data  

```typescript
// Replace this:
return {
    lemma: `Question ${cardIndex + 1}`,
    hint: "This is a hint...",
    difficulty: "intermediate",
}

// With this:
const word = await getWordById(currentCard.word_id)
return {
    lemma: word.lemma,
    hint: word.collocations[0],
    difficulty: "intermediate",
}
```

### Function 2: Generate AI Review
**File**: `deck-review-client.tsx` line 155  
**Purpose**: Get AI feedback on answer  
**Status**: Currently returns dummy review  

```typescript
// Replace the entire function with:
const response = await fetch("/api/review/answer", {
    method: "POST",
    body: JSON.stringify({
        questionLemma: question.lemma,
        userAnswer: answer,
        difficulty: question.difficulty,
    })
})
const data = await response.json()
return data.review
```

### Function 3: Submit Learning Result
**File**: `deck-review-client.tsx` line 186  
**Purpose**: Update spaced repetition metrics  
**Status**: Currently just logs  

```typescript
// Replace the entire function with:
const response = await fetch("/api/review/submit", {
    method: "POST",
    body: JSON.stringify({
        deckWordId: cardId,
        difficulty: difficulty,
    })
})
if (!response.ok) throw new Error("Failed to submit")
```

---

## 📚 Documentation Map

| Document | Purpose | Read When |
|----------|---------|-----------|
| **DELIVERY_SUMMARY.md** | Overview of what was built | Starting out |
| **REVIEW_PAGE_OVERVIEW.md** | Features, UI, architecture | Understanding the system |
| **UI_MOCKUP.md** | Visual design specifications | Checking design details |
| **IMPLEMENTATION_GUIDE.md** | How to implement dummy functions | Ready to code |
| **This File** | Quick reference | Need quick answers |

---

## 🧪 Testing Checklist

### Before You Start Coding
- [ ] Run `npm run dev`
- [ ] Navigate to a deck
- [ ] Click "Start Practice"
- [ ] See review page load
- [ ] Try entering an answer
- [ ] Click difficulty buttons
- [ ] Verify it shows completion screen
- [ ] Test on mobile view

### While Implementing
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Component renders correctly
- [ ] API calls return data
- [ ] Database updates work
- [ ] Spaced repetition calculates

### Before Shipping
- [ ] All 3 functions implemented
- [ ] API endpoints created
- [ ] Database queries tested
- [ ] Metrics updating correctly
- [ ] Mobile responsive
- [ ] Dark mode working
- [ ] Error handling works

---

## 🔌 API Endpoints to Create

### 1. `/api/review/answer` (POST)
```typescript
// Input:
{
    questionLemma: string,
    userAnswer: string,
    difficulty: string
}

// Output:
{
    review: string
}
```

### 2. `/api/review/submit` (POST)
```typescript
// Input:
{
    deckWordId: string,
    difficulty: "again" | "hard" | "good" | "easy"
}

// Output:
{
    success: boolean,
    nextReviewDate: string
}
```

---

## 💾 Database Helpers Needed

### Get Word by ID
```typescript
// Add to src/lib/words/client-utils.ts
export async function getWordById(id: string): Promise<Word | null> {
    const supabase = createClient()
    const { data, error } = await supabase
        .from("words")
        .select("*")
        .eq("id", id)
        .single()
    if (error && error.code !== "PGRST116") throw error
    return (data as Word) || null
}
```

### Calculate Spaced Repetition
```typescript
// Create src/lib/spaced-repetition/fsrs.ts
export function calculateNextReview(
    deckWord: DeckWord,
    difficulty: ReviewDifficulty,
    reviewedAt: string
): UpdateDeckWordInput {
    // Calculate new state, stability, difficulty, due
    // Return object to update database
}
```

---

## 🐛 Common Issues & Solutions

### Issue: Cards not loading
**Check**: 
- [ ] Supabase connection working
- [ ] `getDueCards()` and `listDeckWords()` available
- [ ] Browser console for errors

### Issue: AI review not showing
**Check**:
- [ ] `/api/review/answer` endpoint exists
- [ ] OpenAI API key configured
- [ ] Network tab for failed requests

### Issue: Metrics not updating
**Check**:
- [ ] `/api/review/submit` endpoint exists
- [ ] User has permission to update `deck_words`
- [ ] `calculateNextReview()` returns valid data

---

## 📞 Reference Files

Keep these handy when coding:

1. **Type Definitions**:
   - `src/lib/types/deck-words.ts` - DeckWord interface
   - `src/lib/types/words.ts` - Word interface
   - `src/lib/types/deck.ts` - Deck interface

2. **Existing Utilities**:
   - `src/lib/decks/client-utils.ts` - Deck operations
   - `src/lib/decks/deck-words-client.ts` - Card operations
   - `src/lib/words/client-utils.ts` - Word operations

3. **API Examples**:
   - Check `src/app/api/` for existing routes
   - Reference error handling patterns
   - Follow authentication patterns

---

## 🎯 Implementation Order

### Phase 1: Data Fetching (Highest Priority)
1. Create `getWordById()` in `words/client-utils.ts`
2. Implement `fetchQuestionData()` in review component
3. Test with real question data

### Phase 2: AI Integration
1. Create `/api/review/answer` endpoint
2. Implement `getAIReview()` in review component
3. Test AI review generation

### Phase 3: Spaced Repetition
1. Create FSRS calculation function
2. Create `/api/review/submit` endpoint
3. Implement `submitLearningResult()` in review component
4. Test database updates

---

## 🚨 Don't Forget

- ✅ Use `"use client"` for client components
- ✅ Use `await createClient()` for server-side Supabase
- ✅ Handle errors gracefully
- ✅ Add loading states to UI
- ✅ Validate user input
- ✅ Check authentication
- ✅ Test on mobile
- ✅ Update TypeScript types if needed

---

## 📊 Component Props Reference

```typescript
// DeckReviewClient requires:
{
    deckId: string              // e.g., "abc123def45"
    queLanguage: string         // e.g., "en", "ja", "es"
}

// ReviewQuestion interface:
{
    lemma: string               // e.g., "taberu"
    hint: string                // e.g., "Common breakfast verb"
    difficulty: string          // e.g., "intermediate"
}

// ReviewDifficulty type:
"again" | "hard" | "good" | "easy"
```

---

## 🎨 Component Styling Guide

All components use **Tailwind CSS** + **shadcn/ui**:

```typescript
// Use cn() for conditional classes
import { cn } from "@/lib/utils"

<div className={cn(
    "base-class",
    isSelected && "selected-class",
    isDark && "dark-class"
)} />
```

---

## 🔐 Security Checklist

- [ ] Validate user authentication
- [ ] Check deck ownership before accessing
- [ ] Sanitize user input (especially answers)
- [ ] Rate limit API endpoints
- [ ] Validate difficulty selection (enum only)
- [ ] Check admin/user permissions
- [ ] Secure API route access

---

## 📈 Performance Tips

- Load 50 cards max per session
- Use pagination for large datasets
- Cache question data locally
- Debounce input handlers
- Lazy load hints (accordion)
- Optimize AI API calls
- Monitor bundle size

---

## 🎓 Learning Resources in This Repo

- **Supabase Patterns**: Check `lib/supabase/` files
- **Auth Patterns**: Check `lib/auth/` files
- **API Routes**: Check `app/api/` routes
- **Component Patterns**: Check `components/ui/` files
- **Type Safety**: Check `lib/types/` files

---

## ✅ Success Indicators

You'll know everything is working when:

1. ✅ Cards load from database
2. ✅ Questions display correctly
3. ✅ AI generates unique reviews
4. ✅ Metrics update after submission
5. ✅ Next review dates calculate
6. ✅ Multiple cards flow smoothly
7. ✅ Completion screen appears
8. ✅ No console errors
9. ✅ Mobile responsive
10. ✅ Dark mode works

---

## 📞 Need Help?

Refer to:
1. `IMPLEMENTATION_GUIDE.md` - Step-by-step instructions
2. `REVIEW_PAGE_OVERVIEW.md` - Architecture & design
3. `UI_MOCKUP.md` - Visual reference
4. Copilot Instructions - Project patterns
5. Existing code - Look for similar patterns

---

**Status**: 🎉 UI Complete, Ready for Backend Implementation  
**Estimated Time to Full Implementation**: 3-4 hours  
**Difficulty**: Medium (requires API + DB knowledge)

Good luck! 🚀
