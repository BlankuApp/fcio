"use client"

import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import { Textarea } from "@/components/ui/textarea"
import { DownloadCloud } from "lucide-react"
import { useState } from "react"
import { LANGUAGES, getLanguageDisplayName } from "@/lib/constants/languages"
import { generateJsonlContent } from "@/lib/ai/batch-request-builder"
import { downloadAsJsonl, getJsonlLineCount } from "@/lib/utils/file-download"

export default function GenerateWordsPage() {
    const [wordList, setWordList] = useState("")
    const [targetLanguage, setTargetLanguage] = useState("en")
    const [isGenerating, setIsGenerating] = useState(false)
    const [previewContent, setPreviewContent] = useState<string>("")
    const [error, setError] = useState<string>("")

    /**
     * Validates and parses word list
     */
    const parseWords = (text: string): string[] => {
        return text
            .split("\n")
            .map((w) => w.trim())
            .filter((w) => w.length > 0)
    }

    /**
     * Generates preview of JSONL content
     */
    const handleGeneratePreview = () => {
        try {
            setError("")
            const words = parseWords(wordList)

            if (words.length === 0) {
                setError("Please enter at least one word")
                setPreviewContent("")
                return
            }

            if (words.length > 100) {
                setError("Maximum 100 words per batch. Please reduce your list.")
                return
            }

            const selectedLanguage = LANGUAGES.find((lang) => lang.code === targetLanguage)
            const languageName = selectedLanguage ? selectedLanguage.name : targetLanguage

            const jsonlContent = generateJsonlContent(words, languageName)
            setPreviewContent(jsonlContent)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to generate preview"
            setError(message)
            console.error("Error generating preview:", err)
        }
    }

    /**
     * Downloads JSONL file
     */
    const handleGenerateJsonl = () => {
        setIsGenerating(true)
        try {
            setError("")

            if (!previewContent) {
                setError("Please generate a preview first")
                setIsGenerating(false)
                return
            }

            const filename = `batch_words_${Date.now()}.jsonl`
            downloadAsJsonl(previewContent, filename)

            const lineCount = getJsonlLineCount(previewContent)
            console.log(`Generated JSONL file with ${lineCount} words`)
        } catch (err) {
            const message = err instanceof Error ? err.message : "Failed to download file"
            setError(message)
            console.error("Error downloading file:", err)
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

                {error && (
                    <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/30">
                        <p className="text-sm text-destructive">{error}</p>
                    </div>
                )}

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
                                    {getJsonlLineCount(previewContent)} entries
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
