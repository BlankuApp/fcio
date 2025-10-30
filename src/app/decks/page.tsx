"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { Loader2 } from "lucide-react"
import { LANGUAGES, PROFICIENCY_LEVELS } from "@/lib/constants/languages"
import { createDeck } from "@/lib/decks/client-utils"
import { getCurrentUser } from "@/lib/auth/utils"
import type { CreateDeckInput } from "@/lib/types/deck"
import { PageHeader } from "@/components/page-header"
import { getDefaultAIPrompts } from "@/lib/constants/ai-prompts"

export default function NewDeckPage() {
    const router = useRouter()
    const [isLoading, setIsLoading] = useState(true)
    const [isCreating, setIsCreating] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [userId, setUserId] = useState<string | null>(null)
    const [formData, setFormData] = useState<CreateDeckInput>({
        name: "",
        que_lang: "en",
        ans_langs: ["es"],
        diff_level: "elementary",
        ai_prompts: getDefaultAIPrompts(),
    })

    // Check authentication on mount
    useEffect(() => {
        const checkAuth = async () => {
            try {
                const user = await getCurrentUser()
                if (!user) {
                    router.push("/")
                    return
                }
                setUserId(user.id)
                setIsLoading(false)
            } catch (err) {
                console.error("Auth check failed:", err)
                router.push("/")
            }
        }

        checkAuth()
    }, [router])

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-screen">
                <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!userId) {
        return null
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError(null)
        setIsCreating(true)

        try {
            // Validate form
            if (!formData.name.trim()) {
                throw new Error("Deck name is required")
            }

            if (formData.ans_langs.length === 0) {
                throw new Error("Please select at least one answer language")
            }

            const deck = await createDeck(userId, formData)
            router.push(`/decks/${deck.id}`)
        } catch (err) {
            setError(err instanceof Error ? err.message : "Failed to create deck")
        } finally {
            setIsCreating(false)
        }
    }

    const handleAnswerLangChange = (code: string) => {
        setFormData((prev) => {
            const ansLangs = prev.ans_langs.includes(code)
                ? prev.ans_langs.filter((l) => l !== code)
                : [...prev.ans_langs, code]
            return { ...prev, ans_langs: ansLangs }
        })
    }

    return (
        <>
            <PageHeader
                breadcrumbs={[
                    { label: "Decks", href: "/decks" },
                    { label: "New Deck" }
                ]}
            />
            <div className="flex flex-col gap-6 p-6">
                <div>
                    <h1 className="text-3xl font-bold tracking-tight">Create New Deck</h1>
                    <p className="text-muted-foreground mt-2">
                        Create a new flashcard deck to practice language learning
                    </p>
                </div>

            <Card className="w-full max-w-2xl">
                <CardHeader>
                    <CardTitle>Deck Details</CardTitle>
                    <CardDescription>
                        Configure your new deck settings
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="space-y-6">
                        {error && (
                            <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md text-sm">
                                {error}
                            </div>
                        )}

                        {/* Deck Name */}
                        <div className="space-y-2">
                            <Label htmlFor="name">Deck Name *</Label>
                            <Input
                                id="name"
                                placeholder="e.g., Spanish Vocabulary"
                                value={formData.name}
                                onChange={(e) =>
                                    setFormData((prev) => ({
                                        ...prev,
                                        name: e.target.value.slice(0, 50),
                                    }))
                                }
                                maxLength={50}
                                disabled={isCreating}
                            />
                            <p className="text-xs text-muted-foreground">
                                {formData.name.length}/50 characters
                            </p>
                        </div>

                        {/* Question Language */}
                        <div className="space-y-2">
                            <Label htmlFor="que_lang">Question Language *</Label>
                            <Select
                                value={formData.que_lang}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, que_lang: value }))
                                }
                                disabled={isCreating}
                            >
                                <SelectTrigger id="que_lang">
                                    <SelectValue />
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

                        {/* Answer Languages */}
                        <div className="space-y-3">
                            <Label>Answer Languages *</Label>
                            <p className="text-sm text-muted-foreground">
                                Select one or more languages for answers
                            </p>
                            <div className="grid grid-cols-2 gap-3">
                                {LANGUAGES.map((lang) => (
                                    <label
                                        key={lang.code}
                                        className="flex items-center gap-2 cursor-pointer"
                                    >
                                        <input
                                            type="checkbox"
                                            checked={formData.ans_langs.includes(lang.code)}
                                            onChange={() => handleAnswerLangChange(lang.code)}
                                            disabled={isCreating}
                                            className="rounded border-gray-300"
                                        />
                                        <span className="text-sm">
                                            {lang.name} ({lang.nativeName})
                                        </span>
                                    </label>
                                ))}
                            </div>
                            {formData.ans_langs.length === 0 && (
                                <p className="text-sm text-destructive">
                                    Select at least one answer language
                                </p>
                            )}
                        </div>

                        {/* Difficulty Level */}
                        <div className="space-y-2">
                            <Label htmlFor="diff_level">Difficulty Level *</Label>
                            <Select
                                value={formData.diff_level}
                                onValueChange={(value) =>
                                    setFormData((prev) => ({ ...prev, diff_level: value as typeof formData.diff_level }))
                                }
                                disabled={isCreating}
                            >
                                <SelectTrigger id="diff_level">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {PROFICIENCY_LEVELS.map((level) => (
                                        <SelectItem key={level.value} value={level.value}>
                                            {level.label} - {level.description}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Submit Button */}
                        <div className="flex gap-3 pt-4">
                            <Button
                                type="submit"
                                disabled={isCreating || formData.ans_langs.length === 0}
                            >
                                {isCreating ? "Creating..." : "Create Deck"}
                            </Button>
                            <Button
                                type="button"
                                variant="outline"
                                onClick={() => router.back()}
                                disabled={isCreating}
                            >
                                Cancel
                            </Button>
                        </div>
                    </form>
                </CardContent>
            </Card>
        </div>
        </>
    )
}
