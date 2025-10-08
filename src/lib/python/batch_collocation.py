prompt = {
    "input": [
    {
      "role": "user",
      "content": [
        {
          "type": "input_text",
          "text": """Goal
List common collocations for the word ({{word}}) in {{lang}}. Exclude rare/archaic items. Output JSON only.

Strict Form
Use the word ({{word}}) exactly as written.  No inflections,  no prefixes/suffixes,  no nominalizations/verbalisations,  no derivatives.

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
Keys = pattern names; values = lists of {|collocation|: string, |difficulty|: string}.

Example
{
  |with verbs|: [
    {|collocation|: |…|, |difficulty|: |upper-intermediate|}, ...
  ],
  |with adverbs|: [
    {|collocation|: |…|, |difficulty|: |advanced|}, ...
  ], ...
}""",
        },
      ],
    },
  ]
}


words = [
    "表す",
    "勢い",
    "位置",
    "移す",
    "営業",
    "溺れる",
    "解決",
    "火災",
    "我慢",
    "観光",
    "期間",
    "奇妙",
    "教師",
    "金属",
    "苦しい",
    "欠陥",
    "現金",
    "後者",
    "好み",
    "支給",
    "首相",
    "人種",
    "政府",
    "滞在",
    "知恵",
    "通す",
    "縄",
    "拍手",
    "表情",
]

if __name__ == "__main__":
    import json

    with open("batch_collocation_prompt.jsonl", "w", encoding="utf-8") as f:
        for word in words:
            prompt_filled = json.loads(
                json.dumps(prompt)
                .replace("{{word}}", word)
                .replace("{{lang}}", "Japanese")
            )
            f.write(
                '{"custom_id": "'
                + word
                + '", "method": "POST", "url": "/v1/responses", "body": {"model": "gpt-4.1-mini",'
                + str(prompt_filled)[1:-1].replace("'", '"').replace("|", "'")
                + ',"text": {"format":{"type": "json_object"}}, "reasoning": {}, "tools": [], "temperature": 1.5, "store": false}}\n'
            )
