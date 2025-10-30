import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"
import { getLanguageByCode } from "@/lib/constants/languages"
import { DEFAULT_HINTS_GENERATION_PROMPT } from "@/lib/constants/ai-prompts"

export interface GenerateHintsRequest {
  answerSentence: string  // The sentence to generate hints for (from Agent 1)
  deck: Deck              // Full deck data
  word: Word              // Full word data
}

export interface HintsResponse {
  hints: string[]         // Array of helpful hints
}

const hintsSchema = {
  type: "object",
  properties: {
    hints: {
      type: "array",
      items: {
        type: "string",
      },
      description: "A list of helpful hints for words in the sentence (excluding the target word)",
    },
  },
  required: ["hints"],
  additionalProperties: false,
}

export async function POST(request: Request) {
  try {
    const body: GenerateHintsRequest = await request.json()

    const { answerSentence, deck, word } = body

    // Validate required fields
    if (!deck || !word || !answerSentence) {
      throw new Error("Missing required fields: deck, word, and answerSentence")
    }

    // Extract values from deck and word
    const questionLanguage = getLanguageByCode(deck.que_lang)?.name || deck.que_lang
    const answerLanguages = deck.ans_langs
    // Fallback to default prompt if not found (for backward compatibility with old decks)
    const hintsPrompt = deck.ai_prompts?.hintsGeneration || DEFAULT_HINTS_GENERATION_PROMPT
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
    const prompt = hintsPrompt
      .replace(/\$\{questionLanguage\}/g, questionLanguage)
      .replace(/\$\{answerLangsArray\}/g, answerLangNames.join(" and "))
      .replace(/\$\{answerSentence\}/g, answerSentence)
      .replace(/\$\{word\}/g, wordLemma)

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
          name: "hints_response",
          strict: false,
          schema: hintsSchema
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

    const parsedResponse = JSON.parse(content) as HintsResponse

    return Response.json(parsedResponse)
  } catch (error) {
    console.error("Error generating hints:", error)
    return Response.json(
      { error: "Failed to generate hints" },
      { status: 500 }
    )
  }
}
