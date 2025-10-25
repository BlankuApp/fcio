import { getOpenAIClient } from "@/lib/ai/openai-client"

export interface SubmitAnswerRequest {
  question: string
  userAnswer: string
  expectedAnswer?: string
  difficulty: string
  wordLemma: string
}

export async function POST(request: Request) {
  try {
    const body: SubmitAnswerRequest = await request.json()

    const { question, userAnswer, expectedAnswer, difficulty, wordLemma } = body

    // Validate required fields
    if (!question || !userAnswer || !wordLemma) {
      return Response.json(
        {
          error: "Missing required fields: question, userAnswer, and wordLemma",
        },
        { status: 400 }
      )
    }

    // Get OpenAI client
    const openai = getOpenAIClient()

    // Build the prompt for AI review
    const prompt = `You are a helpful Japanese teacher reviewing a student's answer. Give very short, constructive feedback. The main goal is checking use of '{self.word}'. Reply in {" and ".join(target_languages[:2])}.
If the student didn't answer, explain the correct answer briefly.

References:
- Difficulty Level: ${difficulty}
- Target Word/Lemma: ${wordLemma}
- Question: ${question}
- Student's Answer: ${userAnswer}
- Expected/Reference Answer: ${expectedAnswer}

Scoring (apply exactly):
1) score = 0
2) If '{self.word}' appears in any valid form (kanji/kana/reading/conjugation): +10
3) If meaning does not match the correct answer: -1 and briefly explain why
4) For each grammar mistake: -1; give a correction + brief reason
   * Ignore minor politeness/verb-form differences (e.g., する/します, です/だ) if meaning is preserved
5) Clamp score to 0-10

Output:
- Review: ultra-brief, one sentence per line, each line begins with an emoji, no headings (≤ ~250 words)
- Then a simple Markdown table listing each +/- with its reason (one row per item)
- End with: ### Overall Score: [score]/10 + an emoji`

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
