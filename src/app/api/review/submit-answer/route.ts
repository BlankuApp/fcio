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
    });

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
    console.error("Error reviewing answer:", error)
    return Response.json(
      { error: "Failed to review answer" },
      { status: 500 }
    )
  }
}
