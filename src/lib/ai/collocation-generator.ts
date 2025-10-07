import { getOpenAIClient } from "./openai-client";
import { PromptMessage } from "../constants/default-prompts";
import { getPromptDefinition } from "../constants/default-prompts";

export async function generateCollocations(
  word: string,
  lang: string
): Promise<string> {
  const openai = getOpenAIClient();

  const promptDefinition = getPromptDefinition("raw_collocation_generation", {
    word,
    lang,
  });

  const response = await openai.responses.create({
    model: "gpt-4o-mini",
    input: promptDefinition,
    text: {
      format: {
        type: "text",
      },
    },
    reasoning: {},
    tools: [],
  });

  return response.output_text;
}
