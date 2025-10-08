"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { generateWordDetails } from "@/lib/ai/word-generator"
import { LANGUAGES } from "@/lib/constants/languages"
import { createClient } from "@/lib/supabase/client"
import { Plus, Sparkles, Trash2, TypeOutline } from "lucide-react"
import { useState } from "react"

interface Collocation {
    id: string
    word: string
    example: string
}

const DIFFICULTY_LEVELS = [
    { value: "beginner", label: "Beginner" },
    { value: "elementary", label: "Elementary" },
    { value: "intermediate", label: "Intermediate" },
    { value: "upper_intermediate", label: "Upper Intermediate" },
    { value: "advanced", label: "Advanced" },
    { value: "proficient", label: "Proficient" },
]

export default function AddWordPage() {
    const [inputWord, setInputWord] = useState("")
    const [lemma, setLemma] = useState("")
    const [language, setLanguage] = useState("")
    const [difficultyLevel, setDifficultyLevel] = useState("")
    const [collocations, setCollocations] = useState<Collocation[]>([])
    const [generating, setGenerating] = useState(false)
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const [isGenerated, setIsGenerated] = useState(false)

    const handleGenerate = async () => {
        if (!inputWord.trim()) {
            setError("Please enter a word")
            return
        }

        setGenerating(true)
        setError("")

        try {
            const generated = await generateWordDetails(inputWord)

            // Set the generated values
            setLemma(generated.lemma)
            setLanguage(generated.lang)
            setDifficultyLevel(generated.difficulty_level)

            // Convert collocations to the format with IDs
            const generatedCollocations = generated.collocations.map((col) => ({
                id: crypto.randomUUID(),
                word: col.word,
                example: col.example,
            }))
            setCollocations(generatedCollocations)
            setIsGenerated(true)
        } catch (err) {
            console.error("Error generating word details:", err)
            setError(err instanceof Error ? err.message : "Failed to generate word details")
        } finally {
            setGenerating(false)
        }
    }

    const addCollocation = () => {
        setCollocations([
            ...collocations,
            {
                id: crypto.randomUUID(),
                word: "",
                example: "",
            },
        ])
    }

    const removeCollocation = (id: string) => {
        setCollocations(collocations.filter((col) => col.id !== id))
    }

    const updateCollocation = (id: string, field: "word" | "example", value: string) => {
        setCollocations(
            collocations.map((col) =>
                col.id === id ? { ...col, [field]: value } : col
            )
        )
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")

        // Validation
        if (!lemma.trim()) {
            setError("Lemma is required")
            return
        }

        if (!language) {
            setError("Language is required")
            return
        }

        if (!difficultyLevel) {
            setError("Difficulty level is required")
            return
        }

        // Validate collocations
        const validCollocations = collocations.filter(
            (col) => col.word.trim() && col.example.trim()
        )

        setLoading(true)

        try {
            const supabase = createClient()

            // Prepare collocations data
            const collocationsData = validCollocations.map((col) => ({
                word: col.word.trim(),
                example: col.example.trim(),
            }))

            const { data, error: insertError } = await supabase
                .from("words")
                .insert({
                    lemma: lemma.trim(),
                    lang: language,
                    difficulty_level: difficultyLevel,
                    collocations: collocationsData.length > 0 ? collocationsData : null,
                })
                .select()
                .single()

            if (insertError) {
                throw insertError
            }

            setSuccess("Word added successfully!")

            // Reset form
            setInputWord("")
            setLemma("")
            setLanguage("")
            setDifficultyLevel("")
            setCollocations([])
            setIsGenerated(false)

            // Clear success message after 3 seconds
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            console.error("Error adding word:", err)
            setError(err instanceof Error ? err.message : "Failed to add word")
        } finally {
            setLoading(false)
        }
    }

    return (
        <div className="flex flex-1 flex-col gap-4 p-4 pt-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3 mt-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                        <TypeOutline className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-3xl font-bold tracking-tight">Add Word</h1>
                        <p className="text-muted-foreground">
                            Add a new word to the database with collocations
                        </p>
                    </div>
                </div>
            </div>

            <Card>
                <CardHeader>
                    <CardTitle>Word Details</CardTitle>
                    <CardDescription>
                        Fill in the word information and add collocations
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    {/* AI Generation Step */}
                    {!isGenerated ? (
                        <div className="space-y-4">
                            <div className="space-y-2">
                                <Label htmlFor="inputWord">
                                    Enter Word <span className="text-destructive">*</span>
                                </Label>
                                <div className="flex gap-2">
                                    <Input
                                        id="inputWord"
                                        placeholder="Enter a word to generate details"
                                        value={inputWord}
                                        onChange={(e) => setInputWord(e.target.value)}
                                        disabled={generating}
                                        onKeyDown={(e) => {
                                            if (e.key === "Enter") {
                                                e.preventDefault()
                                                handleGenerate()
                                            }
                                        }}
                                    />
                                    <Button
                                        type="button"
                                        onClick={handleGenerate}
                                        disabled={generating || !inputWord.trim()}
                                    >
                                        {generating ? (
                                            <>Generating...</>
                                        ) : (
                                            <>
                                                <Sparkles className="mr-2 h-4 w-4" />
                                                Generate
                                            </>
                                        )}
                                    </Button>
                                </div>
                                <p className="text-sm text-muted-foreground">
                                    AI will automatically generate language, difficulty level, and collocations
                                </p>
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            {/* Lemma */}
                            <div className="space-y-2">
                                <Label htmlFor="lemma">
                                    Lemma <span className="text-destructive">*</span>
                                </Label>
                                <Input
                                    id="lemma"
                                    placeholder="Enter the word"
                                    value={lemma}
                                    onChange={(e) => setLemma(e.target.value)}
                                    disabled={loading}
                                />
                            </div>

                            {/* Language */}
                            <div className="space-y-2">
                                <Label htmlFor="language">
                                    Language <span className="text-destructive">*</span>
                                </Label>
                                <Select value={language} onValueChange={setLanguage} disabled={loading}>
                                    <SelectTrigger id="language">
                                        <SelectValue placeholder="Select language" />
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

                            {/* Difficulty Level */}
                            <div className="space-y-2">
                                <Label htmlFor="difficulty">
                                    Difficulty Level <span className="text-destructive">*</span>
                                </Label>
                                <Select
                                    value={difficultyLevel}
                                    onValueChange={setDifficultyLevel}
                                    disabled={loading}
                                >
                                    <SelectTrigger id="difficulty">
                                        <SelectValue placeholder="Select difficulty level" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {DIFFICULTY_LEVELS.map((level) => (
                                            <SelectItem key={level.value} value={level.value}>
                                                {level.label}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Collocations */}
                            <div className="space-y-4">
                                <div className="flex items-center justify-between">
                                    <Label>Collocations</Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addCollocation}
                                        disabled={loading}
                                    >
                                        <Plus className="mr-2 h-4 w-4" />
                                        Add Collocation
                                    </Button>
                                </div>

                                {collocations.length > 0 && (
                                    <div className="space-y-4">
                                        {collocations.map((collocation, index) => (
                                            <Card key={collocation.id}>
                                                <CardContent className="pt-6">
                                                    <div className="space-y-4">
                                                        <div className="flex items-start justify-between">
                                                            <h4 className="text-sm font-medium">
                                                                Collocation {index + 1}
                                                            </h4>
                                                            <Button
                                                                type="button"
                                                                variant="ghost"
                                                                size="sm"
                                                                onClick={() =>
                                                                    removeCollocation(collocation.id)
                                                                }
                                                                disabled={loading}
                                                            >
                                                                <Trash2 className="h-4 w-4 text-destructive" />
                                                            </Button>
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`word-${collocation.id}`}>
                                                                Word
                                                            </Label>
                                                            <Input
                                                                id={`word-${collocation.id}`}
                                                                placeholder="e.g., make a decision"
                                                                value={collocation.word}
                                                                onChange={(e) =>
                                                                    updateCollocation(
                                                                        collocation.id,
                                                                        "word",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                disabled={loading}
                                                            />
                                                        </div>

                                                        <div className="space-y-2">
                                                            <Label htmlFor={`example-${collocation.id}`}>
                                                                Example Sentence
                                                            </Label>
                                                            <Input
                                                                id={`example-${collocation.id}`}
                                                                placeholder="e.g., I need to make a decision about my future"
                                                                value={collocation.example}
                                                                onChange={(e) =>
                                                                    updateCollocation(
                                                                        collocation.id,
                                                                        "example",
                                                                        e.target.value
                                                                    )
                                                                }
                                                                disabled={loading}
                                                            />
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Error message */}
                            {error && (
                                <div className="rounded-md bg-destructive/15 p-3 text-sm text-destructive">
                                    {error}
                                </div>
                            )}

                            {/* Success message */}
                            {success && (
                                <div className="rounded-md bg-green-500/15 p-3 text-sm text-green-600 dark:text-green-400">
                                    {success}
                                </div>
                            )}

                            {/* Action buttons */}
                            <div className="flex gap-2">
                                <Button
                                    type="button"
                                    variant="outline"
                                    onClick={() => {
                                        setIsGenerated(false)
                                        setInputWord("")
                                        setLemma("")
                                        setLanguage("")
                                        setDifficultyLevel("")
                                        setCollocations([])
                                        setError("")
                                    }}
                                    disabled={loading}
                                >
                                    Start Over
                                </Button>
                                <Button type="submit" disabled={loading} className="flex-1">
                                    {loading ? "Adding Word..." : "Save Word to Database"}
                                </Button>
                            </div>
                        </form>
                    )}
                </CardContent>
            </Card>
        </div>
    )
}
