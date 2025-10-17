"use client"

import { Button } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { UploadCloud } from "lucide-react"
import { useState } from "react"
import { bulkUpsertWords, checkExistingWords } from "@/lib/words/client-utils"
import { LANGUAGES } from "@/lib/constants/languages"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import type { ParsedResultType, ParsedResult } from "@/lib/types/words"
import { JsonlUploadZone } from "@/components/jsonl-upload-zone"
import { ParsedResultsDisplay } from "@/components/parsed-results-display"
import { SelectionToolbar } from "@/components/selection-toolbar"
import { AlertDialog } from "@/components/alert-dialog"
import { useResultSelection } from "@/hooks/use-result-selection"
import { useAlert } from "@/hooks/use-alert"
import {
    parseBatchFile,
    detectLanguageFromFilename,
    filterValidResults,
} from "@/lib/words/parse-batch-results"

export default function UploadWordsPage() {
    const [uploadedFile, setUploadedFile] = useState<File | null>(null)
    const [uploadedContent, setUploadedContent] = useState<string>("")
    const [parsedResults, setParsedResults] = useState<ParsedResultType[]>([])
    const [isProcessing, setIsProcessing] = useState(false)
    const [targetLanguage, setTargetLanguage] = useState<string>("")
    const [isDragActive, setIsDragActive] = useState(false)

    const { selectedResults, toggleResult, selectAll, deselectAll, invertSelection, selectOnlyNewWords, selectOnlyExisting, reset } = useResultSelection()
    const { alert, showAlert, closeAlert } = useAlert()

    const handleFileUpload = async (file: File) => {
        try {
            const text = await file.text()
            setUploadedFile(file)
            setUploadedContent(text)

            // Detect language from filename
            const detectedLang = detectLanguageFromFilename(file.name)
            if (detectedLang) {
                setTargetLanguage(detectedLang)
            }

            // Parse batch results
            const parsed = parseBatchFile(text)
            setParsedResults(parsed)
        } catch (error) {
            showAlert(
                `Error reading file: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error",
                "File Read Error"
            )
        }
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
            handleFileUpload(files[0])
        }
    }

    const handleClearUpload = () => {
        setUploadedFile(null)
        setUploadedContent("")
        setParsedResults([])
        reset()
        setTargetLanguage("")
    }

    const handleParseResults = async () => {
        if (!targetLanguage) {
            showAlert("Please select a target language first", "error", "Language Required")
            return
        }

        const validResults = filterValidResults(parsedResults)
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

        // Auto-select all valid results
        selectAll(enrichedParsed)
    }

    const handlePostProcess = async () => {
        setIsProcessing(true)
        try {
            const selectedData = Array.from(selectedResults).map(
                (index) => parsedResults[index]
            ).filter((r): r is ParsedResult => !("error" in r))

            if (selectedData.length === 0) {
                showAlert("No valid results selected", "error", "Selection Empty")
                return
            }

            const wordsToInsert = selectedData.map((result) => ({
                lemma: result.word,
                lang: targetLanguage,
                collocations: result.collocations,
            }))

            const processedWords = await bulkUpsertWords(wordsToInsert)

            showAlert(
                `Successfully processed ${processedWords.length} words (inserted/updated)!`,
                "success",
                "Upload Complete"
            )

            handleClearUpload()
        } catch (error) {
            showAlert(
                `Error adding words: ${error instanceof Error ? error.message : "Unknown error"}`,
                "error",
                "Database Error"
            )
        } finally {
            setIsProcessing(false)
        }
    }

    return (
        <>
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
                    <JsonlUploadZone
                        onFileUpload={handleFileUpload}
                        uploadedFile={uploadedFile}
                        onClear={handleClearUpload}
                        isDragActive={isDragActive}
                        onDragEnter={handleDragEnter}
                        onDragLeave={handleDragLeave}
                        onDragOver={handleDragOver}
                        onDrop={handleDrop}
                    />

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

                            <SelectionToolbar
                                onSelectAll={() => selectAll(parsedResults)}
                                onDeselectAll={deselectAll}
                                onInvertSelection={() => invertSelection(parsedResults)}
                                onSelectOnlyNewWords={() => selectOnlyNewWords(parsedResults)}
                                onSelectOnlyExisting={() => selectOnlyExisting(parsedResults)}
                            />

                            <Separator className="my-4" />

                            <Button
                                className="w-full"
                                onClick={handlePostProcess}
                                disabled={selectedResults.size === 0 || isProcessing}
                            >
                                {isProcessing ? "Adding to database..." : `Add to database (${selectedResults.size} selected)`}
                            </Button>

                            <Separator />

                            <ParsedResultsDisplay
                                results={parsedResults}
                                selectedResults={selectedResults}
                                onToggleResult={toggleResult}
                            />
                        </div>
                    )}
                </div>
            </div>

            <AlertDialog
                isOpen={alert.isOpen}
                title={alert.title}
                message={alert.message}
                type={alert.type}
                onConfirm={alert.onConfirm}
                onClose={closeAlert}
            />
        </>
    )
}
