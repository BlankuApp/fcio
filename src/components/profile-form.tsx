"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { checkAuth } from "@/lib/auth/utils"
import { getLanguageDisplayName, LANGUAGES, PROFICIENCY_LEVELS, type TargetLanguage } from "@/lib/constants/languages"
import { getDefaultPrompts, type DefaultPrompts, type PromptMessage } from "@/lib/constants/default-prompts"
import { getCurrentUserProfile, updateUserProfile } from "@/lib/user-profile/client-utils"
import { getUserProfileFromStorage } from "@/lib/user-profile/browser-storage"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function ProfileForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [motherTongues, setMotherTongues] = useState<string[]>([])
    const [targetLanguages, setTargetLanguages] = useState<TargetLanguage[]>([])
    const [prompts, setPrompts] = useState<DefaultPrompts>(getDefaultPrompts())
    const [error, setError] = useState("")
    const [success, setSuccess] = useState("")
    const router = useRouter()

    useEffect(() => {
        const loadProfile = async () => {
            setLoading(true)
            const authStatus = await checkAuth()

            if (!authStatus.isAuthenticated || !authStatus.user) {
                router.push('/')
                return
            }

            try {
                // First try to load from localStorage
                const storedProfile = getUserProfileFromStorage()
                if (storedProfile) {
                    setEmail(storedProfile.email)
                    setUsername(storedProfile.username)
                    setMotherTongues(storedProfile.mother_tongues)
                    setTargetLanguages(storedProfile.target_languages)
                    setPrompts(storedProfile.prompts || getDefaultPrompts())
                } else {
                    // If no profile in localStorage, try to get from Supabase
                    const profile = await getCurrentUserProfile()
                    if (profile) {
                        setEmail(profile.email)
                        setUsername(profile.username)
                        setMotherTongues(profile.mother_tongues)
                        setTargetLanguages(profile.target_languages)
                        setPrompts(profile.prompts || getDefaultPrompts())
                    } else {
                        // Profile doesn't exist yet, use basic auth info
                        setEmail(authStatus.user.email || "")
                        setUsername("")
                        setMotherTongues([])
                        setTargetLanguages([])
                        setPrompts(getDefaultPrompts())
                    }
                }
            } catch (error) {
                console.error('Error loading profile:', error)
                setError('Failed to load profile')
            }

            setLoading(false)
        }

        loadProfile()
    }, [router])

    const toggleLanguage = (languageCode: string) => {
        setMotherTongues(prev => {
            if (prev.includes(languageCode)) {
                return prev.filter(code => code !== languageCode)
            } else {
                return [...prev, languageCode]
            }
        })
    }

    const addTargetLanguage = () => {
        setTargetLanguages(prev => [...prev, { languageCode: "", proficiency: "" }])
    }

    const removeTargetLanguage = (index: number) => {
        setTargetLanguages(prev => prev.filter((_, i) => i !== index))
    }

    const updateTargetLanguage = (index: number, field: keyof TargetLanguage, value: string) => {
        setTargetLanguages(prev => {
            const updated = [...prev]
            updated[index] = { ...updated[index], [field]: value }
            return updated
        })
    }

    const updatePromptMessage = (
        promptKey: keyof DefaultPrompts,
        messageIndex: number,
        field: keyof PromptMessage,
        value: string
    ) => {
        setPrompts(prev => {
            const updated = { ...prev }
            const messages = [...updated[promptKey]]
            messages[messageIndex] = { ...messages[messageIndex], [field]: value }
            updated[promptKey] = messages
            return updated
        })
    }

    const resetPromptsToDefault = () => {
        setPrompts(getDefaultPrompts())
        setSuccess("Prompts reset to default values")
        setTimeout(() => setSuccess(""), 3000)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        setError("")
        setSuccess("")
        setSaving(true)

        try {
            // Validate at least one mother tongue
            if (motherTongues.length === 0) {
                setError("Please select at least one mother tongue")
                setSaving(false)
                return
            }

            // Validate at least one target language
            if (targetLanguages.length === 0) {
                setError("Please add at least one language you want to learn")
                setSaving(false)
                return
            }

            // Validate target languages are complete
            for (let i = 0; i < targetLanguages.length; i++) {
                const tl = targetLanguages[i]
                if (!tl.languageCode || !tl.proficiency) {
                    setError(`Please complete all fields for target language ${i + 1}`)
                    setSaving(false)
                    return
                }
            }

            // Get current user ID
            const authStatus = await checkAuth()
            if (!authStatus.isAuthenticated || !authStatus.user) {
                setError("Authentication required")
                setSaving(false)
                return
            }

            // Try to update existing profile, or create new one if it doesn't exist
            try {
                await updateUserProfile(authStatus.user.id, {
                    username: username,
                    mother_tongues: motherTongues,
                    target_languages: targetLanguages,
                    prompts: prompts,
                })
            } catch (updateError) {
                // If update fails, try to create a new profile
                // try {
                //     await createUserProfile({
                //         id: authStatus.user.id,
                //         email: authStatus.user.email || '',
                //         username: username,
                //         mother_tongues: motherTongues,
                //         target_languages: targetLanguages,
                //     })
                // } catch (createError) {
                //     throw createError
                // }
                throw updateError
            }

            setSuccess("Profile updated successfully!")
            setTimeout(() => setSuccess(""), 3000)
        } catch (err) {
            setError(err instanceof Error ? err.message : "An unexpected error occurred")
            console.error(err)
        } finally {
            setSaving(false)
        }
    }

    if (loading) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle>Loading...</CardTitle>
                </CardHeader>
                <CardContent>
                    <div className="flex items-center justify-center p-8">
                        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
                    </div>
                </CardContent>
            </Card>
        )
    }

    return (
        <form onSubmit={handleSubmit} className="space-y-6">
            {/* Account Information */}
            <Card>
                <CardHeader>
                    <CardTitle>Account Information</CardTitle>
                    <CardDescription>Your basic account details</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            value={email}
                            disabled
                            className="bg-muted"
                        />
                        <p className="text-xs text-muted-foreground">Email cannot be changed</p>
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="username">Username</Label>
                        <Input
                            id="username"
                            type="text"
                            placeholder="johndoe"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            required
                        />
                    </div>
                </CardContent>
            </Card>

            {/* Mother Tongues */}
            <Card>
                <CardHeader>
                    <CardTitle>Mother Tongue(s)</CardTitle>
                    <CardDescription>Languages you speak natively</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="border rounded-md p-4 max-h-[300px] overflow-y-auto space-y-3">
                        {LANGUAGES.map((lang) => (
                            <div key={lang.code} className="flex items-center space-x-2">
                                <Checkbox
                                    id={`profile-lang-${lang.code}`}
                                    checked={motherTongues.includes(lang.code)}
                                    onCheckedChange={() => toggleLanguage(lang.code)}
                                />
                                <label
                                    htmlFor={`profile-lang-${lang.code}`}
                                    className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer"
                                >
                                    {getLanguageDisplayName(lang)}
                                </label>
                            </div>
                        ))}
                    </div>
                    {motherTongues.length > 0 && (
                        <p className="text-xs text-muted-foreground">
                            Selected: {motherTongues.length} language{motherTongues.length > 1 ? 's' : ''}
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Target Languages */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>Languages to Learn</CardTitle>
                            <CardDescription>Languages you&apos;re currently studying</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={addTargetLanguage}
                        >
                            + Add Language
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    {targetLanguages.length > 0 ? (
                        <div className="space-y-4">
                            {targetLanguages.map((tl, index) => (
                                <div key={index} className="space-y-2 pb-4 border-b last:border-b-0 last:pb-0">
                                    <div className="flex items-center justify-between">
                                        <span className="text-sm font-medium">Language {index + 1}</span>
                                        <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTargetLanguage(index)}
                                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                        >
                                            ×
                                        </Button>
                                    </div>
                                    <div className="grid grid-cols-2 gap-3">
                                        <Select
                                            value={tl.languageCode}
                                            onValueChange={(value) => updateTargetLanguage(index, 'languageCode', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select language" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {LANGUAGES.filter(lang => !motherTongues.includes(lang.code)).map((lang) => (
                                                    <SelectItem key={lang.code} value={lang.code}>
                                                        {getLanguageDisplayName(lang)}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                        <Select
                                            value={tl.proficiency}
                                            onValueChange={(value) => updateTargetLanguage(index, 'proficiency', value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select proficiency" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {PROFICIENCY_LEVELS.map((level) => (
                                                    <SelectItem key={level.value} value={level.value}>
                                                        {level.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>
                                </div>
                            ))}
                        </div>
                    ) : (
                        <p className="text-sm text-muted-foreground text-center py-8">
                            No languages added yet. Click &ldquo;+ Add Language&rdquo; to get started.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* AI Prompts */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle>AI Prompts</CardTitle>
                            <CardDescription>Customize how AI assists you in learning</CardDescription>
                        </div>
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={resetPromptsToDefault}
                        >
                            Reset to Default
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <Accordion type="single" collapsible className="w-full">
                        {/* Flashcard Generation Prompt */}
                        <AccordionItem value="flashcard_generation">
                            <AccordionTrigger>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-semibold">Flashcard Generation</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        How AI creates flashcards for vocabulary learning
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2">
                                {prompts.flashcard_generation.map((message, index) => (
                                    <div key={index} className="space-y-2 border-l-2 border-primary/20 pl-4">
                                        <Label className="text-xs font-medium uppercase text-muted-foreground">
                                            {message.role}
                                        </Label>
                                        <Textarea
                                            value={message.content}
                                            onChange={(e) => updatePromptMessage('flashcard_generation', index, 'content', e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Word Explanation Prompt */}
                        <AccordionItem value="word_explanation">
                            <AccordionTrigger>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-semibold">Word Explanation</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        How AI explains words and phrases
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2">
                                {prompts.word_explanation.map((message, index) => (
                                    <div key={index} className="space-y-2 border-l-2 border-primary/20 pl-4">
                                        <Label className="text-xs font-medium uppercase text-muted-foreground">
                                            {message.role}
                                        </Label>
                                        <Textarea
                                            value={message.content}
                                            onChange={(e) => updatePromptMessage('word_explanation', index, 'content', e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Sentence Creation Prompt */}
                        <AccordionItem value="sentence_creation">
                            <AccordionTrigger>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-semibold">Sentence Creation</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        How AI creates example sentences
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2">
                                {prompts.sentence_creation.map((message, index) => (
                                    <div key={index} className="space-y-2 border-l-2 border-primary/20 pl-4">
                                        <Label className="text-xs font-medium uppercase text-muted-foreground">
                                            {message.role}
                                        </Label>
                                        <Textarea
                                            value={message.content}
                                            onChange={(e) => updatePromptMessage('sentence_creation', index, 'content', e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>

                        {/* Translation Prompt */}
                        <AccordionItem value="translation">
                            <AccordionTrigger>
                                <div className="flex flex-col items-start text-left">
                                    <span className="font-semibold">Translation</span>
                                    <span className="text-xs text-muted-foreground font-normal">
                                        How AI translates text
                                    </span>
                                </div>
                            </AccordionTrigger>
                            <AccordionContent className="space-y-3 pt-2">
                                {prompts.translation.map((message, index) => (
                                    <div key={index} className="space-y-2 border-l-2 border-primary/20 pl-4">
                                        <Label className="text-xs font-medium uppercase text-muted-foreground">
                                            {message.role}
                                        </Label>
                                        <Textarea
                                            value={message.content}
                                            onChange={(e) => updatePromptMessage('translation', index, 'content', e.target.value)}
                                            rows={3}
                                            className="text-sm"
                                        />
                                    </div>
                                ))}
                            </AccordionContent>
                        </AccordionItem>
                    </Accordion>
                </CardContent>
            </Card>

            {/* Error/Success Messages */}
            {error && (
                <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md p-3">
                    {error}
                </div>
            )}

            {success && (
                <div className="text-sm text-green-600 bg-green-50 border border-green-200 rounded-md p-3">
                    {success}
                </div>
            )}

            {/* Submit Button */}
            <div className="flex items-center justify-end gap-4">
                <Button
                    type="button"
                    variant="outline"
                    onClick={() => router.push('/')}
                >
                    Cancel
                </Button>
                <Button type="submit" disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                </Button>
            </div>
        </form>
    )
}
