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
      role: "system",
      content: [
        {
          type: "input_text",
          text: `List all the common and useful collocations of the given word that are used in daily conversations or ordinary writings. Avoid rare or archaic ones.

STEP 1 — Detect POS Automatically
* Detect only the lemma of '{{word}}'.
    * Example: If input is running, lemma = run.
    * Example: If input is beautiful, lemma = beautiful (no derived forms such as beauty or beautify).
* Identify the most common parts of speeches that this lemma can serve as (e.g., noun, verb, adjective).
* Do not generate or reference derived or inflected words (no prefixes/suffixes).
* Work strictly with the canonical lemma, preserving its direct syntactic roles.

STEP 2 — Generate Patterns (Conditional by POS)
For each detected POS, follow the corresponding rules:

If POS = NOUN:
Include patterns:
  - ADJ + NOUN (strong tea)
  - VERB + NOUN (make progress)
  - NOUN + PREP + NOUN (increase in demand)
  - PREP + NOUN set phrases (at risk)
Include idiomatic expressions if common.

If POS = VERB:
Include:
  - ADV + VERB (strongly recommend)
  - VERB + NOUN (raise funds)
  - VERB + PREP + NOUN (apply for a job)
  - VERB + PARTICLE phrasal (set up)
Add alternations or idiomatic verb-preposition pairs if relevant.

If POS = ADJECTIVE:
Include:
  - ADV + ADJ (highly effective)
  - ADJ + NOUN (crucial decision)
  - LINKING VERB + ADJ (seems unlikely)

If POS = ADVERB:
Include:
  - VERB + ADV (react quickly)
  - ADV + ADJ (remarkably accurate)
  - Sentence-level adverbials (Frankly, I disagree).

If POS = PHRASAL_VERB:
Include:
  - Common object patterns (carry out a task)
  - Register and separability notes (set sth up / set up sth).

STEP 3 -- Generate Collocations
* For each pattern provide 4 to 6 common collocations with lemma. Avoid rare or archaic ones, and gather as many as possible.
* Do not generate or reference derived or inflected words (no prefixes/suffixes).
* Work strictly with the canonical lemma, preserving its direct syntactic roles.

Output Format:
* For each collocation, in parentheses indicate the difficulty level of each collocation in 5 levels: elementary, intermediate, upper-intermediate, advanced and native
* Consider the collocation only and avoid extra explanations/translations/examples. report each collocation with bullet point.
* Make sure you categorize the output by pattern.`,
        },
      ],
    },
    {
      role: "user",
      content: [
        {
          type: "input_text",
          text: "The word is '{{word}}' in {{lang}} Language",
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
