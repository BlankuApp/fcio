/**
 * Default AI prompts for user profiles
 * Follows OpenAI chat completion message format
 */

export interface PromptMessage {
  role: "system" | "user" | "assistant";
  content: { type: "input_text"; text: string }[];
}

export type PromptDefinition = PromptMessage[];

export interface DefaultPrompts {
  raw_collocation_generation: PromptDefinition;
}

/**
 * Default prompt templates for AI interactions
 */
export const DEFAULT_PROMPTS: DefaultPrompts = {
  raw_collocation_generation: [
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: `Goal
List common collocations for the WORD ({{word}}) in {{lang}}. Exclude rare/archaic items. Output JSON only.

Strict Form
Use the WORD ({{word}}) exactly as written.  No inflections,  no prefixes/suffixes,  no nominalizations/verbalisations,  no derivatives.

Guidelines
- Coverage: for each applicable pattern, return as many common collocations as possible, up to 10; prioritize frequency and contemporary usage.
- Difficulty:
  - elementary: very frequent, literal, everyday (A1–A2)
  - intermediate: common conversational/written use; mild abstraction (B1)
  - upper-intermediate: less frequent/structure-dependent; some nuance (B2)
  - advanced: idiomatic/register-specific or governed patterns (C1)
  - native: strongly idiomatic/discourse-bound; culturally fixed (C2)
- No extras: no definitions, translations, or examples.
- No duplicates across patterns.

Patterns (use what fits the language; skip invalid ones)
- with verbs
- with nouns
- with adjectives
- with adverbs
- in phrases / idioms
- other pattern

Output (JSON only)
Keys = pattern names; values = lists of {"collocation": string, "difficulty": string}.

Example
{
  "with verbs": [
    {"collocation": "…", "difficulty": "upper-intermediate"}, ...
  ],
  "with adverbs": [
    {"collocation": "…", "difficulty": "advanced"}, ...
  ], ...
}`,
        },
      ],
    },
  ],
};

/**
 * Get default prompts for a new user profile
 */
export function getDefaultPrompts(): DefaultPrompts {
  return JSON.parse(JSON.stringify(DEFAULT_PROMPTS)); // Deep clone to prevent mutations
}

/**
 * Get a specific default prompt definition by key, deep cloned to prevent mutations
 * take placeholders into account
 */
export function getPromptDefinition(
  key: keyof DefaultPrompts,
  placeholders?: Record<string, string>
): PromptDefinition {
  const prompt = DEFAULT_PROMPTS[key];
  if (!prompt) {
    throw new Error(`Prompt definition for key "${key}" not found.`);
  }

  // Replace placeholders with actual values
  if (placeholders) {
    return prompt.map((msg) => {
      const clonedMsg = JSON.parse(JSON.stringify(msg)); // Deep clone
      clonedMsg.content = clonedMsg.content.map((c) => {
        const clonedContent = JSON.parse(JSON.stringify(c));
        clonedContent.text = Object.entries(placeholders).reduce(
          (text, [placeholder, value]) =>
            text.replace(new RegExp(`{{${placeholder}}}`, "g"), value),
          clonedContent.text
        );
        return clonedContent;
      });
      return clonedMsg;
    });
  }

  return prompt;
}
