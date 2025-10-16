"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, FileJson } from "lucide-react"
import { useState } from "react"
import { LANGUAGES, getLanguageDisplayName } from "@/lib/constants/languages"
import { bulkUpsertWords, checkExistingWords } from "@/lib/words/client-utils"
import type { Word } from "@/lib/words"

interface ParsedResult {
    word: string
    tokens: number
    output: string
    collocations: Record<string, Array<{ collocation: string, difficulty: string }>>
    existingWord?: Word
}

interface ParsedResultError {
    error: string
    raw: string
}

type ParsedResultType = ParsedResult | ParsedResultError

export default function BatchWordsPage() {
    // JSONL Generation State
    const [wordList, setWordList] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("en") // Default to English code
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewContent, setPreviewContent] = useState<string>("")

    // Result Upload State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadedContent, setUploadedContent] = useState<string>("")
    const [parsedResults, setParsedResults] = useState<ParsedResultType[]>([])
    const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)

    // Generate preview
    const handleGeneratePreview = () => {
        try {
            // Split words by newline and filter empty lines
            const words = wordList
                .split("\n")
                .map((w) => w.trim())
                .filter((w) => w.length > 0)

            if (words.length === 0) {
                setPreviewContent("")
                return
            }

            // Create JSONL content following the Python implementation
            const jsonlContent = words
                .map((word) => {
                    // Get the selected language name
                    const selectedLanguage = LANGUAGES.find(lang => lang.code === targetLanguage)
                    const languageName = selectedLanguage ? selectedLanguage.name : targetLanguage
                    // Build the prompt structure
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

                    // Build the batch request
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

    // Generate JSONL file
    const handleGenerateJsonl = () => {
        setIsGenerating(true)
        try {
            if (!previewContent) {
                alert("Please generate a preview first")
                return
            }

            // Create blob and download
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

    // Handle result selection
    const handleResultSelection = (index: number, checked: boolean) => {
        const newSelected = new Set(selectedResults)
        if (checked) {
            newSelected.add(index)
        } else {
            newSelected.delete(index)
        }
        setSelectedResults(newSelected)
    }

    // Selection helper functions
    const handleSelectAll = () => {
        const allValidIndices = new Set<number>()
        parsedResults.forEach((result, index) => {
            if (!("error" in result)) {
                allValidIndices.add(index)
            }
        })
        setSelectedResults(allValidIndices)
    }

    const handleDeselectAll = () => {
        setSelectedResults(new Set())
    }

    const handleInvertSelection = () => {
        const inverted = new Set<number>()
        parsedResults.forEach((result, index) => {
            if (!("error" in result)) {
                if (!selectedResults.has(index)) {
                    inverted.add(index)
                }
            }
        })
        setSelectedResults(inverted)
    }

    const handleSelectOnlyNewWords = () => {
        const onlyNew = new Set<number>()
        parsedResults.forEach((result, index) => {
            if (!("error" in result) && !result.existingWord) {
                onlyNew.add(index)
            }
        })
        setSelectedResults(onlyNew)
    }

    const handleSelectOnlyExisting = () => {
        const onlyExisting = new Set<number>()
        parsedResults.forEach((result, index) => {
            if (!("error" in result) && result.existingWord) {
                onlyExisting.add(index)
            }
        })
        setSelectedResults(onlyExisting)
    }

    // Handle post-processing of selected results
    const handlePostProcess = async () => {
        setIsProcessing(true)
        try {
            const selectedData = Array.from(selectedResults).map(
                (index) => parsedResults[index] as ParsedResult
            )

            if (selectedData.length === 0) {
                alert("No valid results selected")
                return
            }

            // Transform selected results to CreateWordInput format
            const wordsToInsert = selectedData.map((result) => ({
                lemma: result.word,
                lang: targetLanguage,
                collocations: result.collocations,
            }))

            // Bulk upsert into database (inserts new, updates existing)
            const processedWords = await bulkUpsertWords(wordsToInsert)

            alert(
                `Successfully processed ${processedWords.length} words (inserted/updated)!`
            )

            // Clear state after successful insertion
            setSelectedResults(new Set())
            setParsedResults([])
            setUploadedFile(null)
            setUploadedContent("")
        } catch (error) {
            console.error("Error adding words to database:", error)
            alert(
                `Error adding words: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        } finally {
            setIsProcessing(false)
        }
    }

    // Handle file upload
    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return

        setUploadedFile(file)

        try {
            const text = await file.text()
            setUploadedContent(text)

            // Try to parse JSONL
            const lines = text.split("\n").filter((line) => line.trim())
            const parsed = lines.map((line: string, index: number) => {
                try {
                    const raw_data = JSON.parse(line);
                    const content = JSON.parse(raw_data.response.body.output[1].content[0].text);
                    const processed_data: ParsedResult = {
                        word: raw_data.custom_id,
                        tokens: raw_data.response.body.usage.total_tokens,
                        output: raw_data.response.body.output[1].content[0].text,
                        collocations: content // Add the parsed JSON object
                    }
                    return processed_data
                } catch (err) {
                    const error_message: ParsedResultError = {
                        error: `Line ${index + 1}: Invalid JSON - ${err instanceof Error ? err.message : 'Unknown error'}`,
                        raw: line
                    }
                    return error_message
                }
            })

            // Check for existing words in the database
            const validResults = parsed.filter((r): r is ParsedResult => !("error" in r))
            const existingWordsMap = await checkExistingWords(
                validResults.map((r) => ({ lemma: r.word, lang: targetLanguage }))
            )

            // Attach existing word info to results
            const enrichedParsed = parsed.map((result) => {
                if (!("error" in result)) {
                    const key = `${result.word}|${targetLanguage}`
                    const existingWord = existingWordsMap.get(key)
                    if (existingWord) {
                        result.existingWord = existingWord
                    }
                }
                return result
            })

            setParsedResults(enrichedParsed)

            // Initialize selected results - select all valid results by default
            const validIndices = new Set<number>()
            enrichedParsed.forEach((result: ParsedResultType, index: number) => {
                if (!("error" in result)) {
                    validIndices.add(index)
                }
            })
            setSelectedResults(validIndices)
        } catch (error) {
            console.error("Error reading file:", error)
            alert("Error reading file")
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <FileJson className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Batch Word Processing</h1>
                        <p className="text-muted-foreground">
                            Generate JSONL files for OpenAI batch processing and upload results
                        </p>
                    </div>
                </div>
            </div>

            <Tabs defaultValue="generate" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                    <TabsTrigger value="generate">
                        <Download className="w-4 h-4 mr-2" />
                        Generate JSONL
                    </TabsTrigger>
                    <TabsTrigger value="upload">
                        <Upload className="w-4 h-4 mr-2" />
                        Upload Results
                    </TabsTrigger>
                </TabsList>

                {/* Tab 1: Generate JSONL */}
                <TabsContent value="generate">
                    <Card>
                        <CardHeader>
                            <CardTitle>Generate Batch JSONL File</CardTitle>
                            <CardDescription>
                                Enter words (one per line) to generate a JSONL file for OpenAI batch processing
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
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
                                        // Clear preview when word list changes
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
                                        <Download className="w-4 h-4 mr-2" />
                                        {isGenerating ? "Downloading..." : "Download JSONL"}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Tab 2: Upload Results */}
                <TabsContent value="upload">
                    <Card>
                        <CardHeader>
                            <CardTitle>Upload Batch Results</CardTitle>
                            <CardDescription>
                                Upload the processed JSONL file from OpenAI to view and post-process results
                            </CardDescription>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="file-upload">Select JSONL File</Label>
                                <Input
                                    id="file-upload"
                                    type="file"
                                    accept=".jsonl,.json"
                                    onChange={handleFileUpload}
                                />
                                {uploadedFile && (
                                    <p className="text-sm text-muted-foreground">
                                        Uploaded: {uploadedFile.name} ({(uploadedFile.size / 1024).toFixed(2)} KB)
                                    </p>
                                )}
                            </div>

                            {uploadedContent && (
                                <div className="space-y-4">
                                    <Separator />
                                    <div>
                                        <h3 className="text-lg font-semibold mb-2">Parsed Results</h3>
                                        {parsedResults.map((result, index) => (
                                            <Card key={index} className="mb-2">
                                                {"error" in result ? (
                                                    <CardContent className="pt-4">
                                                        <div className="text-red-500">
                                                            <p className="font-semibold">{result.error}</p>
                                                            <p className="text-xs font-mono mt-1">{result.raw}</p>
                                                        </div>
                                                    </CardContent>
                                                ) : (
                                                    <>
                                                        <CardHeader className="pb-2">
                                                            <div className="flex items-center space-x-2">
                                                                <Checkbox
                                                                    id={`result-${index}`}
                                                                    checked={selectedResults.has(index)}
                                                                    onCheckedChange={(checked) => handleResultSelection(index, checked as boolean)}
                                                                />
                                                                <label
                                                                    htmlFor={`result-${index}`}
                                                                    className="text-lg font-light cursor-pointer flex-1"
                                                                >
                                                                    {result.word} ({result.tokens} tokens)
                                                                </label>
                                                                {result.existingWord && (
                                                                    <span className="px-2 py-1 rounded text-xs font-medium bg-amber-100 text-amber-800">
                                                                        ⚠️ Existing
                                                                    </span>
                                                                )}
                                                            </div>
                                                        </CardHeader>
                                                        <CardContent className="pt-0">
                                                            {/* Show existing word comparison if word already exists */}
                                                            {result.existingWord && (
                                                                <div className="mb-4 p-3 bg-amber-50 border border-amber-200 rounded">
                                                                    <p className="text-sm font-semibold text-amber-900 mb-2">Existing word found - will update:</p>
                                                                    <div className="space-y-2 text-sm">
                                                                        <div>
                                                                            <p className="text-xs text-amber-700 uppercase tracking-wide font-medium mb-1">Current collocations:</p>
                                                                            <div className="space-y-2">
                                                                                {Object.entries(result.existingWord.collocations).map(([pattern, collocations]) => (
                                                                                    <div key={pattern}>
                                                                                        <p className="text-xs font-semibold text-muted-foreground">{pattern}</p>
                                                                                        <div className="flex flex-row flex-wrap gap-1">
                                                                                            {(collocations as Array<{ collocation: string; difficulty: string }>).map((col, idx) => (
                                                                                                <span key={idx} className="px-1.5 py-0.5 bg-amber-100 text-amber-900 rounded text-xs">
                                                                                                    {col.collocation}
                                                                                                </span>
                                                                                            ))}
                                                                                        </div>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    </div>
                                                                </div>
                                                            )}

                                                            {/* Show new collocations */}
                                                            <div>
                                                                <p className="text-sm font-semibold text-muted-foreground mb-2">
                                                                    {result.existingWord ? "New collocations to merge:" : "Collocations:"}
                                                                </p>
                                                                <div className="space-y-4">
                                                                    {Object.entries(result.collocations).map(([pattern, collocations]) => (
                                                                        <div key={pattern}>
                                                                            <h4 className="font-semibold text-sm text-muted-foreground uppercase tracking-wide mb-2">
                                                                                {pattern}
                                                                            </h4>
                                                                            <div className="flex flex-row flex-wrap">
                                                                                {collocations.map((col, idx) => (
                                                                                    <div key={idx} className="flex items-center justify-between py-1 px-2 bg-muted/30 rounded text-sm">
                                                                                        <span className="font-medium">{col.collocation}</span>
                                                                                        <span className={`px-2 py-0.5 rounded text-xs font-medium ml-2 ${col.difficulty === 'elementary' ? 'bg-green-100 text-green-800' :
                                                                                            col.difficulty === 'intermediate' ? 'bg-blue-100 text-blue-800' :
                                                                                                col.difficulty === 'upper-intermediate' ? 'bg-yellow-100 text-yellow-800' :
                                                                                                    col.difficulty === 'advanced' ? 'bg-orange-100 text-orange-800' :
                                                                                                        'bg-red-100 text-red-800'
                                                                                            }`}>
                                                                                            {col.difficulty}
                                                                                        </span>
                                                                                    </div>
                                                                                ))}
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            </div>
                                                        </CardContent>
                                                    </>
                                                )}
                                            </Card>
                                        ))}
                                    </div>

                                    <Separator className="my-4" />

                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm font-medium text-muted-foreground">Quick selection tools:</p>
                                        <div className="grid grid-cols-2 gap-2 sm:grid-cols-5">
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectAll}
                                                className="text-xs"
                                            >
                                                Select All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleDeselectAll}
                                                className="text-xs"
                                            >
                                                Deselect All
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleInvertSelection}
                                                className="text-xs"
                                            >
                                                Invert
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectOnlyNewWords}
                                                className="text-xs"
                                            >
                                                New Only
                                            </Button>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={handleSelectOnlyExisting}
                                                className="text-xs"
                                            >
                                                Existing Only
                                            </Button>
                                        </div>
                                    </div>

                                    <Separator className="my-4" />

                                    <Button
                                        variant="outline"
                                        className="w-full sm:w-auto"
                                        onClick={handlePostProcess}
                                        disabled={selectedResults.size === 0 || isProcessing}
                                    >
                                        {isProcessing ? "Adding to database..." : `Add to database (${selectedResults.size} selected)`}
                                    </Button>
                                </div>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>
        </div>
    )
}
