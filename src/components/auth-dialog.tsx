"use client"

import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select"
import { signIn, signUp } from "@/lib/auth/utils"
import { getLanguageDisplayName, LANGUAGES, PROFICIENCY_LEVELS, type TargetLanguage } from "@/lib/constants/languages"
import { getCurrentUserProfile } from "@/lib/user-profile/client-utils"
import { saveUserProfileToStorage } from "@/lib/user-profile/browser-storage"
import { useRouter } from "next/navigation"
import { useState } from "react"

interface AuthDialogProps {
    open: boolean
    onOpenChange: (open: boolean) => void
}

export function AuthDialog({ open, onOpenChange }: AuthDialogProps) {
    const [mode, setMode] = useState<"login" | "signup">("login")
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [username, setUsername] = useState("")
    const [motherTongues, setMotherTongues] = useState<string[]>([])
    const [targetLanguages, setTargetLanguages] = useState<TargetLanguage[]>([])
    const [error, setError] = useState("")
    const [loading, setLoading] = useState(false)
    const [success, setSuccess] = useState(false)
    const router = useRouter()

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
        setLoading(true)

        // Add timeout to prevent infinite loading
        const timeoutId = setTimeout(() => {
            console.log('AuthDialog: Login timeout reached')
            setLoading(false)
            setError("Login is taking too long. Please try again.")
        }, 10000) // 10 second timeout

        try {
            if (mode === "login") {
                console.log('AuthDialog: Starting login process...')
                const result = await signIn(email, password)
                console.log('AuthDialog: Login result:', result)
                
                clearTimeout(timeoutId) // Clear timeout on successful response
                
                if (result.success) {
                    console.log('AuthDialog: Login successful, fetching profile...')
                    
                    // Fetch and save user profile to localStorage
                    try {
                        const profile = await getCurrentUserProfile()
                        if (profile) {
                            saveUserProfileToStorage(profile)
                            console.log('AuthDialog: Profile saved to localStorage')
                        }
                    } catch (error) {
                        console.error('AuthDialog: Failed to fetch/save profile:', error)
                    }
                    
                    setSuccess(true)
                    onOpenChange(false)
                    router.refresh()
                } else {
                    console.log('AuthDialog: Login failed:', result.error)
                    setError(result.error || "Failed to sign in")
                }
            } else {
                // Validate at least one mother tongue is selected
                if (motherTongues.length === 0) {
                    setError("Please select at least one mother tongue")
                    setLoading(false)
                    return
                }

                // Validate at least one target language is added
                if (targetLanguages.length === 0) {
                    setError("Please add at least one language you want to learn")
                    setLoading(false)
                    return
                }

                // Validate target languages are complete
                for (let i = 0; i < targetLanguages.length; i++) {
                    const tl = targetLanguages[i]
                    if (!tl.languageCode || !tl.proficiency) {
                        setError(`Please complete all fields for target language ${i + 1}`)
                        setLoading(false)
                        return
                    }
                }

                const result = await signUp(email, password, username, motherTongues, targetLanguages)
                
                clearTimeout(timeoutId) // Clear timeout on successful response
                
                if (result.success) {
                    setSuccess(true)
                    setError("")
                    // Show success message for email verification
                    setError("Success! Please check your email to verify your account.")
                    setTimeout(() => {
                        onOpenChange(false)
                        setMode("login")
                    }, 3000)
                } else {
                    setError(result.error || "Failed to sign up")
                }
            }
        } catch (err) {
            clearTimeout(timeoutId) // Clear timeout on error
            setError("An unexpected error occurred")
            console.error('AuthDialog: Unexpected error:', err)
        } finally {
            setLoading(false)
        }
    }

    const resetForm = () => {
        setEmail("")
        setPassword("")
        setUsername("")
        setMotherTongues([])
        setTargetLanguages([])
        setError("")
        setSuccess(false)
    }

    const switchMode = () => {
        setMode(mode === "login" ? "signup" : "login")
        resetForm()
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {mode === "login" ? "Welcome back" : "Create an account"}
                    </DialogTitle>
                    <DialogDescription>
                        {mode === "login"
                            ? "Enter your credentials to access your account"
                            : "Enter your details to create a new account"}
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    {mode === "signup" && (
                        <>
                            <div className="space-y-2">
                                <Label htmlFor="username">Username</Label>
                                <Input
                                    id="username"
                                    type="text"
                                    placeholder="johndoe"
                                    value={username}
                                    onChange={(e) => setUsername(e.target.value)}
                                    required={mode === "signup"}
                                />
                            </div>
                            <div className="space-y-2">
                                <Label>Mother Tongue(s) <span className="text-muted-foreground text-xs">(Select at least one)</span></Label>
                                <div className="border rounded-md p-4 max-h-[200px] overflow-y-auto space-y-3">
                                    {LANGUAGES.map((lang) => (
                                        <div key={lang.code} className="flex items-center space-x-2">
                                            <Checkbox
                                                id={`lang-${lang.code}`}
                                                checked={motherTongues.includes(lang.code)}
                                                onCheckedChange={() => toggleLanguage(lang.code)}
                                            />
                                            <label
                                                htmlFor={`lang-${lang.code}`}
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
                            </div>

                            <div className="space-y-2">
                                <div className="flex items-center justify-between">
                                    <Label>Languages to Learn <span className="text-muted-foreground text-xs">(Select at least one)</span></Label>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        onClick={addTargetLanguage}
                                        className="h-7 text-xs"
                                    >
                                        + Add Language
                                    </Button>
                                </div>
                                {targetLanguages.length > 0 && (
                                    <div className="space-y-3 border rounded-md p-4 max-h-[250px] overflow-y-auto">
                                        {targetLanguages.map((tl, index) => (
                                            <div key={index} className="space-y-2 pb-3 border-b last:border-b-0 last:pb-0">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm font-medium">Language {index + 1}</span>
                                                    <Button
                                                        type="button"
                                                        variant="ghost"
                                                        size="sm"
                                                        onClick={() => removeTargetLanguage(index)}
                                                        className="h-6 w-6 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                                                    >
                                                        ×
                                                    </Button>
                                                </div>
                                                <div className="grid grid-cols-2 gap-2">
                                                    <Select
                                                        value={tl.languageCode}
                                                        onValueChange={(value) => updateTargetLanguage(index, 'languageCode', value)}
                                                    >
                                                        <SelectTrigger>
                                                            <SelectValue placeholder="Language" />
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
                                                            <SelectValue placeholder="Proficiency" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {PROFICIENCY_LEVELS.map((level) => (
                                                                <SelectItem key={level.value} value={level.value}>
                                                                    <div className="flex flex-col">
                                                                        <span className="font-medium">{level.label}</span>
                                                                        <span className="text-xs text-muted-foreground">{level.description}</span>
                                                                    </div>
                                                                </SelectItem>
                                                            ))}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </>
                    )}

                    <div className="space-y-2">
                        <Label htmlFor="email">Email</Label>
                        <Input
                            id="email"
                            type="email"
                            placeholder="you@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="password">Password</Label>
                        <Input
                            id="password"
                            type="password"
                            placeholder="••••••••"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            required
                            minLength={6}
                        />
                    </div>

                    {error && (
                        <div className={`text-sm ${success ? 'text-green-600' : 'text-red-600'}`}>
                            {error}
                        </div>
                    )}

                    <Button type="submit" className="w-full" disabled={loading}>
                        {loading ? "Loading..." : mode === "login" ? "Sign In" : "Sign Up"}
                    </Button>
                </form>

                <div className="text-center text-sm">
                    {mode === "login" ? (
                        <p>
                            Don&apos;t have an account?{" "}
                            <button
                                type="button"
                                onClick={switchMode}
                                className="text-primary hover:underline"
                            >
                                Sign up
                            </button>
                        </p>
                    ) : (
                        <p>
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={switchMode}
                                className="text-primary hover:underline"
                            >
                                Sign in
                            </button>
                        </p>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    )
}
