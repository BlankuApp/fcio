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
    const questionPrompt = deck.ai_prompts.question
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

    // Build the prompt by replacing template variables
    const prompt = questionPrompt
      .replace(/\$\{questionLanguage\}/g, questionLanguage)
      .replace(/\$\{answerLangsArray\}/g, answerLangNames.join(" and "))
      .replace(/\$\{word\}/g, wordLemma)
      .replace(/\$\{collocation\}/g, collocation || '')
      .replace(/\$\{difficulty\}/g, difficulty)

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
