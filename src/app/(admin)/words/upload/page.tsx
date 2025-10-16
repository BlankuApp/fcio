"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Separator } from "@/components/ui/separator"
import { UploadCloud, File, X } from "lucide-react"
import { useState, useRef } from "react"
import { bulkUpsertWords, checkExistingWords } from "@/lib/words/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
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

export default function UploadWordsPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadedContent, setUploadedContent] = useState<string>("")
    const [parsedResults, setParsedResults] = useState<ParsedResultType[]>([])
    const [selectedResults, setSelectedResults] = useState<Set<number>>(new Set())
    const [isProcessing, setIsProcessing] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState<string>("")
    const [isDragActive, setIsDragActive] = useState(false)
    const fileInputRef = useRef<HTMLInputElement>(null)

    const handleResultSelection = (index: number, checked: boolean) => {
        const newSelected = new Set(selectedResults)
        if (checked) {
            newSelected.add(index)
        } else {
            newSelected.delete(index)
        }
        setSelectedResults(newSelected)
    }

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

            const wordsToInsert = selectedData.map((result) => ({
                lemma: result.word,
                lang: targetLanguage,
                collocations: result.collocations,
            }))

            const processedWords = await bulkUpsertWords(wordsToInsert)

            alert(
                `Successfully processed ${processedWords.length} words (inserted/updated)!`
            )

            setSelectedResults(new Set())
            setParsedResults([])
            setUploadedFile(null)
            setUploadedContent("")
            setTargetLanguage("")
        } catch (error) {
            console.error("Error adding words to database:", error)
            alert(
                `Error adding words: ${error instanceof Error ? error.message : "Unknown error"}`
            )
        } finally {
            setIsProcessing(false)
        }
    }

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        if (!file) return
        await processFile(file)
    }

    const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(true)
    }

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)
    }

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
    }

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault()
        e.stopPropagation()
        setIsDragActive(false)
        const files = e.dataTransfer.files
        if (files.length > 0) {
            processFile(files[0])
        }
    }

    const processFile = async (file: File) => {

        try {
            const text = await file.text()
            setUploadedContent(text)

            // Detect language from filename (optional, user can override with combobox)
            const filenameMatch = file.name.match(/batch_words_([a-z]{2})/)
            if (filenameMatch) {
                setTargetLanguage(filenameMatch[1])
            }

            const lines = text.split("\n").filter((line) => line.trim())
            const parsed = lines.map((line: string, index: number) => {
                try {
                    const raw_data = JSON.parse(line)
                    const content = JSON.parse(raw_data.response.body.output[1].content[0].text)
                    const processed_data: ParsedResult = {
                        word: raw_data.custom_id,
                        tokens: raw_data.response.body.usage.total_tokens,
                        output: raw_data.response.body.output[1].content[0].text,
                        collocations: content
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

            setParsedResults(parsed)
        } catch (error) {
            console.error("Error reading file:", error)
            alert("Error reading file")
        }
    }

    const handleParseResults = async () => {
        if (!targetLanguage) {
            alert("Please select a target language first")
            return
        }

        const validResults = parsedResults.filter((r): r is ParsedResult => !("error" in r))
        const existingWordsMap = await checkExistingWords(
            validResults.map((r) => ({ lemma: r.word, lang: targetLanguage }))
        )

        const enrichedParsed = parsedResults.map((result) => {
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

        const validIndices = new Set<number>()
        enrichedParsed.forEach((result: ParsedResultType, index: number) => {
            if (!("error" in result)) {
                validIndices.add(index)
            }
        })
        setSelectedResults(validIndices)
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center gap-3 mt-4">
                <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                    <UploadCloud className="h-6 w-6 text-primary" />
                </div>
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Upload Batch Results</h1>
                    <p className="text-muted-foreground">
                        Upload processed JSONL files from OpenAI
                    </p>
                </div>
            </div>

            <div className="space-y-4">
                <div
                    onDragEnter={handleDragEnter}
                    onDragLeave={handleDragLeave}
                    onDragOver={handleDragOver}
                    onDrop={handleDrop}
                    className={`relative rounded-lg border-2 border-dashed transition-all ${isDragActive
                        ? "border-primary bg-primary/5"
                        : "border-muted-foreground/25 bg-muted/30 hover:border-primary/50 hover:bg-primary/5"
                        } p-8 text-center cursor-pointer`}
                >
                    <input
                        ref={fileInputRef}
                        type="file"
                        accept=".jsonl,.json"
                        onChange={handleFileUpload}
                        className="hidden"
                        id="file-upload"
                    />
                    <label htmlFor="file-upload" className="cursor-pointer block">
                        <div className="flex flex-col items-center gap-2">
                            <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-primary/10">
                                <UploadCloud className="h-8 w-8 text-primary" />
                            </div>
                            <div>
                                <p className="text-lg font-semibold text-foreground">
                                    {uploadedFile ? uploadedFile.name : "Drop your JSONL file here"}
                                </p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {uploadedFile
                                        ? `${(uploadedFile.size / 1024).toFixed(2)} KB`
                                        : "or click to browse"}
                                </p>
                            </div>
                        </div>
                    </label>

                    {uploadedFile && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => {
                                setUploadedFile(null)
                                setUploadedContent("")
                                setParsedResults([])
                                setSelectedResults(new Set())
                                setTargetLanguage("")
                            }}
                            className="absolute top-3 right-3"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    )}
                </div>

                {uploadedContent && (
                    <div className="space-y-4">
                        <Separator />

                        <div className="grid gap-4 sm:grid-cols-2">
                            <div>
                                <label className="text-sm font-medium">Target Language</label>
                                <Select value={targetLanguage} onValueChange={setTargetLanguage}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select a language..." />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {LANGUAGES.map((lang) => (
                                            <SelectItem key={lang.code} value={lang.code}>
                                                {lang.name} ({lang.nativeName})
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>
                            <div className="flex items-end">
                                <Button
                                    onClick={handleParseResults}
                                    disabled={!targetLanguage || parsedResults.length === 0}
                                    className="w-full"
                                >
                                    Parse & Check for Duplicates
                                </Button>
                            </div>
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
                            className="w-full"
                            onClick={handlePostProcess}
                            disabled={selectedResults.size === 0 || isProcessing}
                        >
                            {isProcessing ? "Adding to database..." : `Add to database (${selectedResults.size} selected)`}
                        </Button>

                        <Separator />

                        <div>
                            <h3 className="text-lg font-semibold mb-2">Parsed Results ({parsedResults.length} total)</h3>
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


                    </div>
                )}
            </div>
        </div>
    )
}
