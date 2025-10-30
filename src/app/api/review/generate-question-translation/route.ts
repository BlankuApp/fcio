import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import { getLanguageByCode } from "@/lib/constants/languages"

export interface GenerateQuestionTranslationRequest {
  answerSentence: string  // The sentence to translate (from Agent 1)
  deck: Deck              // Full deck data
}

export interface QuestionTranslationResponse {
  question: string        // The translated question in the student's language(s)
}

const questionTranslationSchema = {
  type: "object",
  properties: {
    question: {
      type: "string",
      description: "The translation of the answer sentence into the student's native language(s)",
    },
  },
  required: ["question"],
  additionalProperties: false,
}

export async function POST(request: Request) {
  try {
    const body: GenerateQuestionTranslationRequest = await request.json()

    const { answerSentence, deck } = body

    // Validate required fields
    if (!deck || !answerSentence) {
      throw new Error("Missing required fields: deck and answerSentence")
    }

    // Extract values from deck
    const questionLanguage = getLanguageByCode(deck.que_lang)?.name || deck.que_lang
    const answerLanguages = deck.ans_langs
    const questionTranslationPrompt = deck.ai_prompts?.questionTranslation

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
    const prompt = questionTranslationPrompt
      .replace(/\$\{questionLanguage\}/g, questionLanguage)
      .replace(/\$\{answerLangsArray\}/g, answerLangNames.join(" and "))
      .replace(/\$\{answerSentence\}/g, answerSentence)

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
          name: "question_translation_response",
          strict: false,
          schema: questionTranslationSchema
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

    const parsedResponse = JSON.parse(content) as QuestionTranslationResponse

    return Response.json(parsedResponse)
  } catch (error) {
    console.error("Error generating question translation:", error)
    return Response.json(
      { error: "Failed to translate question" },
      { status: 500 }
    )
  }
}
