import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import type { Word } from "@/lib/types/words"
import { getLanguageByCode } from "@/lib/constants/languages"

export interface SubmitAnswerRequest {
  question: string
  userAnswer: string
  expectedAnswer?: string
  deck: Deck          // Full deck data
  word: Word          // Full word data
}

export async function POST(request: Request) {
  try {
    const body: SubmitAnswerRequest = await request.json()

    const { question, userAnswer, expectedAnswer, deck, word } = body

    // Validate required fields
    if (!question || !userAnswer || !deck || !word) {
      return Response.json(
        {
          error: "Missing required fields: question, userAnswer, deck, and word",
        },
        { status: 400 }
      )
    }

    // Get OpenAI client
    const openai = getOpenAIClient()

    // Extract values from deck and word
    const questionLanguage = getLanguageByCode(deck.que_lang)?.name
      || getLanguageByCode(word.lang)?.name
      || "English"

    // Ensure ans_langs is an array
    const answerLangsArray = Array.isArray(deck.ans_langs)
      ? deck.ans_langs
      : typeof deck.ans_langs === "string"
        ? [deck.ans_langs]
        : []

    if (answerLangsArray.length === 0) {
      return Response.json(
        { error: "No answer languages provided in deck" },
        { status: 400 }
      )
    }

    const target_languages = answerLangsArray
      .map((langCode) => getLanguageByCode(langCode)?.name)
      .filter((name): name is string => name !== undefined)
    const answerLanguages = target_languages.join(" and ");
    const difficulty = deck.diff_level;
    const wordLemma = word.lemma
    const reviewPrompt = deck.ai_prompts.review

    // Build the prompt by replacing template variables
    const prompt = reviewPrompt
      .replace(/\$\{questionLanguage\}/g, questionLanguage)
      .replace(/\$\{answerLanguages\}/g, answerLanguages)
      .replace(/\$\{difficulty\}/g, difficulty)
      .replace(/\$\{wordLemma\}/g, wordLemma)
      .replace(/\$\{question\}/g, question)
      .replace(/\$\{userAnswer\}/g, userAnswer)
      .replace(/\$\{expectedAnswer\}/g, expectedAnswer || '')

    const response = await openai.responses.create({
      model: "gpt-5-mini",
      input: [
        {
          "role": "user",
          "content": [
            {
              "type": "input_text",
              "text": prompt
            }
          ]
        }
      ],
      text: {
        "format": {
          "type": "text"
        },
        "verbosity": "medium"
      },
      reasoning: {
        "effort": "low",
        "summary": null
      },
      tools: [],
      store: false,
      include: [
        "reasoning.encrypted_content",
      ]
    });

    // Extract the JSON from the response
    const content = response.output_text

    return Response.json(content)
  } catch (error) {
    console.error("Error reviewing answer:", error)
    return Response.json(
      { error: "Failed to review answer" },
      { status: 500 }
    )
  }
}
