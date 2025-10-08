"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { Download, Upload, FileJson } from "lucide-react"
import { useState } from "react"

interface ParsedResult {
    word: string
    tokens: number
    output: string
}

interface ParsedResultError {
    error: string
    raw: string
}

type ParsedResultType = ParsedResult | ParsedResultError

export default function BatchWordsPage() {
    // JSONL Generation State
    const [wordList, setWordList] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("English")
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewContent, setPreviewContent] = useState<string>("")

    // Result Upload State
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadedContent, setUploadedContent] = useState<string>("")
    const [parsedResults, setParsedResults] = useState<ParsedResultType[]>([])

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
                    // Build the prompt structure
                    const prompt = {
                        input: [
                            {
                                role: "user",
                                content: [
                                    {
                                        type: "input_text",
                                        text: `Goal
List common collocations for the word (${word}) in ${targetLanguage}. Exclude rare/archaic items. Output JSON only.

Strict Form
Use the word (${word}) exactly as written.  No inflections,  no prefixes/suffixes,  no nominalizations/verbalisations,  no derivatives.

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
                    }

                    // Build the batch request
                    const request = {
                        custom_id: word,
                        method: "POST",
                        url: "/v1/responses",
                        body: {
                            model: "gpt-4o-mini",
                            ...prompt,
                            text: { format: { type: "json_object" } },
                            reasoning: {},
                            tools: [],
                            temperature: 1.5,
                            store: false,
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
            const parsed = lines.map((line, index) => {
                try {
                    const raw_data = JSON.parse(line);
                    const processed_data: ParsedResult = {
                        word: raw_data.custom_id,
                        tokens: raw_data.response.body.usage.total_tokens,
                        output: raw_data.response.body.output[0].content[0].text
                    }
                    return processed_data
                } catch (err) {
                    const error_message: ParsedResultError = {
                        error: `Line ${index + 1}: Invalid JSON`,
                        raw: line
                    }
                    return error_message
                }
            })

            setParsedResults(parsed)
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
                                <Input
                                    id="target-language"
                                    value={targetLanguage}
                                    onChange={(e) => setTargetLanguage(e.target.value)}
                                    placeholder="e.g., English, Japanese, Persian"
                                />
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
                                                        <CardTitle className="text-lg font-light pl-4 pt-4">
                                                            {result.word} ({result.tokens} tokens)
                                                        </CardTitle>
                                                        <CardContent className="pt-4">
                                                            <pre className="text-xs font-mono whitespace-pre-wrap break-words">
                                                                {result.output}
                                                            </pre>
                                                        </CardContent>
                                                    </>
                                                )}
                                            </Card>
                                        ))}
                                    </div>

                                    <Button variant="outline" className="w-full sm:w-auto" disabled>
                                        Post-Process Results (Coming Soon)
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
