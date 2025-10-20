import { getOpenAIClient } from "@/lib/ai/openai-client"

export interface GenerateQuestionRequest {
  word: string
  collocation?: string
  difficulty: string
  questionLanguage: string
  answerLanguages: string[]
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

    const { word, collocation, difficulty, questionLanguage, answerLanguages } =
      body

    // Ensure answerLanguages is an array
    const answerLangsArray = Array.isArray(answerLanguages)
      ? answerLanguages
      : typeof answerLanguages === "string"
        ? [answerLanguages]
        : []

    if (answerLangsArray.length === 0) {
      throw new Error("No answer languages provided")
    }
    // Get OpenAI client
    const openai = getOpenAIClient()

    // Build the prompt with word, deck, and collocation data
    const prompt = `
You are a helpful assistant that creates ${questionLanguage} language flashcard questions.

**Question:** Translation of the ${questionLanguage} sentence in ${answerLangsArray.join(", ")}.
**Answer:** ${questionLanguage} sentence containing the word '${word}' with the collocation '${collocation}'.
**Hints:** Translations and readings of other words (excluding the target word), separated by commas.

---

### Steps

1. **Create a Sentence as Answer**

   * Generate a short, natural daily-life sentence at ${difficulty} level using '${word}'.
   * You may refer to '${collocation}' for context, but do **not** copy it directly.
   * Use only ${difficulty}-appropriate vocabulary besides '${word}'.
   * Consider this as the 'Answer' field in the output.

2. **Translate and Verify as Question**

   * Provide an accurate, literal translation of the generated 'Answer' in ${answerLangsArray.join(", ")}.
   * Consider the translation as the 'Question' field in the output.

3. **Hints**

   * Except '${word}', include translations and readings of the other words in the generated 'Answer'.
   * Separate hints with commas only.
   * Format kanji with readings: e.g., 参加(さんか)する, 賢(かしこ)い.
   * Double check to remove '${word}' from hints.

---

### Example

**Word:** 参加する  |  **Level:** N4  |  **Languages:** English and Persian | **Collocation:** 会議に参加する | **Question Language:** Japanese
**Question:** I will attend the meeting tomorrow / من فردا در جلسه شرکت می‌کنم.
**Answer:** 明日(あした)会議(かいぎ)に参加(さんか)する。
**Hints:** tomorrow: 明日(あした), meeting: 会議(かいぎ)

---

### Constraints

* Exclude '${word}' from hints.
* The question must accurately reflect the ${questionLanguage} answer.
* If ${questionLanguage} is Japanese, ensure all kanji have hiragana readings immediately after them.
`

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
