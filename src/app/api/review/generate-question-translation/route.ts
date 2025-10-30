import { getOpenAIClient } from "@/lib/ai/openai-client"
import type { Deck } from "@/lib/types/deck"
import { getLanguageByCode } from "@/lib/constants/languages"

export interface GenerateQuestionTranslationRequest {
  answerSentence: string  // The sentence to translate (from Agent 1)
  deck: Deck              // Full deck data
}

export async function POST(request: Request) {
  try {
    const body: GenerateQuestionTranslationRequest = await request.json()

    const { answerSentence, deck } = body

    // Validate required fields
    if (!deck || !answerSentence) {
      return Response.json(
        { error: "Missing required fields: deck and answerSentence" },
        { status: 400 }
      )
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
      return Response.json(
        { error: "No answer languages provided" },
        { status: 400 }
      )
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

    // Create a streaming response using chat completions
    const stream = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      stream: true,
    })

    // Create a ReadableStream to send chunks to the client
    const readableStream = new ReadableStream({
      async start(controller) {
        try {
          for await (const chunk of stream) {
            // Send the text delta to the client
            const content = chunk.choices[0]?.delta?.content
            if (content) {
              controller.enqueue(new TextEncoder().encode(content))
            }
          }
          controller.close()
        } catch (error) {
          controller.error(error)
        }
      },
    })

    return new Response(readableStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    })
  } catch (error) {
    console.error("Error generating question translation:", error)
    return Response.json(
      { error: "Failed to translate question" },
      { status: 500 }
    )
  }
}
