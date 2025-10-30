import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"
import { getLanguageByCode } from "@/lib/constants/languages"

export interface GenerateAnswerRequest {
  collocation?: string
  deck: Deck          // Full deck data
  word: Word          // Full word data
}

export interface AnswerResponse {
  answer: string      // The generated sentence in the target language
}

const answerSchema = {
  type: "object",
  properties: {
    answer: {
      type: "string",
      description: "A natural sentence in the target language using the specified word",
    },
  },
  required: ["answer"],
  additionalProperties: false,
}

export async function POST(request: Request) {
  try {
    const body: GenerateAnswerRequest = await request.json()

    const { collocation, deck, word } = body

    // Validate required fields
    if (!deck || !word) {
      throw new Error("Missing required fields: deck and word")
    }

    // Extract values from deck and word
    const difficulty = deck.diff_level
    const questionLanguage = getLanguageByCode(deck.que_lang)?.name || deck.que_lang
    // Fallback to default prompt if not found (for backward compatibility with old decks)
    const answerPrompt = deck.ai_prompts?.answerGeneration
    const wordLemma = word.lemma

    // Get OpenAI client
    const openai = getOpenAIClient()

    // Build the prompt by replacing template variables
    const prompt = answerPrompt
      .replace(/\$\{questionLanguage\}/g, questionLanguage)
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
          name: "answer_response",
          strict: false,
          schema: answerSchema
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

    const parsedResponse = JSON.parse(content) as AnswerResponse

    return Response.json(parsedResponse)
  } catch (error) {
    console.error("Error generating answer:", error)
    return Response.json(
      { error: "Failed to generate answer sentence" },
      { status: 500 }
    )
  }
}
