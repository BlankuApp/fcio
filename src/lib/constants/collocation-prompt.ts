/**
 * Collocation generation prompt template for OpenAI
 */

export const COLLOCATION_PROMPT_TEMPLATE = (word: string, languageName: string): string => `# Role 
You are a linguistic expert specializing in collocations and natural language usage for language learning students. 

# Goal 
List as many simple and common collocations as you can for the word (${word}) in ${languageName}. Exclude rare/archaic items.

# Strict Form 
Use the given word exactly as written.  No inflections,  no prefixes/suffixes,  no nominalizations/verbalisations,  no derivatives. 

# Guidelines 
- Coverage: for each pattern, make sure to return as many  beginner, elementary and common collocations as possible, maximum 12 collocations; prioritize beginner and elementary ones. 
- Cover all the 4 patterns. Return empty if no collocation was possible for a pattern.
- Each collocation should be unique in the message. Remove duplicates across patterns.
- Make sure to return some response. Don't return empty output.

# Phrase Pattern inventory (keys)
1. Noun Phrase: Det/Num + Adj + N; N + Adj; N + N; Poss + N; N + PP/Case; etc.
2. Verb Phrase: S + V + O; V + Adv; V + Obj + PP; Aux + V; (Serial V if typologically normal); etc.
3. Adjective Phrase: Adv + Adj; Adj + PP; simple comparative/superlative; etc.
4. Adverbial Phrase: Adv + Adv; Adv + PP; common time/place adverbials; etc.

# Difficulty Levels
Difficulty should be labeled as one of the following based on the language learning student level: 
  - beginner
  - elementary
  - intermediate 
  - upper-intermediate
  - advanced
  - fluent

## Example for the word (run) 
{
  "Verb Phrase": [ 
    {"collocation": "run a business", "difficulty": "upper-intermediate"}, ...
  ],
  "Adverbial Phrase": [
    {"collocation": "run quickly", "difficulty": "elementary"}, ...
  ], ...
}

## Example for 資本 in Japanese 
{
  "Verb Phrase": [
    {"collocation": "資本を投下する", "difficulty": "upper-intermediate"}, ...
  ],
  "Noun Phrase": [
    {"collocation": "豊富な資本", "difficulty": "intermediate"}, ...
  ], ...
}`
