import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"
import { getLanguageByCode } from "@/lib/constants/languages"

export interface GenerateQuestionRequest {
  collocation?: string
  deck: Deck          // Full deck data
  word: Word          // Full word data
}

export interface QuestionResponse {
  question: string
  answer: string
  hints: string[]
}

const questionSchema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      description: "The question for the user to answer",
    },
    answer: {
      type: "string",
      description: "The expected answer to the question",
    },
    hints: {
      type: "array",
      items: {
        type: "string",
      },
      description: "A list of helpful hints for answering the question",
    },
  },
  required: ["question", "answer", "hints"],
  additionalProperties: false,
}

export async function POST(request: Request) {
  try {
    const body: GenerateQuestionRequest = await request.json()

    const { collocation, deck, word } = body

    // Validate required fields
    if (!deck || !word) {
      throw new Error("Missing required fields: deck and word")
    }

    // Extract values from deck and word
    const difficulty = deck.diff_level
    const questionLanguage = getLanguageByCode(deck.que_lang)?.name || deck.que_lang
    const answerLanguages = deck.ans_langs
    const questionPrompt = deck.ai_prompts?.question
    const wordLemma = word.lemma

    // Ensure answerLanguages is an array
    const answerLangsArray = Array.isArray(answerLanguages)
      ? answerLanguages
      : typeof answerLanguages === "string"
        ? [answerLanguages]
        : []

    if (answerLangsArray.length === 0) {
      throw new Error("No answer languages provided")
    }

    // Convert language codes to names
    const answerLangNames = answerLangsArray
      .map((langCode) => getLanguageByCode(langCode)?.name)
      .filter((name): name is string => name !== undefined)
    // Get OpenAI client
    const openai = getOpenAIClient()

    // Build the prompt - use custom prompt if provided, otherwise use default
    let prompt: string

    if (questionPrompt) {
      // Use custom prompt and replace template variables
      prompt = questionPrompt
        .replace(/\$\{questionLanguage\}/g, questionLanguage)
        .replace(/\$\{answerLangsArray\}/g, answerLangNames.join(" and "))
        .replace(/\$\{word\}/g, wordLemma)
        .replace(/\$\{collocation\}/g, collocation || '')
        .replace(/\$\{difficulty\}/g, difficulty)
    } else {
      // Default prompt
      prompt = `
You are a helpful assistant that creates ${questionLanguage} language flashcard questions.

**Question:** Translation of the ${questionLanguage} sentence in ${answerLangNames}.
**Answer:** ${questionLanguage} sentence containing the word '${wordLemma}' with the collocation '${collocation}'.
**Hints:** Translations and readings of other words (excluding the target word), separated by commas.

---

### Steps

1. **Create a Sentence as Answer**

   * Generate a short, natural daily-life sentence at ${difficulty} level using '${wordLemma}'.
   * You may refer to '${collocation}' for context, but do **not** copy it directly.
   * Use only ${difficulty}-appropriate vocabulary besides '${wordLemma}'.
   * Consider this as the 'Answer' field in the output.

2. **Translate and Verify as Question**

   * Provide an accurate, literal translation of the generated 'Answer' in ${answerLangNames}.
   * Consider the translation as the 'Question' field in the output.

3. **Hints**

   * Except '${wordLemma}', include translations and readings of the other words in the generated 'Answer'.
   * Separate hints with commas only.
   * Format kanji with readings: e.g., 参加(さんか)する, 賢(かしこ)い.
   * Double check to remove '${wordLemma}' from hints.

---

### Example

**Word:** 参加する  |  **Level:** N4  |  **Languages:** English and Persian | **Collocation:** 会議に参加する | **Question Language:** Japanese
**Question:** I will attend the meeting tomorrow / من فردا در جلسه شرکت می‌کنم.
**Answer:** 明日(あした)会議(かいぎ)に参加(さんか)する。
**Hints:** tomorrow: 明日(あした), meeting: 会議(かいぎ)

---

### Constraints

* Exclude '${wordLemma}' from hints.
* The question must accurately reflect the ${questionLanguage} answer.
* If ${questionLanguage} is Japanese, ensure all kanji have hiragana readings immediately after them.
`
    }

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          role: "user",
          content: [
            {
              "type": "input_text",
              "text": prompt,
            }
          ],
        },
      ],
      text: {
        format: {
          type: "json_schema",
          name: "question_response",
          strict: false,
          schema: questionSchema
        },
        "verbosity": "high"
      },
      reasoning: {
        "effort": "minimal",
        "summary": null
      },
    })

    // Extract the JSON from the response
    const content = response.output_text

    const parsedResponse = JSON.parse(content) as QuestionResponse

    return Response.json(parsedResponse)
  } catch (error) {
    console.error("Error generating question:", error)
    return Response.json(
      { error: "Failed to generate question" },
      { status: 500 }
    )
  }
}
