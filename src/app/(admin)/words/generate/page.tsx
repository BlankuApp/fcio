"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { DownloadCloud } from "lucide-react"
import { useState } from "react"
import { LANGUAGES, getLanguageDisplayName } from "@/lib/constants/languages"

export default function GenerateWordsPage() {
    const [wordList, setWordList] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("en")
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewContent, setPreviewContent] = useState<string>("")

    const handleGeneratePreview = () => {
        try {
            const words = wordList
                .split("\n")
                .map((w) => w.trim())
                .filter((w) => w.length > 0)

            if (words.length === 0) {
                setPreviewContent("")
                return
            }

            const jsonlContent = words
                .map((word) => {
                    const selectedLanguage = LANGUAGES.find(lang => lang.code === targetLanguage)
                    const languageName = selectedLanguage ? selectedLanguage.name : targetLanguage

                    const prompt = {
                        input: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "input_text",
                                        text: `# Role 
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
  - native

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
}`,
                                    },
                                ],
                            },
                        ],
                    }

                    const request = {
                        custom_id: word,
                        method: "POST",
                        url: "/v1/responses",
                        body: {
                            model: "gpt-5",
                            ...prompt,
                            text: {
                                format: {
                                    type: "json_schema",
                                    name: "collocation_patterns",
                                    strict: false,
                                    schema: {
                                        type: "object",
                                        patternProperties: {
                                            "^(Verb Phrase|Noun Phrase|Adverbial Phrase|Adjective Phrase)$": {
                                                type: "array",
                                                items: {
                                                    type: "object",
                                                    properties: {
                                                        collocation: {
                                                            type: "string",
                                                            maxLength: 50
                                                        },
                                                        difficulty: {
                                                            type: "string",
                                                            enum: [
                                                                "beginner",
                                                                "elementary",
                                                                "intermediate",
                                                                "upper-intermediate",
                                                                "advanced",
                                                                "fluent"
                                                            ]
                                                        }
                                                    },
                                                    required: [
                                                        "collocation",
                                                        "difficulty"
                                                    ],
                                                    additionalProperties: false
                                                }
                                            }
                                        },
                                        additionalProperties: false,
                                        properties: {},
                                        required: []
                                    }
                                },
                                verbosity: "high",
                            },
                            reasoning: { effort: "minimal", summary: null },
                            tools: [],
                            store: false,
                            include: [
                                "reasoning.encrypted_content",
                                "web_search_call.action.sources"
                            ]
                        },
                    }

                    return JSON.stringify(request)
                })
                .join("\n")

            setPreviewContent(jsonlContent)
        } catch (error) {
            console.error("Error generating preview:", error)
            alert("Error generating preview")
        }
    }

    const handleGenerateJsonl = () => {
        setIsGenerating(true)
        try {
            if (!previewContent) {
                alert("Please generate a preview first")
                return
            }

            const blob = new Blob([previewContent], { type: "application/jsonl" })
            const url = URL.createObjectURL(blob)
            const link = document.createElement("a")
            link.href = url
            link.download = `batch_words_${Date.now()}.jsonl`
            document.body.appendChild(link)
            link.click()
            document.body.removeChild(link)
            URL.revokeObjectURL(url)

            const lineCount = previewContent.split("\n").filter((line) => line.trim()).length
            alert(`Generated JSONL file with ${lineCount} words`)
        } catch (error) {
            console.error("Error generating JSONL:", error)
            alert("Error generating JSONL file")
        } finally {
            setIsGenerating(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-3 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <DownloadCloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Generate Batch JSONL</h1>
                    <p className="text-muted-foreground">
                        Create JSONL files for OpenAI batch processing
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <h2 className="text-xl font-semibold mb-4">Generate Batch JSONL File</h2>
                    <p className="text-sm text-muted-foreground mb-6">
                        Enter words (one per line) to generate a JSONL file for OpenAI batch processing
                    </p>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="target-language">Target Language</Label>
                    <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                        <SelectTrigger id="target-language">
                            <SelectValue placeholder="Select a language" />
                        </SelectTrigger>
                        <SelectContent>
                            {LANGUAGES.map((language) => (
                                <SelectItem key={language.code} value={language.code}>
                                    {getLanguageDisplayName(language)}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="word-list">Word List (one per line)</Label>
                    <Textarea
                        id="word-list"
                        value={wordList}
                        onChange={(e) => {
                            setWordList(e.target.value)
                            setPreviewContent("")
                        }}
                        placeholder="run&#10;beautiful&#10;quick&#10;decide&#10;analysis"
                        rows={10}
                        className="font-mono"
                    />
                    <p className="text-sm text-muted-foreground">
                        {wordList.split("\n").filter((w) => w.trim()).length} words entered
                    </p>
                </div>

                <Button
                    onClick={handleGeneratePreview}
                    disabled={!wordList.trim()}
                    variant="outline"
                    className="w-full sm:w-auto"
                >
                    Generate Preview
                </Button>

                {previewContent && (
                    <div className="space-y-4">
                        <Separator />
                        <div>
                            <h3 className="text-lg font-semibold mb-2">Preview</h3>
                            <div className="space-y-2">
                                <p className="text-sm text-muted-foreground">
                                    {previewContent.split("\n").filter((line) => line.trim()).length} entries
                                </p>
                                <div className="max-h-96 overflow-auto border rounded-lg p-4 bg-muted/50">
                                    <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                        {previewContent}
                                    </pre>
                                </div>
                            </div>
                        </div>

                        <Button
                            onClick={handleGenerateJsonl}
                            disabled={isGenerating}
                            className="w-full sm:w-auto"
                        >
                            <DownloadCloud className="w-4 h-4 mr-2" />
                            {isGenerating ? "Downloading..." : "Download JSONL"}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
