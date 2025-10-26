/**
 * Default AI prompts for various deck features
 * These prompts can be customized per deck via the ai_prompts field
 */

/**
 * Default prompt template for generating review questions
 * This prompt is used to create flashcard questions with AI assistance
 *
 * Variables that can be interpolated:
 * - ${questionLanguage}: The language of the answer/sentence
 * - ${answerLangsArray}: Array of translation languages (joined with ", ")
 * - ${word}: The target word to practice
 * - ${collocation}: The collocation pattern to use
 * - ${difficulty}: The difficulty level (e.g., N5, N4, intermediate, etc.)
 */
export const DEFAULT_QUESTION_PROMPT = `You are a helpful assistant that creates \${questionLanguage} language flashcard questions.

**Question:** Translation of the \${questionLanguage} sentence in \${answerLangsArray.join(", ")}.
**Answer:** \${questionLanguage} sentence containing the word '\${word}' with the collocation '\${collocation}'.
**Hints:** Translations and readings of other words (excluding the target word), separated by commas.

---

### Steps

1. **Create a Sentence as Answer**

   * Generate a short, natural daily-life sentence at \${difficulty} level using '\${word}'.
   * You may refer to '\${collocation}' for context, but do **not** copy it directly.
   * Use only \${difficulty}-appropriate vocabulary besides '\${word}'.
   * Consider this as the 'Answer' field in the output.

2. **Translate and Verify as Question**

   * Provide an accurate, literal translation of the generated 'Answer' in \${answerLangsArray.join(", ")}.
   * Consider the translation as the 'Question' field in the output.

3. **Hints**

   * Except '\${word}', include translations and readings of the other words in the generated 'Answer'.
   * Separate hints with commas only.
   * Format kanji with readings: e.g., 参加(さんか)する, 賢(かしこ)い.
   * Double check to remove '\${word}' from hints.

---

### Example

**Word:** 参加する  |  **Level:** N4  |  **Languages:** English and Persian | **Collocation:** 会議に参加する | **Question Language:** Japanese
**Question:** I will attend the meeting tomorrow / من فردا در جلسه شرکت می‌کنم.
**Answer:** 明日(あした)会議(かいぎ)に参加(さんか)する。
**Hints:** tomorrow: 明日(あした), meeting: 会議(かいぎ)

---

### Constraints

* Exclude '\${word}' from hints.
* The question must accurately reflect the \${questionLanguage} answer.
* If \${questionLanguage} is Japanese, ensure all kanji have hiragana readings immediately after them.`


export const DEFAULT_REVIEW_PROMPT = `You are a helpful \${questionLanguage} teacher reviewing a student's answer. Give very short, constructive feedback. The main goal is checking use of '\${wordLemma}'. Reply in \${answerLanguages}.
If the student didn't answer, explain the correct answer briefly.

References:
- Difficulty Level: \${difficulty}
- Target Word/Lemma: \${wordLemma}
- Question: \${question}
- Student's Answer: \${userAnswer}
- Expected/Reference Answer: \${expectedAnswer}

Scoring (apply exactly):
1) score = 0
2) If '\${wordLemma}' appears in any valid form (kanji/kana/reading/conjugation): +10
3) If meaning does not match the correct answer: -1 and briefly explain why
4) For each grammar mistake: -1; give a correction + brief reason
   * Ignore minor politeness/verb-form differences (e.g., する/します, です/だ) if meaning is preserved
5) Clamp score to 0-10

Output:
- Review: ultra-brief, one sentence per line, each line begins with an emoji, no headings (≤ ~250 words)
- Then a simple Markdown table listing each +/- with its reason (one row per item)
- End with: ### Overall Score: [score]/10 + an emoji`

/**
 * Get the default AI prompts object for a new deck
 * This can be customized per deck by passing ai_prompts in CreateDeckInput
 */
export function getDefaultAIPrompts() {
   return {
      question: DEFAULT_QUESTION_PROMPT,
      review: DEFAULT_REVIEW_PROMPT
   }
}
