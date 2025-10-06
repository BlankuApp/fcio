"use client"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { checkAuth } from "@/lib/auth/utils"
import { getLanguageDisplayName, LANGUAGES, PROFICIENCY_LEVELS, type TargetLanguage } from "@/lib/constants/languages"
import { getCurrentUserProfile, updateUserProfile, createUserProfile } from "@/lib/user-profile/client-utils"
import { useRouter } from "next/navigation"
import { useEffect, useState } from "react"

export function ProfileForm() {
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [email, setEmail] = useState("")
    const [username, setUsername] = useState("")
    const [motherTongues, setMotherTongues] = useState<string[]>([])
    const [targetLanguages, setTargetLanguages] = useState<TargetLanguage[]>([])
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
                const profile = await getCurrentUserProfile()
                if (profile) {
                    setEmail(profile.email)
                    setUsername(profile.username)
                    setMotherTongues(profile.mother_tongues)
                    setTargetLanguages(profile.target_languages)
                } else {
                    // Profile doesn't exist yet, use basic auth info
                    setEmail(authStatus.user.email || "")
                    setUsername("")
                    setMotherTongues([])
                    setTargetLanguages([])
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
                })
            } catch (updateError) {
                // If update fails, try to create a new profile
                try {
                    await createUserProfile({
                        id: authStatus.user.id,
                        email: authStatus.user.email || '',
                        username: username,
                        mother_tongues: motherTongues,
                        target_languages: targetLanguages,
                    })
                } catch (createError) {
                    throw createError
                }
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
