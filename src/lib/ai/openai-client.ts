import OpenAI from 'openai'

/**
 * Get OpenAI client instance
 * Requires OPENAI_API_KEY environment variable to be set
 */
export function getOpenAIClient(): OpenAI {
    const apiKey = process.env.OPENAI_API_KEY

    if (!apiKey) {
        throw new Error(
            'OPENAI_API_KEY environment variable is not set. Please add it to your .env.local file.'
        )
    }

    return new OpenAI({
        apiKey: apiKey,
    })
}
